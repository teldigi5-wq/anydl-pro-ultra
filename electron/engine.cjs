'use strict';
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, execFile } = require('child_process');

const IS_WIN = process.platform === 'win32';

// ---------------------------------------------------------------------------
// Binary resolution: prefer bundled yt-dlp.exe / ffmpeg.exe / ffprobe.exe
// shipped in resources/bin, fall back to whatever is on PATH.
// ---------------------------------------------------------------------------
function bundledBinDir() {
  // Packaged app: resources/bin sits next to the asar (extraResources).
  // Dev mode: <project>/resources/bin
  const packaged = path.join(process.resourcesPath || '', 'bin');
  const dev = path.join(__dirname, '..', 'resources', 'bin');
  if (app.isPackaged && fs.existsSync(packaged)) return packaged;
  if (fs.existsSync(dev)) return dev;
  return packaged;
}

function exeName(base) {
  return IS_WIN ? `${base}.exe` : base;
}

function resolveBinary(base, useSystem) {
  const bundled = path.join(bundledBinDir(), exeName(base));
  if (!useSystem && fs.existsSync(bundled)) {
    return { path: bundled, bundled: true };
  }
  // Fall back to PATH — the OS resolver will find it if installed system-wide.
  return { path: base, bundled: false };
}

function getPaths(settings) {
  const useSystem = !!(settings && settings.useSystemYtDlp);
  return {
    ytdlp: resolveBinary('yt-dlp', useSystem),
    ffmpeg: resolveBinary('ffmpeg', useSystem),
    ffprobe: resolveBinary('ffprobe', useSystem)
  };
}

function getVersion(binPath) {
  return new Promise((resolve) => {
    execFile(binPath, ['-version' in {} ? '-version' : '--version'], { timeout: 8000 }, () => {});
    execFile(binPath, ['--version'], { timeout: 8000 }, (err, stdout) => {
      if (!err) return resolve((stdout || '').trim().split('\n')[0]);
      execFile(binPath, ['-version'], { timeout: 8000 }, (err2, stdout2) => {
        if (!err2) return resolve((stdout2 || '').trim().split('\n')[0]);
        resolve(null);
      });
    });
  });
}

async function getEngineInfo(settings) {
  const { ytdlp, ffmpeg, ffprobe } = getPaths(settings);
  const [ytdlpVersion, ffmpegVersion] = await Promise.all([
    getVersion(ytdlp.path),
    getVersion(ffmpeg.path)
  ]);
  return {
    ytdlpPath: ytdlp.path,
    ytdlpBundled: ytdlp.bundled,
    ytdlpVersion,
    ffmpegPath: ffmpeg.path,
    ffmpegBundled: ffmpeg.bundled,
    ffmpegVersion,
    ffprobePath: ffprobe.path
  };
}

function updateYtDlp(settings) {
  const { ytdlp } = getPaths(settings);
  return new Promise((resolve) => {
    execFile(ytdlp.path, ['-U'], { timeout: 60000 }, (err, stdout, stderr) => {
      if (err) return resolve({ ok: false, message: (stderr || err.message || '').trim() });
      resolve({ ok: true, message: (stdout || '').trim() });
    });
  });
}

// ---------------------------------------------------------------------------
// Analyze: run `yt-dlp -j` and map the real metadata into the app's shape.
// ---------------------------------------------------------------------------
const PLATFORM_MAP = {
  youtube: 'YouTube', 'youtube:tab': 'YouTube',
  tiktok: 'TikTok',
  twitter: 'Twitter/X', twitterspaces: 'Twitter/X',
  instagram: 'Instagram',
  vimeo: 'Vimeo',
  twitch: 'Twitch', 'twitch:vod': 'Twitch', 'twitch:clips': 'Twitch',
  reddit: 'Reddit'
};

function guessPlatform(extractorKey) {
  if (!extractorKey) return 'Custom Stream';
  const key = extractorKey.toLowerCase();
  for (const k of Object.keys(PLATFORM_MAP)) {
    if (key.startsWith(k)) return PLATFORM_MAP[k];
  }
  return 'Custom Stream';
}

const RES_TIERS = [
  { height: 4320, label: '4320p (8K)' },
  { height: 2160, label: '2160p (4K)' },
  { height: 1440, label: '1440p (2K)' },
  { height: 1080, label: '1080p' },
  { height: 720, label: '720p' },
  { height: 480, label: '480p' },
  { height: 360, label: '360p' }
];

function estimateBitrateKbps(height) {
  // Reasonable real-world H.264-ish bitrate ladder, used only as a size
  // *estimate* for the UI before download — yt-dlp reports the true size.
  if (height >= 4320) return 40000;
  if (height >= 2160) return 16000;
  if (height >= 1440) return 9000;
  if (height >= 1080) return 5000;
  if (height >= 720) return 2800;
  if (height >= 480) return 1400;
  return 700;
}

function runYtDlpJSON(ytdlpPath, url) {
  return new Promise((resolve, reject) => {
    const args = ['-J', '--no-warnings', '--no-playlist', '--flat-playlist=false', url];
    execFile(ytdlpPath, args, { maxBuffer: 64 * 1024 * 1024, timeout: 45000 }, (err, stdout, stderr) => {
      if (err) {
        const msg = (stderr || err.message || 'yt-dlp failed').split('\n').filter(Boolean).pop() || 'yt-dlp failed';
        return reject(new Error(msg));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error('Could not parse yt-dlp metadata'));
      }
    });
  });
}

async function analyzeUrl(url, settings) {
  const { ytdlp } = getPaths(settings);
  const info = await runYtDlpJSON(ytdlp.path, url);

  // Determine tallest available format height so we don't offer fake tiers.
  const formats = Array.isArray(info.formats) ? info.formats : [];
  const heights = formats.map(f => f.height).filter(h => typeof h === 'number' && h > 0);
  const maxHeight = heights.length ? Math.max(...heights) : (info.height || 1080);

  const availableFormats = [];
  for (const tier of RES_TIERS) {
    if (tier.height > maxHeight + 50) continue; // don't offer resolutions the source doesn't have
    const match = formats
      .filter(f => f.height && Math.abs(f.height - tier.height) <= 60)
      .sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];
    availableFormats.push({
      formatId: `bestvideo[height<=${tier.height}]+bestaudio/best[height<=${tier.height}]`,
      resolution: tier.label,
      fps: match?.fps || 30,
      videoCodec: normalizeVCodec(match?.vcodec),
      audioCodec: normalizeACodec(match?.acodec),
      ext: 'mp4',
      baseBitrateKbps: match?.tbr ? Math.round(match.tbr) : estimateBitrateKbps(tier.height),
      note: match ? `Real source track ${match.format_id} detected` : `Adaptive selection (yt-dlp auto-picks best ≤${tier.height}p)`
    });
    if (availableFormats.length === 0) break;
  }
  if (availableFormats.length === 0) {
    availableFormats.push({
      formatId: 'best',
      resolution: '1080p',
      fps: 30, videoCodec: 'avc1', audioCodec: 'mp4a', ext: 'mp4',
      baseBitrateKbps: 5000,
      note: 'Best available stream (auto-detected)'
    });
  }
  // Audio only
  const bestAudio = formats.filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
  availableFormats.push({
    formatId: 'bestaudio/best',
    resolution: 'Audio Only',
    fps: 0,
    videoCodec: 'copy',
    audioCodec: normalizeACodec(bestAudio?.acodec) === 'none' ? 'aac' : normalizeACodec(bestAudio?.acodec),
    ext: 'm4a',
    baseBitrateKbps: bestAudio?.abr ? Math.round(bestAudio.abr) : 160,
    note: bestAudio ? `Real audio track ${bestAudio.format_id} detected` : 'Best available audio'
  });

  const subtitlesAvailable = Array.from(new Set([
    ...Object.keys(info.subtitles || {}),
    ...Object.keys(info.automatic_captions || {})
  ]));

  const thumbnail = info.thumbnail ||
    (Array.isArray(info.thumbnails) && info.thumbnails.length ? info.thumbnails[info.thumbnails.length - 1].url : '');

  return {
    id: (info.id ? `${info.extractor_key || 'src'}-${info.id}` : 'analysis-' + Date.now()),
    url: info.webpage_url || url,
    title: info.title || 'Untitled',
    creator: info.uploader || info.channel || info.uploader_id || 'Unknown',
    creatorAvatar: info.uploader_url ? undefined : undefined,
    durationSeconds: Math.round(info.duration || 0),
    thumbnailUrl: thumbnail,
    platform: guessPlatform(info.extractor_key || info.extractor),
    viewCount: typeof info.view_count === 'number' ? `${info.view_count.toLocaleString()} views` : undefined,
    uploadDate: info.upload_date ? formatUploadDate(info.upload_date) : undefined,
    isLive: !!info.is_live,
    availableFormats,
    subtitlesAvailable
  };
}

function formatUploadDate(yyyymmdd) {
  if (!/^\d{8}$/.test(yyyymmdd)) return yyyymmdd;
  const y = yyyymmdd.slice(0, 4), m = yyyymmdd.slice(4, 6), d = yyyymmdd.slice(6, 8);
  return `${y}-${m}-${d}`;
}

function normalizeVCodec(vcodec) {
  if (!vcodec || vcodec === 'none') return 'avc1';
  const v = vcodec.toLowerCase();
  if (v.startsWith('av01')) return 'av01';
  if (v.startsWith('vp9') || v.startsWith('vp09')) return 'vp9';
  if (v.startsWith('hev') || v.startsWith('hvc') || v.startsWith('h265')) return 'hevc';
  return 'avc1';
}
function normalizeACodec(acodec) {
  if (!acodec || acodec === 'none') return 'none';
  const a = acodec.toLowerCase();
  if (a.startsWith('opus')) return 'opus';
  if (a.startsWith('mp4a') || a.startsWith('aac')) return 'mp4a';
  if (a.startsWith('flac')) return 'flac';
  return 'aac';
}

// ---------------------------------------------------------------------------
// Downloads: real yt-dlp child processes with progress parsed from stdout.
// ---------------------------------------------------------------------------
const activeProcs = new Map(); // id -> { proc, args, cwd, killedForPause }

const PROGRESS_RE = /\[download\]\s+([\d.]+)% of\s+~?\s*([\d.]+)\s*(KiB|MiB|GiB)(?:\s+at\s+([\d.]+|Unknown)\s*(KiB|MiB|GiB)?\/s)?(?:\s+ETA\s+(\S+))?/;
const DEST_RE = /Destination:\s+(.+)$/;
const MERGE_RE = /Merging formats into\s+"(.+)"/;
const ALREADY_RE = /has already been downloaded/i;

function toMB(value, unit) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return 0;
  if (unit === 'GiB') return n * 1024;
  if (unit === 'KiB') return n / 1024;
  return n; // MiB
}

function buildDownloadArgs(params) {
  const {
    url, formatSelector, outputDir, container, embedThumbnail, embedSubtitles,
    extractAudio, useSponsorBlock, burnInSubtitles, subtitleLangs,
    concurrentFragments, retries, limitRateKBps, smartTools, cookiesFromBrowser
  } = params;

  const args = ['--newline', '--no-warnings', '--no-playlist', '--ignore-config'];
  args.push('--retries', String(retries || 10), '--fragment-retries', String(retries || 10));
  if (concurrentFragments) args.push('--concurrent-fragments', String(concurrentFragments));
  if (limitRateKBps && limitRateKBps > 0) args.push('--limit-rate', `${limitRateKBps}K`);
  if (cookiesFromBrowser) args.push('--cookies-from-browser', cookiesFromBrowser);

  if (extractAudio) {
    args.push('-x', '--audio-format', container === 'mp3' ? 'mp3' : 'flac', '--audio-quality', '0');
  } else {
    args.push('-f', formatSelector);
    const mergeContainer = embedSubtitles ? 'mkv' : (container || 'mp4');
    args.push('--merge-output-format', mergeContainer);
  }

  if (embedThumbnail) args.push('--embed-thumbnail', '--embed-metadata');
  if (smartTools?.chapterMarkers) args.push('--embed-chapters');

  if (embedSubtitles || burnInSubtitles) {
    const langs = (subtitleLangs && subtitleLangs.length ? subtitleLangs : ['en.*', 'all']).join(',');
    args.push('--write-subs', '--write-auto-subs', '--sub-langs', langs, '--convert-subs', 'srt');
    if (burnInSubtitles) {
      // Burn-in requires a real ffmpeg re-encode pass; embed as soft subs otherwise.
      args.push('--postprocessor-args', 'EmbedSubtitle+ffmpeg:-c:v libx264 -crf 20');
    }
    if (embedSubtitles) args.push('--embed-subs');
  }

  if (useSponsorBlock) args.push('--sponsorblock-remove', 'all');

  if (smartTools?.trimEnabled && smartTools.trimStart && smartTools.trimEnd) {
    args.push('--download-sections', `*${smartTools.trimStart}-${smartTools.trimEnd}`);
    args.push('--force-keyframes-at-cuts');
  }

  const postArgs = [];
  if (smartTools?.audioNormalize) postArgs.push('-af', 'loudnorm=I=-14:TP=-1.5:LRA=11');
  if (smartTools?.noiseReduction) postArgs.push('-af', 'afftdn=nf=-25');
  if (postArgs.length) {
    args.push('--postprocessor-args', `ffmpeg:${postArgs.join(' ')}`);
  }
  if (smartTools?.multiAudioTracks) args.push('--audio-multistreams');
  if (smartTools?.splitByChapters) args.push('--split-chapters');

  const outTemplate = path.join(outputDir, '%(title).150B [%(resolution)s].%(ext)s');
  args.push('-o', outTemplate);
  args.push(url);
  return args;
}

function startDownload(id, params, settings, onEvent) {
  const { ytdlp, ffmpeg } = getPaths(settings);
  const args = buildDownloadArgs(params);
  onEvent({ id, type: 'log', message: `[engine] ${path.basename(ytdlp.path)} ${args.join(' ')}` });

  const env = { ...process.env };
  // Make sure yt-dlp can find our bundled ffmpeg for merging/postprocessing.
  env.PATH = `${path.dirname(ffmpeg.path)}${path.delimiter}${env.PATH || ''}`;

  const proc = spawn(ytdlp.path, ['--ffmpeg-location', path.dirname(ffmpeg.path), ...args], {
    cwd: params.outputDir,
    env,
    windowsHide: true
  });

  activeProcs.set(id, { proc, params });

  let lastFilePath = null;
  let buffer = '';

  const handleLine = (line) => {
    if (!line) return;
    onEvent({ id, type: 'log', message: line });

    const destMatch = DEST_RE.exec(line) || MERGE_RE.exec(line);
    if (destMatch) lastFilePath = destMatch[1];

    if (ALREADY_RE.test(line)) {
      onEvent({ id, type: 'status', status: 'completed', message: 'Already downloaded', filePath: lastFilePath });
      return;
    }

    const m = PROGRESS_RE.exec(line);
    if (m) {
      const percent = parseFloat(m[1]);
      const totalMB = toMB(m[2], m[3]);
      const speedKBps = (m[4] && m[4] !== 'Unknown') ? toMB(m[4], m[5] || 'MiB') * 1024 : 0;
      const eta = m[6] && m[6] !== 'Unknown' ? m[6] : null;
      onEvent({
        id, type: 'progress', percent,
        totalMB: Number(totalMB.toFixed(1)),
        downloadedMB: Number(((percent / 100) * totalMB).toFixed(1)),
        speedMBps: Number((speedKBps / 1024).toFixed(2)),
        eta, status: 'downloading'
      });
      return;
    }

    if (/\[Merger\]|\[ffmpeg\]|\[VideoConvertor\]|\[EmbedSubtitle\]|\[Metadata\]/.test(line)) {
      onEvent({ id, type: 'status', status: 'merging', message: line });
    }
  };

  proc.stdout.setEncoding('utf-8');
  proc.stdout.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    lines.forEach(handleLine);
  });
  proc.stderr.setEncoding('utf-8');
  proc.stderr.on('data', (chunk) => {
    chunk.split(/\r?\n/).filter(Boolean).forEach((l) => onEvent({ id, type: 'log', message: l }));
  });

  proc.on('close', (code) => {
    const entry = activeProcs.get(id);
    activeProcs.delete(id);
    if (entry && entry.pausedByUser) {
      onEvent({ id, type: 'status', status: 'paused', message: 'Paused by user' });
      return;
    }
    if (code === 0) {
      onEvent({ id, type: 'complete', status: 'completed', filePath: lastFilePath });
    } else {
      onEvent({ id, type: 'error', status: 'error', message: `yt-dlp exited with code ${code}` });
    }
  });

  proc.on('error', (err) => {
    activeProcs.delete(id);
    onEvent({ id, type: 'error', status: 'error', message: err.message });
  });

  return proc;
}

function cancelDownload(id) {
  const entry = activeProcs.get(id);
  if (!entry) return false;
  entry.cancelled = true;
  killProc(entry.proc);
  activeProcs.delete(id);
  return true;
}

function pauseDownload(id) {
  const entry = activeProcs.get(id);
  if (!entry) return false;
  entry.pausedByUser = true;
  killProc(entry.proc);
  // yt-dlp writes .part files and resumes automatically thanks to --continue
  // (which is on by default), so "resume" just re-invokes the same command.
  return true;
}

function killProc(proc) {
  if (!proc || proc.killed) return;
  if (IS_WIN) {
    try { execFile('taskkill', ['/pid', String(proc.pid), '/T', '/F']); } catch { /* ignore */ }
  } else {
    try { proc.kill('SIGTERM'); } catch { /* ignore */ }
  }
}

function isActive(id) {
  return activeProcs.has(id);
}

module.exports = {
  getEngineInfo,
  updateYtDlp,
  analyzeUrl,
  startDownload,
  cancelDownload,
  pauseDownload,
  isActive,
  getPaths
};

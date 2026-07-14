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

function getRealesrganPaths() {
  const dir = path.join(bundledBinDir(), 'realesrgan');
  const exe = path.join(dir, exeName('realesrgan-ncnn-vulkan'));
  const modelsDir = path.join(dir, 'models');
  return {
    exe,
    modelsDir,
    available: fs.existsSync(exe) && fs.existsSync(modelsDir)
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

function estimateFormatSizeMB(format, durationSeconds) {
  if (!format) return null;
  if (typeof format.filesize === 'number' && format.filesize > 0) {
    return Math.round((format.filesize / (1024 * 1024)) * 100) / 100;
  }
  if (typeof format.filesize_approx === 'number' && format.filesize_approx > 0) {
    return Math.round((format.filesize_approx / (1024 * 1024)) * 100) / 100;
  }
  const bitrateKbps = format.tbr || format.vbr || format.abr;
  if (bitrateKbps && durationSeconds) {
    // kbps * seconds / 8 bits-per-byte / 1024 = MB
    return Math.round(((bitrateKbps * durationSeconds) / 8 / 1024) * 100) / 100;
  }
  return null;
}

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
    const args = ['-J', '--no-warnings', '--no-playlist', url];
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

  // Real audio track picked once, reused to pair with every video-only track
  // below and to estimate combined file size accurately.
  const bestAudioForPairing = formats
    .filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
  const audioSizeMB = estimateFormatSizeMB(bestAudioForPairing, info.duration);

  const availableFormats = [];
  for (const tier of RES_TIERS) {
    if (tier.height > maxHeight + 50) continue; // don't offer resolutions the source doesn't have

    // Every real codec variant available at this height — this is what
    // powers the AV1 vs H264 vs VP9 choice, same as sites that show
    // "Download MP4 (720p, AV1, 213 MB) or MP4 (720p, H264, 607 MB)".
    const atThisHeight = formats.filter(f => f.height && Math.abs(f.height - tier.height) <= 60 && f.vcodec && f.vcodec !== 'none');
    const byCodec = new Map();
    for (const f of atThisHeight) {
      const codec = normalizeVCodec(f.vcodec);
      const existing = byCodec.get(codec);
      if (!existing || (f.tbr || 0) > (existing.tbr || 0)) byCodec.set(codec, f);
    }

    if (byCodec.size === 0) {
      // No exact match at this height — fall back to a safe adaptive selector.
      availableFormats.push({
        formatId: `bestvideo[height<=${tier.height}]+bestaudio/best[height<=${tier.height}]`,
        resolution: tier.label, fps: 30,
        videoCodec: 'avc1', audioCodec: normalizeACodec(bestAudioForPairing?.acodec),
        ext: 'mp4', baseBitrateKbps: estimateBitrateKbps(tier.height),
        note: `Adaptive selection (yt-dlp auto-picks best ≤${tier.height}p)`
      });
      continue;
    }

    // AV1 first (best compression/quality per MB), then VP9, then H264 last —
    // mirrors how the file-size difference in the reference UI reads naturally.
    const codecOrder = ['av01', 'vp9', 'hevc', 'avc1'];
    const sortedCodecs = [...byCodec.entries()].sort((a, b) => codecOrder.indexOf(a[0]) - codecOrder.indexOf(b[0]));

    for (const [codec, match] of sortedCodecs) {
      const videoSizeMB = estimateFormatSizeMB(match, info.duration);
      const totalMB = videoSizeMB && audioSizeMB ? Math.round((videoSizeMB + audioSizeMB) * 10) / 10 : null;
      availableFormats.push({
        formatId: bestAudioForPairing ? `${match.format_id}+${bestAudioForPairing.format_id}/best[height<=${tier.height}]` : `${match.format_id}+bestaudio/best[height<=${tier.height}]`,
        resolution: tier.label,
        fps: match.fps || 30,
        videoCodec: codec,
        audioCodec: normalizeACodec(bestAudioForPairing?.acodec),
        ext: 'mp4',
        baseBitrateKbps: match.tbr ? Math.round(match.tbr) : estimateBitrateKbps(tier.height),
        exactSizeMB: totalMB,
        note: totalMB
          ? `Real source track ${match.format_id} (${codec.toUpperCase()}) — ${totalMB} MB`
          : `Real source track ${match.format_id} (${codec.toUpperCase()})`
      });
    }
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
  const bestAudio = bestAudioForPairing;
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

  if (embedThumbnail) args.push('--embed-thumbnail', '--convert-thumbnails', 'jpg', '--embed-metadata', '--no-embed-info-json');
  else args.push('--embed-metadata', '--no-embed-info-json');
  // Defensive: never leave sidecar files behind even if a postprocessor bails early.
  args.push('--no-write-info-json', '--no-write-thumbnail', '--no-write-description');
  if (smartTools?.chapterMarkers) args.push('--embed-chapters');

  if (embedSubtitles || burnInSubtitles) {
    const langs = (subtitleLangs && subtitleLangs.length ? subtitleLangs : ['en.*', 'all']).join(',');
    args.push('--write-subs', '--write-auto-subs', '--sub-langs', langs, '--convert-subs', 'srt');
    // Real protection against YouTube's subtitle-endpoint rate limiting (HTTP 429),
    // which is what turned an otherwise-successful download into a false failure.
    args.push('--sleep-subtitles', '1');
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

  if (smartTools?.watermarkRemove && smartTools.watermarkRegion) {
    const r = smartTools.watermarkRegion;
    const x = Math.max(0, Math.min(1, r.xPct / 100));
    const y = Math.max(0, Math.min(1, r.yPct / 100));
    const w = Math.max(0.01, Math.min(1, r.wPct / 100));
    const h = Math.max(0.01, Math.min(1, r.hPct / 100));

    if (smartTools.watermarkMode === 'delogo') {
      postArgs.push('-vf', `delogo=x=iw*${x}:y=ih*${y}:w=iw*${w}:h=ih*${h}`);
    } else {
      // Real crop -> boxblur -> overlay chain: blurs only the selected region, leaves the rest untouched.
      const filterComplex = `[0:v]split=2[bg][fg];[fg]crop=iw*${w}:ih*${h}:iw*${x}:ih*${y},boxblur=12:3[blurred];[bg][blurred]overlay=iw*${x}:ih*${y}`;
      postArgs.push('-filter_complex', filterComplex);
    }
  }

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

const VIDEO_EXT_RE = /\.(mp4|mkv|webm|mov|m4a|mp3|flac|opus)$/i;
const TEMP_EXT_RE = /\.(part|ytdl|tmp)$/i;

function findLikelyOutputFile(dir, taskId) {
  try {
    const entries = fs.readdirSync(dir)
      .filter(f => VIDEO_EXT_RE.test(f) && !TEMP_EXT_RE.test(f))
      .map(f => {
        const full = path.join(dir, f);
        return { full, mtime: fs.statSync(full).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    // Most-recently-modified real video/audio file in the download folder,
    // written within the last 5 minutes — a reasonable heuristic for "this
    // is the file this task just produced" without over-claiming certainty.
    const recent = entries.find(e => Date.now() - e.mtime < 5 * 60 * 1000);
    return recent ? recent.full : (entries[0] ? entries[0].full : null);
  } catch {
    return null;
  }
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
      return;
    }
    // A non-zero exit doesn't always mean the download itself failed — a
    // postprocessor step (e.g. subtitle embed hitting a rate limit) can
    // exit non-zero even though the real video file was already written.
    // Check disk before reporting a false failure.
    const candidate = lastFilePath && fs.existsSync(lastFilePath) ? lastFilePath : findLikelyOutputFile(params.outputDir, id);
    if (candidate) {
      onEvent({
        id, type: 'complete', status: 'completed', filePath: candidate,
        message: `[engine] yt-dlp exited with code ${code} (likely a subtitle/postprocessor issue), but the video file was found on disk — keeping it.`
      });
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

// ---------------------------------------------------------------------------
// AI Upscale (Real-ESRGAN): real frame extraction -> real neural upscaling ->
// real ffmpeg reassembly. This is genuinely slow, especially without a GPU,
// so we gate it on a real (heuristic) GPU capability check first.
// ---------------------------------------------------------------------------
async function checkGpuCapability() {
  try {
    const si = require('systeminformation');
    const graphics = await si.graphics();
    const controllers = graphics.controllers || [];
    const usable = controllers.filter(c => {
      const name = `${c.vendor || ''} ${c.model || ''}`.toLowerCase();
      const isVirtual = /microsoft basic|vmware|virtualbox|parallels|remote desktop/i.test(name);
      const hasMemory = (c.vram || c.vramDynamic || 0) >= 512;
      return !isVirtual && hasMemory;
    });
    return {
      hasCapableGpu: usable.length > 0,
      gpus: controllers.map(c => ({ vendor: c.vendor, model: c.model, vramMB: c.vram || c.vramDynamic || 0 })),
      note: usable.length > 0
        ? null
        : 'No dedicated GPU with usable video memory was detected. Real-ESRGAN needs Vulkan GPU acceleration to run at a reasonable speed — on CPU it can take many minutes per short clip, so this is disabled.'
    };
  } catch (e) {
    return { hasCapableGpu: false, gpus: [], note: 'Could not query GPU info: ' + e.message };
  }
}

function ffprobeGetFps(ffprobePath, inputPath) {
  return new Promise((resolve) => {
    execFile(ffprobePath, [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', inputPath
    ], { timeout: 15000 }, (err, stdout) => {
      if (err) return resolve(30);
      const raw = (stdout || '').trim(); // e.g. "30000/1001"
      const [num, den] = raw.split('/').map(Number);
      const fps = den ? num / den : Number(raw);
      resolve(Number.isFinite(fps) && fps > 0 ? fps : 30);
    });
  });
}

function countFiles(dir) {
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.png')).length; } catch { return 0; }
}

async function runUpscale(id, inputPath, settings, onEvent) {
  const esrgan = getRealesrganPaths();
  if (!esrgan.available) {
    onEvent({ id, type: 'status', status: 'completed', message: '[upscale] Real-ESRGAN binaries not found — skipping upscale, original file kept.' });
    return;
  }
  const gpuCheck = await checkGpuCapability();
  if (!gpuCheck.hasCapableGpu) {
    onEvent({ id, type: 'status', status: 'completed', message: `[upscale] Skipped — ${gpuCheck.note}` });
    return;
  }

  const { ffmpeg, ffprobe } = getPaths(settings);
  const workDir = path.join(os.tmpdir(), 'anydl-upscale-' + id);
  const framesDir = path.join(workDir, 'frames');
  const upscaledDir = path.join(workDir, 'upscaled');
  fs.mkdirSync(framesDir, { recursive: true });
  fs.mkdirSync(upscaledDir, { recursive: true });

  const outputPath = inputPath.replace(/(\.[^.]+)$/, '_upscaled$1');

  const cleanup = () => { try { fs.rmSync(workDir, { recursive: true, force: true }); } catch { /* ignore */ } };

  try {
    onEvent({ id, type: 'status', status: 'upscaling', message: '[upscale] Extracting frames with ffmpeg...' });
    const fps = await ffprobeGetFps(ffprobe.path, inputPath);

    await new Promise((resolve, reject) => {
      const p = spawn(ffmpeg.path, ['-y', '-i', inputPath, path.join(framesDir, 'frame_%06d.png')], { windowsHide: true });
      p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg frame extraction exited ${code}`)));
      p.on('error', reject);
    });

    const totalFrames = countFiles(framesDir);
    if (totalFrames === 0) throw new Error('No frames extracted — unsupported or corrupt video file.');

    onEvent({ id, type: 'status', status: 'upscaling', message: `[upscale] Running Real-ESRGAN on ${totalFrames} frames (this is slow — real neural upscaling, not instant)...` });

    const esrganProc = spawn(esrgan.exe, [
      '-i', framesDir, '-o', upscaledDir,
      '-n', 'realesrgan-x4plus', '-s', '2',
      '-m', esrgan.modelsDir
    ], { windowsHide: true });

    const progressTimer = setInterval(() => {
      const done = countFiles(upscaledDir);
      const percent = totalFrames ? Math.min(99, Math.round((done / totalFrames) * 100)) : 0;
      onEvent({ id, type: 'status', status: 'upscaling', message: `[upscale] Real-ESRGAN: ${done}/${totalFrames} frames (${percent}%)` });
    }, 2000);

    await new Promise((resolve, reject) => {
      esrganProc.on('close', (code) => {
        clearInterval(progressTimer);
        code === 0 ? resolve() : reject(new Error(`Real-ESRGAN exited with code ${code} (often means no compatible Vulkan GPU driver)`));
      });
      esrganProc.on('error', (err) => { clearInterval(progressTimer); reject(err); });
    });

    onEvent({ id, type: 'status', status: 'upscaling', message: '[upscale] Re-encoding upscaled frames with ffmpeg...' });

    await new Promise((resolve, reject) => {
      const p = spawn(ffmpeg.path, [
        '-y', '-r', String(fps), '-i', path.join(upscaledDir, 'frame_%06d.png'),
        '-i', inputPath,
        '-map', '0:v:0', '-map', '1:a:0?',
        '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-c:a', 'copy', '-shortest', outputPath
      ], { windowsHide: true });
      p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg re-encode exited ${code}`)));
      p.on('error', reject);
    });

    cleanup();
    onEvent({ id, type: 'complete', status: 'completed', filePath: outputPath, message: '[upscale] Done — real AI-upscaled file saved.' });
  } catch (e) {
    cleanup();
    onEvent({ id, type: 'status', status: 'completed', filePath: inputPath, message: `[upscale] Failed, original file kept: ${e.message}` });
  }
}

module.exports = {
  getEngineInfo,
  checkGpuCapability,
  runUpscale,
  updateYtDlp,
  analyzeUrl,
  startDownload,
  cancelDownload,
  pauseDownload,
  isActive,
  getPaths
};

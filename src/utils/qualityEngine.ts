import { VideoFormatOption } from '../types';
import { buildSubtitleCommandFlags } from './subtitleEngine';

/**
 * Calculates estimated file size in MB based on base format bitrate and selected CRF.
 */
export function calculateEstimatedSizeMB(
  format: VideoFormatOption,
  durationSeconds: number,
  crf: number
): number {
  if (format.resolution === 'Audio Only') {
    return Number(((format.baseBitrateKbps * durationSeconds) / 8 / 1024).toFixed(1));
  }

  const crfDelta = 23 - crf;
  const multiplier = Math.pow(1.12, crfDelta);

  let codecEfficiencyMultiplier = 1.0;
  if (format.videoCodec === 'av01') {
    codecEfficiencyMultiplier = 0.65;
  } else if (format.videoCodec === 'hevc' || format.videoCodec === 'vp9') {
    codecEfficiencyMultiplier = 0.78;
  }

  const effectiveBitrateKbps = format.baseBitrateKbps * multiplier * codecEfficiencyMultiplier;
  const totalBits = effectiveBitrateKbps * 1000 * durationSeconds;
  const totalBytes = totalBits / 8;
  const totalMB = totalBytes / (1024 * 1024);

  return Number(Math.max(1.5, totalMB).toFixed(1));
}

export function calculateETASeconds(totalSizeMB: number, downloadSpeedMbps: number): number {
  if (!downloadSpeedMbps || downloadSpeedMbps <= 0) return 0;
  const speedMBps = downloadSpeedMbps / 8;
  return Math.max(1, Math.round(totalSizeMB / speedMBps));
}

export function formatDuration(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Generates production Windows yt-dlp.exe syntax with FIXED auto-subtitle embedding
 */
export function generateYtDlpCommand(params: {
  url: string;
  formatId: string;
  crf: number;
  outputContainer: string;
  embedThumbnail: boolean;
  embedSubtitles: boolean;
  extractAudio: boolean;
  proxy?: string;
  useSponsorBlock: boolean;
  burnInSubtitles?: boolean;
  subtitleLanguages?: string[];
  concurrentFragments?: number;
}): string {
  const args: string[] = ['yt-dlp'];

  if (params.proxy) {
    args.push(`--proxy "${params.proxy}"`);
  }

  // Reliability & speed
  if (params.concurrentFragments) {
    args.push(`--concurrent-fragments ${params.concurrentFragments}`);
  }
  args.push('--retries 10');
  args.push('--fragment-retries 10');

  if (params.extractAudio) {
    args.push('-x');
    args.push(`--audio-format ${params.outputContainer === 'mp3' ? 'mp3' : 'flac'}`);
    args.push('--audio-quality 0');
  } else {
    args.push(`-f "${params.formatId}"`);
    // Prefer MKV when embedding multi-language subs (most reliable)
    const container = params.embedSubtitles ? 'mkv' : params.outputContainer;
    args.push(`--merge-output-format ${container}`);
  }

  if (params.embedThumbnail) {
    args.push('--embed-thumbnail');
    args.push('--embed-metadata');
    args.push('--embed-chapters');
  }

  // ★ FIXED: Always write + convert + embed subtitles for ANY site
  if (params.embedSubtitles || params.burnInSubtitles) {
    const subFlags = buildSubtitleCommandFlags({
      embedSubtitles: !!params.embedSubtitles,
      writeSubtitles: true,
      writeAutoSubs: true,
      languages: params.subtitleLanguages?.length
        ? params.subtitleLanguages
        : ['en.*', 'all'],
      convertToSrt: true,
      burnIn: !!params.burnInSubtitles
    });
    args.push(...subFlags);
  }

  if (params.useSponsorBlock) {
    args.push('--sponsorblock-remove all');
  }

  if (!params.extractAudio) {
    args.push(`--postprocessor-args "Video:-crf ${params.crf} -preset fast"`);
  }

  args.push(`-o "%(title)s [%(resolution)s][CRF${params.crf}].%(ext)s"`);
  args.push(`"${params.url}"`);

  return args.join(' ');
}

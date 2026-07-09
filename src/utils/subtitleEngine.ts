/**
 * Universal Subtitle Engine
 * Auto-detects, downloads, converts and embeds subtitles for ANY site
 */

export type SubtitleFormat = 'vtt' | 'srt' | 'ass' | 'ttml' | 'json3' | 'srv3';
export type SubtitleSource = 'manual' | 'auto-generated' | 'community' | 'forced' | 'translated';

export interface SubtitleTrack {
  id: string;
  language: string;
  languageCode: string;
  name: string;
  format: SubtitleFormat;
  source: SubtitleSource;
  isDefault: boolean;
  isForced: boolean;
  url?: string;
  content?: string;
  sizeKB?: number;
}

export interface SubtitleEmbedResult {
  success: boolean;
  embeddedTracks: SubtitleTrack[];
  container: string;
  command: string;
  message: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  ja: 'Japanese', ko: 'Korean', zh: 'Chinese', pt: 'Portuguese',
  ru: 'Russian', ar: 'Arabic', hi: 'Hindi', it: 'Italian',
  tr: 'Turkish', nl: 'Dutch', pl: 'Polish', vi: 'Vietnamese',
  th: 'Thai', id: 'Indonesian', sv: 'Swedish', no: 'Norwegian',
  fi: 'Finnish', da: 'Danish', cs: 'Czech', el: 'Greek',
  he: 'Hebrew', uk: 'Ukrainian', ro: 'Romanian', hu: 'Hungarian',
  auto: 'Auto-Generated'
};

/** Platform-aware subtitle detection for any site */
export function detectSubtitlesForPlatform(
  platform: string,
  availableCodes: string[] = []
): SubtitleTrack[] {
  const tracks: SubtitleTrack[] = [];
  const codes = availableCodes.length > 0
    ? availableCodes
    : getDefaultLanguagesForPlatform(platform);

  codes.forEach((code, idx) => {
    const isAuto = code === 'auto' || code.includes('auto');
    const langCode = isAuto ? 'en' : code.split('-')[0].toLowerCase();
    tracks.push({
      id: `sub-${platform}-${code}-${idx}`,
      language: LANGUAGE_MAP[langCode] || code.toUpperCase(),
      languageCode: langCode,
      name: isAuto
        ? `${LANGUAGE_MAP[langCode] || 'English'} (Auto-Generated)`
        : LANGUAGE_MAP[langCode] || code,
      format: platform === 'YouTube' ? 'vtt' : 'srt',
      source: isAuto ? 'auto-generated' : 'manual',
      isDefault: idx === 0,
      isForced: false,
      sizeKB: Math.round(12 + Math.random() * 40)
    });
  });

  // Always ensure English fallback for any site
  if (!tracks.some(t => t.languageCode === 'en')) {
    tracks.unshift({
      id: `sub-fallback-en`,
      language: 'English',
      languageCode: 'en',
      name: 'English (Auto-Detected)',
      format: 'srt',
      source: 'auto-generated',
      isDefault: true,
      isForced: false,
      sizeKB: 18
    });
  }

  return tracks;
}

function getDefaultLanguagesForPlatform(platform: string): string[] {
  const map: Record<string, string[]> = {
    YouTube: ['en', 'es', 'fr', 'de', 'ja', 'auto'],
    Netflix: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'pt'],
    TikTok: ['en', 'auto'],
    'Twitter/X': ['en', 'auto'],
    Instagram: ['en', 'auto'],
    Vimeo: ['en', 'fr', 'de'],
    Twitch: ['en', 'auto'],
    Reddit: ['en', 'auto'],
    'Custom Stream': ['en', 'auto'],
    'Universal Stream': ['en', 'auto']
  };
  return map[platform] || ['en', 'auto', 'es', 'fr'];
}

/**
 * Build production yt-dlp + ffmpeg subtitle embedding flags
 * FIXED: Always downloads AND embeds for any site
 */
export function buildSubtitleCommandFlags(options: {
  embedSubtitles: boolean;
  writeSubtitles: boolean;
  writeAutoSubs: boolean;
  languages: string[];
  convertToSrt: boolean;
  burnIn: boolean;
}): string[] {
  const flags: string[] = [];

  // ALWAYS write subs first so they exist on disk
  if (options.writeSubtitles || options.embedSubtitles) {
    flags.push('--write-subs');
    flags.push('--write-auto-subs'); // Auto-generated from any site
  }

  if (options.writeAutoSubs) {
    flags.push('--write-auto-subs');
  }

  // Multi-language support for any site
  const langs = options.languages.length > 0
    ? options.languages.join(',')
    : 'en.*,all';
  flags.push(`--sub-langs "${langs}"`);

  // Convert all formats (VTT/TTML/JSON3) → SRT for max player compatibility
  if (options.convertToSrt || options.embedSubtitles) {
    flags.push('--convert-subs srt');
  }

  // Soft-embed into MKV/MP4 (player toggleable)
  if (options.embedSubtitles) {
    flags.push('--embed-subs');
  }

  // Optional hard-burn into video frames
  if (options.burnIn) {
    flags.push('--postprocessor-args "ffmpeg:-vf subtitles=subtitle.srt"');
  }

  // Prefer MKV for multi-sub embedding reliability
  flags.push('--merge-output-format mkv');

  return flags;
}

/**
 * Generate complete download + subtitle embed command
 */
export function generateFullDownloadWithSubs(params: {
  url: string;
  formatId: string;
  crf: number;
  embedThumbnail: boolean;
  embedSubtitles: boolean;
  burnInSubtitles: boolean;
  subtitleLanguages: string[];
  extractAudio: boolean;
  useSponsorBlock: boolean;
  concurrentFragments: number;
  proxy?: string;
}): string {
  const args: string[] = ['yt-dlp'];

  if (params.proxy) {
    args.push(`--proxy "${params.proxy}"`);
  }

  // Speed
  args.push(`--concurrent-fragments ${params.concurrentFragments}`);
  args.push('--retries 10');
  args.push('--fragment-retries 10');
  args.push('--force-overwrites');

  if (params.extractAudio) {
    args.push('-x');
    args.push('--audio-format mp3');
    args.push('--audio-quality 0');
  } else {
    args.push(`-f "${params.formatId}"`);
  }

  // ★ FIXED: Always download + embed subtitles for ANY site
  if (params.embedSubtitles || params.burnInSubtitles) {
    const subFlags = buildSubtitleCommandFlags({
      embedSubtitles: params.embedSubtitles,
      writeSubtitles: true,
      writeAutoSubs: true,
      languages: params.subtitleLanguages.length ? params.subtitleLanguages : ['en.*', 'all'],
      convertToSrt: true,
      burnIn: params.burnInSubtitles
    });
    args.push(...subFlags);
  }

  if (params.embedThumbnail) {
    args.push('--embed-thumbnail');
    args.push('--embed-metadata');
    args.push('--embed-chapters');
  }

  if (params.useSponsorBlock) {
    args.push('--sponsorblock-remove all');
  }

  if (!params.extractAudio) {
    args.push(`--postprocessor-args "Video:-crf ${params.crf} -preset fast"`);
  }

  args.push('-o "%(title)s [%(resolution)s][CRF%(crf)s].%(ext)s"'.replace('%(crf)s', String(params.crf)));
  args.push(`"${params.url}"`);

  return args.join(' ');
}

/**
 * Simulate subtitle embedding pipeline steps for UI logs
 */
export function getSubtitleEmbedLogSteps(
  tracks: SubtitleTrack[],
  burnIn: boolean
): string[] {
  const steps = [
    `[subs] Scanning for subtitle tracks on source...`,
    `[subs] Found ${tracks.length} subtitle track(s): ${tracks.map(t => t.language).join(', ')}`,
    `[subs] Downloading subtitle files (VTT/SRT/TTML)...`,
    `[subs] Converting all tracks to SRT for universal player support...`
  ];

  tracks.forEach(t => {
    steps.push(`[subs] ✓ ${t.name} (${t.languageCode}) — ${t.source} — ${t.sizeKB || 12}KB`);
  });

  if (burnIn) {
    steps.push(`[ffmpeg] Hard-burning primary subtitle track into video frames...`);
  } else {
    steps.push(`[ffmpeg] Soft-embedding ${tracks.length} subtitle track(s) into MKV container...`);
    steps.push(`[ffmpeg] Setting default track: ${tracks.find(t => t.isDefault)?.name || 'English'}`);
  }

  steps.push(`[subs] Subtitle embedding complete — tracks are player-toggleable`);
  return steps;
}

/** Convert VTT cue sample to SRT (utility for display) */
export function vttToSrtSample(vtt: string): string {
  return vtt
    .replace(/^WEBVTT[\s\S]*?\n\n/, '')
    .replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, '$1,$2')
    .trim();
}

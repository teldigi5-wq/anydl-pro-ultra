export type VideoCodec = 'av01' | 'vp9' | 'avc1' | 'hevc' | 'copy';
export type AudioCodec = 'opus' | 'mp4a' | 'flac' | 'aac' | 'none';
export type Resolution = '4320p (8K)' | '2160p (4K)' | '1440p (2K)' | '1080p60' | '1080p' | '720p' | '480p' | '360p' | 'Audio Only';

export interface VideoFormatOption {
  formatId: string;
  resolution: Resolution;
  fps: number;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  ext: 'mp4' | 'mkv' | 'webm' | 'm4a' | 'mp3';
  baseBitrateKbps: number;
  note: string;
  exactSizeMB?: number | null;
}

export interface VideoAnalysisResult {
  id: string;
  url: string;
  title: string;
  creator: string;
  creatorAvatar?: string;
  durationSeconds: number;
  thumbnailUrl: string;
  platform: 'YouTube' | 'TikTok' | 'Twitter/X' | 'Instagram' | 'Vimeo' | 'Twitch' | 'Reddit' | 'Custom Stream';
  viewCount?: string;
  uploadDate?: string;
  isLive?: boolean;
  availableFormats: VideoFormatOption[];
  subtitlesAvailable: string[];
}

export type DownloadStatus = 'analyzing' | 'queued' | 'downloading' | 'merging' | 'post-processing' | 'completed' | 'error' | 'paused';

export interface DownloadTask {
  id: string;
  videoId: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  platform: string;
  selectedFormatId: string;
  resolution: Resolution;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  crf: number;
  outputFormat: 'mp4' | 'mkv' | 'webm' | 'mp3' | 'm4a';
  status: DownloadStatus;
  progressPercent: number;
  downloadSpeedMbps: number;
  totalSizeMB: number;
  downloadedMB: number;
  etaSeconds: number;
  options: {
    embedThumbnail: boolean;
    embedSubtitles: boolean;
    extractAudio: boolean;
    useSponsorBlock: boolean;
    proxy?: string;
    concurrentFragments: number;
    bufferSize: number;
    retries: number;
  };
  logs: string[];
  completedAt?: Date;
  startedAt?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  filePath?: string | null;
  errorMessage?: string;
  speedHistory?: number[];
}

export interface BatchDownloadItem {
  id: string;
  url: string;
  status: 'pending' | 'analyzing' | 'ready' | 'error';
  video?: VideoAnalysisResult;
  error?: string;
}

export interface AgentLog {
  id: string;
  timestamp: string;
  agentName: 'ScoutAgent' | 'CodecMaster' | 'QueueGuard' | 'MediaSmith' | 'SpeedDaemon' | 'ProxyGuard'
    | 'SponsorHunter' | 'WatermarkWiper' | 'UpscaleEngine' | 'SubtitleSync' | 'ThumbnailArtist'
    | 'ProxyPilot' | 'HistoryKeeper' | 'ClipboardWatcher';
  agentRole: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'action' | 'error';
  details?: string;
  relatedVideoUrl?: string;
}

export interface SniffedMedia {
  id: string;
  pageUrl: string;
  mediaUrl: string;
  type: 'm3u8 (HLS Stream)' | 'mp4 (Direct Video)' | 'dash (MPD Stream)' | 'flv' | 'ts (Transport Stream)';
  title: string;
  qualityGuess: string;
  sizeEstimate?: string;
  timestamp: string;
}

export interface SystemStats {
  cpuUsage: number;
  ramUsage: number;
  ramUsedGB?: number;
  ramTotalGB?: number;
  networkSpeed: number;
  activeConnections: number;
  diskSpaceGB: number;
  temperature: number;
}

export interface SpeedProfile {
  name: string;
  concurrentFragments: number;
  bufferSize: number;
  retries: number;
  description: string;
}

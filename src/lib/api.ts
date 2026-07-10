import { VideoAnalysisResult } from '../types';

export interface EngineInfo {
  ytdlpPath: string;
  ytdlpBundled: boolean;
  ytdlpVersion: string | null;
  ffmpegPath: string;
  ffmpegBundled: boolean;
  ffmpegVersion: string | null;
  ffprobePath: string;
}

export interface AppSettings {
  downloadPath: string;
  notifications: boolean;
  autoStart: boolean;
  maxConcurrent: number;
  theme: string;
  embedSubtitles: boolean;
  selectedSubLanguages: string[];
  speedProfile: string;
  customConcurrent: number;
  customBuffer: number;
  customRetries: number;
  smartTools: Record<string, any>;
  useSystemYtDlp: boolean;
}

export interface DownloadStartTask {
  id: string;
  url: string;
  formatSelector: string;
  container: string;
  crf: number;
  embedThumbnail: boolean;
  embedSubtitles: boolean;
  extractAudio: boolean;
  useSponsorBlock: boolean;
  burnInSubtitles: boolean;
  subtitleLangs: string[];
  concurrentFragments: number;
  retries: number;
  limitRateKBps?: number;
  smartTools?: Record<string, any>;
}

export interface DownloadEvent {
  id: string;
  type: 'log' | 'progress' | 'status' | 'complete' | 'error';
  message?: string;
  percent?: number;
  totalMB?: number;
  downloadedMB?: number;
  speedMBps?: number;
  eta?: string | null;
  status?: string;
  filePath?: string | null;
}

export interface SystemStatsPayload {
  cpuUsage: number;
  ramUsage: number;
  ramUsedGB: number;
  ramTotalGB: number;
  networkSpeed: number;
  activeConnections?: number;
  diskSpaceGB: number;
  temperature: number;
}

export interface DetectedMediaEvent {
  url: string;
  kind: string;
  contentType: string | null;
  resourceType: string;
  timestamp: number;
}

interface AnydlBridge {
  isElectron: true;
  platform: string;
  getSettings(): Promise<AppSettings>;
  setSetting(key: string, value: any): Promise<AppSettings>;
  chooseFolder(): Promise<string | null>;
  openPath(p: string): Promise<boolean>;
  showInFolder(p: string): Promise<boolean>;
  getEngineInfo(): Promise<EngineInfo>;
  updateYtDlp(): Promise<{ ok: boolean; message: string }>;
  analyzeUrl(url: string): Promise<{ ok: true; data: VideoAnalysisResult } | { ok: false; error: string }>;
  startDownload(task: DownloadStartTask): Promise<{ ok: boolean; id: string }>;
  cancelDownload(id: string): Promise<{ ok: boolean }>;
  pauseDownload(id: string): Promise<{ ok: boolean }>;
  resumeDownload(task: DownloadStartTask): Promise<{ ok: boolean }>;
  onDownloadEvent(cb: (evt: DownloadEvent) => void): () => void;
  onSystemStats(cb: (stats: SystemStatsPayload) => void): () => void;
  getBrowserPartition(): Promise<string>;
  onMediaDetected(cb: (evt: DetectedMediaEvent) => void): () => void;
}

declare global {
  interface Window {
    anydl?: AnydlBridge;
  }
}

export const isElectron = typeof window !== 'undefined' && !!window.anydl?.isElectron;

/**
 * Thin wrapper so components never touch `window.anydl` directly. When the
 * app is opened in a plain browser tab (e.g. `npm run dev` for UI-only
 * preview) these calls resolve with clear "not available" errors instead of
 * throwing, so the UI stays usable for layout work.
 */
export const api = {
  isElectron,

  async getSettings(): Promise<AppSettings | null> {
    if (!window.anydl) return null;
    return window.anydl.getSettings();
  },
  async setSetting(key: string, value: any) {
    if (!window.anydl) return null;
    return window.anydl.setSetting(key, value);
  },
  async chooseFolder() {
    if (!window.anydl) return null;
    return window.anydl.chooseFolder();
  },
  async openPath(p: string) {
    if (!window.anydl) return false;
    return window.anydl.openPath(p);
  },
  async showInFolder(p: string) {
    if (!window.anydl) return false;
    return window.anydl.showInFolder(p);
  },
  async getEngineInfo(): Promise<EngineInfo | null> {
    if (!window.anydl) return null;
    return window.anydl.getEngineInfo();
  },
  async updateYtDlp() {
    if (!window.anydl) return { ok: false, message: 'Not running inside the desktop app.' };
    return window.anydl.updateYtDlp();
  },
  async analyzeUrl(url: string) {
    if (!window.anydl) {
      return { ok: false as const, error: 'This preview is running in a plain browser tab. Install/run the desktop app for real analysis.' };
    }
    return window.anydl.analyzeUrl(url);
  },
  async startDownload(task: DownloadStartTask) {
    if (!window.anydl) return { ok: false, id: task.id };
    return window.anydl.startDownload(task);
  },
  async cancelDownload(id: string) {
    if (!window.anydl) return { ok: false };
    return window.anydl.cancelDownload(id);
  },
  async pauseDownload(id: string) {
    if (!window.anydl) return { ok: false };
    return window.anydl.pauseDownload(id);
  },
  async resumeDownload(task: DownloadStartTask) {
    if (!window.anydl) return { ok: false };
    return window.anydl.resumeDownload(task);
  },
  onDownloadEvent(cb: (evt: DownloadEvent) => void) {
    if (!window.anydl) return () => {};
    return window.anydl.onDownloadEvent(cb);
  },
  onSystemStats(cb: (stats: SystemStatsPayload) => void) {
    if (!window.anydl) return () => {};
    return window.anydl.onSystemStats(cb);
  },
  async getBrowserPartition(): Promise<string | null> {
    if (!window.anydl) return null;
    return window.anydl.getBrowserPartition();
  },
  onMediaDetected(cb: (evt: DetectedMediaEvent) => void) {
    if (!window.anydl) return () => {};
    return window.anydl.onMediaDetected(cb);
  }
};

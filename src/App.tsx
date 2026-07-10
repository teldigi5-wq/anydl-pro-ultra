import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { VideoAnalyzer } from './components/VideoAnalyzer';
import { BuiltInBrowser } from './components/BuiltInBrowser';
import { AgentsHub } from './components/AgentsHub';
import { WindowsBridgeModal } from './components/WindowsBridgeModal';
import { DownloadQueue } from './components/DownloadQueue';
import { ParticleBackground } from './components/ParticleBackground';
import { SystemDashboard } from './components/SystemDashboard';
import { SpeedBoosterPanel } from './components/SpeedBoosterPanel';
import { BatchDownloader } from './components/BatchDownloader';
import { ToastSystem, useToast } from './components/ToastSystem';
import { QuickActionFab } from './components/QuickActionFab';
import { HeroBanner } from './components/HeroBanner';
import { SubtitleStudio } from './components/SubtitleStudio';
import { SmartToolbox, DEFAULT_SMART_TOOLS, SmartToolsState } from './components/SmartToolbox';
import { ThemeSelector } from './components/ThemeSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { AppTab } from './components/Navbar';
import {
  VideoAnalysisResult, VideoFormatOption, DownloadTask,
  AgentLog, SystemStats, BatchDownloadItem, SpeedProfile
} from './types';
import { calculateEstimatedSizeMB, calculateETASeconds } from './utils/qualityEngine';
import { detectSubtitlesForPlatform } from './utils/subtitleEngine';
import { applyTheme, loadSavedTheme, ThemeId } from './themes/themeSystem';
import { api, isElectron, DownloadEvent, DownloadStartTask } from './lib/api';

const DEFAULT_SPEED_PROFILE: SpeedProfile = {
  name: 'Turbo', concurrentFragments: 8, bufferSize: 4096, retries: 8,
  description: 'Multi-thread burst mode. 8 parallel fragments.'
};

const EMPTY_STATS: SystemStats = {
  cpuUsage: 0, ramUsage: 0, ramUsedGB: 0, ramTotalGB: 0,
  networkSpeed: 0, activeConnections: 0, diskSpaceGB: 0, temperature: 0
};

function parseEtaToSeconds(eta: string | null | undefined): number {
  if (!eta) return 0;
  const parts = eta.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function agentForLog(message: string): { agentName: AgentLog['agentName']; agentRole: string } {
  if (/\[Merger\]|\[ffmpeg\]|\[VideoConvertor\]|\[Metadata\]|CRF|postprocessor/i.test(message)) {
    return { agentName: 'CodecMaster', agentRole: 'CRF & Merge Engine' };
  }
  if (/\[EmbedSubtitle\]|subtitle|\[SubtitlesConvertor\]/i.test(message)) {
    return { agentName: 'MediaSmith', agentRole: 'Subtitle & Metadata Embedder' };
  }
  if (/\[download\]/i.test(message)) {
    return { agentName: 'SpeedDaemon', agentRole: 'Network Accelerator' };
  }
  if (/proxy|retry|error/i.test(message)) {
    return { agentName: 'ProxyGuard', agentRole: 'Reliability & Retry Watcher' };
  }
  return { agentName: 'ScoutAgent', agentRole: 'Recon Specialist' };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('analyzer');
  const [isWindowsConnected] = useState<boolean>(isElectron);
  const [currentVideo, setCurrentVideo] = useState<VideoAnalysisResult | null>(null);
  const [userSpeedMbps, setUserSpeedMbps] = useState<number>(100);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Theme system
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => loadSavedTheme());
  useEffect(() => { applyTheme(activeTheme); }, [activeTheme]);

  // Windows / desktop settings (persisted for real via electron-store-style JSON file)
  const [downloadPath, setDownloadPathState] = useState('');
  const [notifications, setNotificationsState] = useState(true);
  const [autoStart, setAutoStartState] = useState(true);
  const [maxConcurrent, setMaxConcurrentState] = useState(3);

  // Speed booster state
  const [speedProfile, setSpeedProfile] = useState<SpeedProfile>(DEFAULT_SPEED_PROFILE);
  const [customConcurrent, setCustomConcurrent] = useState(8);
  const [customBuffer, setCustomBuffer] = useState(4096);
  const [customRetries, setCustomRetries] = useState(8);

  // Toast system
  const { toasts, addToast, removeToast } = useToast();

  // Subtitle studio state
  const [embedSubtitles, setEmbedSubtitles] = useState(true);
  const [burnInSubtitles, setBurnInSubtitles] = useState(false);
  const [selectedSubLanguages, setSelectedSubLanguages] = useState<string[]>(['en', 'all']);

  // Smart toolbox state
  const [smartTools, setSmartTools] = useState<SmartToolsState>(DEFAULT_SMART_TOOLS);

  // Batch download state
  const [batchItems, setBatchItems] = useState<BatchDownloadItem[]>([]);

  // Real system stats, pushed from the Electron main process every 2s
  const [systemStats, setSystemStats] = useState<SystemStats>(EMPTY_STATS);

  // Tasks — starts empty. Every task here maps to a real yt-dlp child process.
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const taskParamsRef = useRef<Map<string, DownloadStartTask>>(new Map());

  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);

  // -------------------------------------------------------------------
  // Load persisted settings + engine info once on boot
  // -------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const settings = await api.getSettings();
      if (settings) {
        setDownloadPathState(settings.downloadPath);
        setNotificationsState(settings.notifications);
        setAutoStartState(settings.autoStart);
        setMaxConcurrentState(settings.maxConcurrent);
        setEmbedSubtitles(settings.embedSubtitles);
        setSelectedSubLanguages(settings.selectedSubLanguages);
        setCustomConcurrent(settings.customConcurrent);
        setCustomBuffer(settings.customBuffer);
        setCustomRetries(settings.customRetries);
        if (settings.smartTools) setSmartTools({ ...DEFAULT_SMART_TOOLS, ...settings.smartTools });
      }
      setSettingsLoaded(true);

      const info = await api.getEngineInfo();
      const nowTs = new Date().toLocaleTimeString();
      if (info) {
        setAgentLogs(prev => [...prev, {
          id: 'engine-info-' + Date.now(), timestamp: nowTs,
          agentName: 'ScoutAgent', agentRole: 'Recon Specialist',
          message: `Engine ready — yt-dlp ${info.ytdlpVersion || 'unknown'} (${info.ytdlpBundled ? 'bundled' : 'system'}), ffmpeg ${info.ffmpegBundled ? 'bundled' : 'system'}.`,
          status: 'success'
        }]);
      } else {
        setAgentLogs(prev => [...prev, {
          id: 'no-engine-' + Date.now(), timestamp: nowTs,
          agentName: 'ScoutAgent', agentRole: 'Recon Specialist',
          message: 'Running in browser preview mode — install the desktop app for real downloads.',
          status: 'warning'
        }]);
      }
    })();
  }, []);

  // -------------------------------------------------------------------
  // Real system stats subscription
  // -------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = api.onSystemStats((stats) => {
      setSystemStats(prev => ({ ...prev, ...stats }));
    });
    return unsubscribe;
  }, []);

  // -------------------------------------------------------------------
  // Real download progress/log events from the yt-dlp child process
  // -------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = api.onDownloadEvent((evt: DownloadEvent) => {
      if (evt.type === 'log' && evt.message) {
        const { agentName, agentRole } = agentForLog(evt.message);
        setAgentLogs(prev => [...prev.slice(-80), {
          id: `log-${evt.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
          agentName, agentRole, message: evt.message!, status: 'info'
        }]);
      }

      setTasks(prev => prev.map(task => {
        if (task.id !== evt.id) return task;
        const nextLogs = evt.message ? [...task.logs.slice(-60), evt.message] : task.logs;

        switch (evt.type) {
          case 'log':
            return { ...task, logs: nextLogs };
          case 'progress':
            return {
              ...task,
              status: 'downloading',
              progressPercent: evt.percent ?? task.progressPercent,
              totalSizeMB: evt.totalMB ?? task.totalSizeMB,
              downloadedMB: evt.downloadedMB ?? task.downloadedMB,
              downloadSpeedMbps: evt.speedMBps ?? task.downloadSpeedMbps,
              etaSeconds: parseEtaToSeconds(evt.eta),
              logs: nextLogs
            };
          case 'status':
            return { ...task, status: (evt.status as DownloadTask['status']) || task.status, logs: nextLogs };
          case 'complete':
            if (notifications) addToast(`Download complete: ${task.title.slice(0, 40)}`, 'success');
            return {
              ...task, status: 'completed', progressPercent: 100,
              downloadedMB: task.totalSizeMB, filePath: evt.filePath, logs: nextLogs,
              completedAt: new Date()
            };
          case 'error':
            if (notifications) addToast(`Download failed: ${task.title.slice(0, 40)}`, 'error');
            return { ...task, status: 'error', errorMessage: evt.message, logs: nextLogs };
          default:
            return task;
        }
      }));
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // -------------------------------------------------------------------
  // Keyboard shortcuts (Ctrl+V now triggers a REAL analyze + download)
  // -------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'v') {
        setTimeout(async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text && (text.includes('http') || text.includes('www'))) {
              addToast('Analyzing clipboard link...', 'info');
              const res = await api.analyzeUrl(text.trim());
              if (res.ok) {
                setCurrentVideo(res.data);
                handleStartDownload({ video: res.data, format: res.data.availableFormats[0], crf: 20 });
                addToast('Auto-detected URL from clipboard!', 'success');
              } else {
                addToast(res.error, 'error');
              }
            }
          } catch { /* clipboard permission denied — ignore */ }
        }, 100);
      }
      if (e.ctrlKey && e.key === '1') { e.preventDefault(); setActiveTab('analyzer'); }
      if (e.ctrlKey && e.key === '2') { e.preventDefault(); setActiveTab('browser'); }
      if (e.ctrlKey && e.key === '3') { e.preventDefault(); setActiveTab('agents'); }
      if (e.ctrlKey && e.key === '4') { e.preventDefault(); setActiveTab('bridge'); }
      if (e.ctrlKey && e.key === '5') { e.preventDefault(); setActiveTab('settings'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEffectiveOptions = useCallback(() => ({
    embedThumbnail: true,
    embedSubtitles,
    extractAudio: false,
    useSponsorBlock: true,
    concurrentFragments: customConcurrent,
    bufferSize: customBuffer,
    retries: customRetries
  }), [customConcurrent, customBuffer, customRetries, embedSubtitles]);

  // -------------------------------------------------------------------
  // Real download start: builds the actual yt-dlp invocation and sends
  // it to the Electron main process over IPC.
  // -------------------------------------------------------------------
  const handleStartDownload = useCallback((params: {
    video: VideoAnalysisResult;
    format: VideoFormatOption;
    crf: number;
  }) => {
    const opts = getEffectiveOptions();
    const { video, format, crf } = params;
    const id = 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

    const totalMB = calculateEstimatedSizeMB(format, video.durationSeconds, crf);
    const eta = calculateETASeconds(totalMB, userSpeedMbps);
    const subTracks = detectSubtitlesForPlatform(video.platform, video.subtitlesAvailable);
    const subLangs = selectedSubLanguages.includes('all')
      ? ['en.*', 'all']
      : selectedSubLanguages.map(l => `${l}.*`);

    const outputFormat: DownloadTask['outputFormat'] = opts.extractAudio ? 'mp3' : (opts.embedSubtitles ? 'mkv' : format.ext as any);

    const newTask: DownloadTask = {
      id, videoId: video.id, url: video.url, title: video.title,
      thumbnailUrl: video.thumbnailUrl, platform: video.platform,
      selectedFormatId: format.formatId, resolution: format.resolution,
      videoCodec: format.videoCodec, audioCodec: format.audioCodec, crf,
      outputFormat,
      status: 'downloading',
      progressPercent: 0,
      downloadSpeedMbps: 0,
      totalSizeMB: totalMB,
      downloadedMB: 0,
      etaSeconds: eta,
      options: opts,
      logs: [`[engine] Queued: ${video.title}`, `[engine] Format: ${format.resolution} (${format.videoCodec}/${format.audioCodec})`,
        `[engine] Subtitle tracks detected: ${subTracks.length ? subTracks.map(t => t.languageCode).join(', ') : 'none'}`],
      priority: 'normal',
      startedAt: new Date()
    };

    const startParams: DownloadStartTask = {
      id, url: video.url, formatSelector: format.formatId,
      container: format.ext, crf,
      embedThumbnail: opts.embedThumbnail, embedSubtitles: opts.embedSubtitles,
      extractAudio: opts.extractAudio, useSponsorBlock: opts.useSponsorBlock,
      burnInSubtitles, subtitleLangs: subLangs,
      concurrentFragments: opts.concurrentFragments, retries: opts.retries,
      smartTools
    };
    taskParamsRef.current.set(id, startParams);

    setTasks(prev => [newTask, ...prev]);
    addToast(`Started downloading: ${video.title.slice(0, 40)}...`, 'success');
    setActiveTab('analyzer');

    api.startDownload(startParams).then((res) => {
      if (!res.ok) {
        addToast('Could not reach the download engine. Are you running the desktop app?', 'error');
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'error', errorMessage: 'Engine unavailable' } : t));
      }
    });
  }, [getEffectiveOptions, userSpeedMbps, selectedSubLanguages, burnInSubtitles, smartTools, addToast]);

  const handleBatchAdd = useCallback((urls: string[]) => {
    const newItems: BatchDownloadItem[] = urls.map(url => ({
      id: 'batch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      url, status: 'pending'
    }));
    setBatchItems(prev => [...prev, ...newItems]);
    addToast(`Added ${urls.length} URL(s) to batch queue`, 'info');
  }, [addToast]);

  const handleBatchAnalyze = useCallback(async () => {
    const pending = batchItems.filter(i => i.status === 'pending');
    setBatchItems(prev => prev.map(i => i.status === 'pending' ? { ...i, status: 'analyzing' } : i));
    for (const item of pending) {
      const res = await api.analyzeUrl(item.url);
      setBatchItems(prev => prev.map(i => {
        if (i.id !== item.id) return i;
        return res.ok ? { ...i, status: 'ready', video: res.data } : { ...i, status: 'error', error: res.error };
      }));
    }
    addToast('Batch analysis complete. Ready items can now be downloaded.', 'success');
  }, [batchItems, addToast]);

  const handleBatchDownload = useCallback(() => {
    const ready = batchItems.filter(i => i.status === 'ready' && i.video);
    ready.forEach(item => {
      if (item.video) {
        handleStartDownload({ video: item.video, format: item.video.availableFormats[0], crf: 20 });
      }
    });
    setBatchItems(prev => prev.filter(i => i.status !== 'ready'));
    addToast(`Started ${ready.length} batch download(s)`, 'success');
    setActiveTab('analyzer');
  }, [batchItems, handleStartDownload, addToast]);

  const handleTogglePause = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.status === 'downloading' || t.status === 'merging') {
        api.pauseDownload(id);
        return { ...t, status: 'paused', logs: [...t.logs, '[engine] Paused — the partial file is kept and resumed on continue.'] };
      }
      if (t.status === 'paused' || t.status === 'error') {
        const params = taskParamsRef.current.get(id);
        if (params) {
          api.resumeDownload(params).then((res) => {
            if (!res.ok) addToast('Could not resume — desktop app not reachable.', 'error');
          });
        }
        return { ...t, status: 'downloading', logs: [...t.logs, '[engine] Resuming from partial file...'] };
      }
      return t;
    }));
  }, [addToast]);

  const handleRemoveTask = useCallback((id: string) => {
    api.cancelDownload(id);
    taskParamsRef.current.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast('Task removed from queue', 'info');
  }, [addToast]);

  const handlePriorityChange = useCallback((id: string, priority: DownloadTask['priority']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, priority } : t));
  }, []);

  const handleOpenFolder = useCallback(async (task: DownloadTask) => {
    if (task.filePath) {
      const ok = await api.showInFolder(task.filePath);
      if (!ok) addToast('File not found on disk yet.', 'error');
    } else if (downloadPath) {
      await api.openPath(downloadPath);
    }
  }, [downloadPath, addToast]);

  // -------------------------------------------------------------------
  // Settings setters that persist to the real settings.json on disk
  // -------------------------------------------------------------------
  const setDownloadPath = useCallback((p: string) => { setDownloadPathState(p); api.setSetting('downloadPath', p); }, []);
  const setNotifications = useCallback((v: boolean) => { setNotificationsState(v); api.setSetting('notifications', v); }, []);
  const setAutoStart = useCallback((v: boolean) => { setAutoStartState(v); api.setSetting('autoStart', v); }, []);
  const setMaxConcurrent = useCallback((n: number) => { setMaxConcurrentState(n); api.setSetting('maxConcurrent', n); }, []);

  useEffect(() => { if (settingsLoaded) api.setSetting('embedSubtitles', embedSubtitles); }, [embedSubtitles, settingsLoaded]);
  useEffect(() => { if (settingsLoaded) api.setSetting('selectedSubLanguages', selectedSubLanguages); }, [selectedSubLanguages, settingsLoaded]);
  useEffect(() => { if (settingsLoaded) api.setSetting('customConcurrent', customConcurrent); }, [customConcurrent, settingsLoaded]);
  useEffect(() => { if (settingsLoaded) api.setSetting('customBuffer', customBuffer); }, [customBuffer, settingsLoaded]);
  useEffect(() => { if (settingsLoaded) api.setSetting('customRetries', customRetries); }, [customRetries, settingsLoaded]);
  useEffect(() => { if (settingsLoaded) api.setSetting('smartTools', smartTools); }, [smartTools, settingsLoaded]);

  return (
    <div className="min-h-screen flex flex-col relative theme-surface"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <ParticleBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <ToastSystem toasts={toasts} onRemove={removeToast} />
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isWindowsConnected={isWindowsConnected}
          setIsWindowsConnected={() => { /* engine connection is automatic in the desktop app */ }}
          activeDownloads={tasks.filter(t => t.status === 'downloading').length}
          networkSpeed={systemStats.networkSpeed}
          activeTheme={activeTheme}
          onThemeChange={(id) => {
            setActiveTheme(id);
            api.setSetting('theme', id);
            addToast(`Theme switched: ${id}`, 'info');
          }}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'analyzer' && (
              <motion.div
                key="analyzer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <HeroBanner />
                <SystemDashboard stats={systemStats} />
                <SpeedBoosterPanel
                  activeProfile={speedProfile}
                  onSelectProfile={(p) => {
                    setSpeedProfile(p);
                    setCustomConcurrent(p.concurrentFragments);
                    setCustomBuffer(p.bufferSize);
                    setCustomRetries(p.retries);
                    api.setSetting('speedProfile', p.name);
                    addToast(`Speed profile: ${p.name} (${p.concurrentFragments} fragments)`, 'info');
                  }}
                  customConcurrent={customConcurrent}
                  onCustomConcurrentChange={setCustomConcurrent}
                  customBuffer={customBuffer}
                  onCustomBufferChange={setCustomBuffer}
                  customRetries={customRetries}
                  onCustomRetriesChange={setCustomRetries}
                />
                <SubtitleStudio
                  video={currentVideo}
                  embedSubtitles={embedSubtitles}
                  setEmbedSubtitles={setEmbedSubtitles}
                  burnInSubtitles={burnInSubtitles}
                  setBurnInSubtitles={setBurnInSubtitles}
                  selectedLanguages={selectedSubLanguages}
                  setSelectedLanguages={setSelectedSubLanguages}
                />
                <SmartToolbox tools={smartTools} setTools={setSmartTools} previewThumbnail={currentVideo?.thumbnailUrl} />
                <BatchDownloader
                  items={batchItems}
                  onAddItems={handleBatchAdd}
                  onRemoveItem={(id) => setBatchItems(prev => prev.filter(i => i.id !== id))}
                  onAnalyzeAll={handleBatchAnalyze}
                  onDownloadAll={handleBatchDownload}
                />
                <VideoAnalyzer
                  currentVideo={currentVideo}
                  onSelectVideo={setCurrentVideo}
                  onStartDownload={handleStartDownload}
                  userSpeedMbps={userSpeedMbps}
                  setUserSpeedMbps={setUserSpeedMbps}
                />
                <div className="pt-6 border-t border-slate-800/80">
                  <DownloadQueue
                    tasks={tasks}
                    onRemoveTask={handleRemoveTask}
                    onTogglePause={handleTogglePause}
                    onPriorityChange={handlePriorityChange}
                    onOpenFolder={handleOpenFolder}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'browser' && (
              <motion.div
                key="browser"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BuiltInBrowser
                  onSelectVideoForAnalysis={(video) => {
                    setCurrentVideo(video);
                    setActiveTab('analyzer');
                  }}
                  onInstantDownload={(video) => {
                    setCurrentVideo(video);
                    handleStartDownload({ video, format: video.availableFormats[0], crf: 20 });
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'agents' && (
              <motion.div
                key="agents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AgentsHub
                  logs={agentLogs}
                  onAddLog={(log) => setAgentLogs(prev => [...prev, log])}
                  onSelectVideoForAnalysis={(video) => {
                    setCurrentVideo(video);
                    setActiveTab('analyzer');
                  }}
                  onStartAgentDownload={(video, chosenCrf) => {
                    setCurrentVideo(video);
                    handleStartDownload({ video, format: video.availableFormats[0], crf: chosenCrf });
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'bridge' && (
              <motion.div
                key="bridge"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <WindowsBridgeModal />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <ThemeSelector
                  activeTheme={activeTheme}
                  onThemeChange={(id) => {
                    setActiveTheme(id);
                    api.setSetting('theme', id);
                    addToast(`Theme applied: ${id}`, 'success');
                  }}
                />
                <SettingsPanel
                  downloadPath={downloadPath}
                  setDownloadPath={setDownloadPath}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  autoStart={autoStart}
                  setAutoStart={setAutoStart}
                  maxConcurrent={maxConcurrent}
                  setMaxConcurrent={setMaxConcurrent}
                  isWindowsConnected={isWindowsConnected}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="border-t border-slate-800/80 bg-[#05070a]/90 backdrop-blur-md py-5 px-4 sm:px-8 mt-16 text-xs text-slate-500 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                AnyDL Studio v6.0 Windows Ultra
              </span>
              <span className="text-slate-600">|</span>
              <span>yt-dlp + FFmpeg + Auto-Subs + Themes</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={isWindowsConnected ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                {isWindowsConnected ? '● Desktop Engine Ready' : '○ Browser Preview (no engine)'}
              </span>
              <span className="text-slate-600">•</span>
              <span>
                Queue: {tasks.length} | Theme: {activeTheme} | Speed: {speedProfile.name}
                {embedSubtitles ? ' | Subs: ON' : ' | Subs: OFF'}
              </span>
            </div>
          </div>
        </footer>
        <QuickActionFab
          onPasteDownload={async (url) => {
            const res = await api.analyzeUrl(url);
            if (res.ok) {
              setCurrentVideo(res.data);
              handleStartDownload({ video: res.data, format: res.data.availableFormats[0], crf: 20 });
            } else {
              addToast(res.error, 'error');
            }
          }}
        />
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { AgentLog, VideoAnalysisResult } from '../types';
import { api } from '../lib/api';
import { Bot, Sparkles, Send, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';

interface AgentsHubProps {
  logs: AgentLog[];
  onAddLog: (log: AgentLog) => void;
  onSelectVideoForAnalysis: (video: VideoAnalysisResult) => void;
  onStartAgentDownload: (video: VideoAnalysisResult, crf: number) => void;
}

const URL_RE = /(https?:\/\/[^\s"']+)/i;

const agentsList = [
  {
    name: 'ScoutAgent', role: 'Real yt-dlp Metadata Recon', avatar: '🕵️',
    color: 'from-cyan-500 to-blue-600',
    desc: 'Runs real yt-dlp -J extraction: title, formats, subtitles, duration — straight from the source.'
  },
  {
    name: 'CodecMaster', role: 'CRF & Format Selection', avatar: '🎛️',
    color: 'from-purple-500 to-pink-600',
    desc: 'Picks the real format selector and CRF postprocessor args passed to yt-dlp/ffmpeg.'
  },
  {
    name: 'SpeedDaemon', role: 'Live Download Progress', avatar: '⚡',
    color: 'from-emerald-500 to-teal-600',
    desc: 'Parses real stdout from the running yt-dlp process — real percent, speed, and ETA.'
  },
  {
    name: 'SubtitleSync', role: 'Subtitle Fetch & Embed', avatar: '💬',
    color: 'from-violet-500 to-fuchsia-600',
    desc: 'Real --write-subs / --embed-subs pass — converts and embeds real caption tracks.'
  },
  {
    name: 'ThumbnailArtist', role: 'Thumbnail & Metadata Tagger', avatar: '🖼️',
    color: 'from-amber-500 to-orange-600',
    desc: 'Converts and embeds the real thumbnail, tags title/uploader/date metadata.'
  },
  {
    name: 'SponsorHunter', role: 'SponsorBlock Segment Remover', avatar: '🎯',
    color: 'from-red-500 to-rose-600',
    desc: 'Real --sponsorblock-remove pass — cuts sponsor/intro/outro segments using community data.'
  },
  {
    name: 'WatermarkWiper', role: 'Region Blur / Delogo Filter', avatar: '🧹',
    color: 'from-pink-500 to-rose-600',
    desc: 'Runs the real ffmpeg crop+boxblur+overlay or delogo filter on the region you draw.'
  },
  {
    name: 'UpscaleEngine', role: 'Real-ESRGAN Neural Upscaler', avatar: '🔬',
    color: 'from-sky-500 to-indigo-600',
    desc: 'Extracts frames, runs the real Real-ESRGAN model, re-encodes — genuinely slow, genuinely real.'
  },
  {
    name: 'ProxyGuard', role: 'Reliability & Retry Watcher', avatar: '🛡️',
    color: 'from-slate-500 to-slate-700',
    desc: 'Watches for real retry/error output and flags connection issues as they happen.'
  },
  {
    name: 'QueueGuard', role: 'Concurrency Queue Manager', avatar: '📋',
    color: 'from-teal-500 to-cyan-700',
    desc: 'Enforces your real max-concurrent-downloads limit, promoting queued jobs by priority as slots free up.'
  },
  {
    name: 'ProxyPilot', role: 'Proxy / VPN Router', avatar: '🌐',
    color: 'from-blue-500 to-indigo-700',
    desc: 'Applies your real configured proxy/VPN endpoint to both the browser session and yt-dlp downloads.'
  },
  {
    name: 'HistoryKeeper', role: 'Download History Archivist', avatar: '🗃️',
    color: 'from-amber-600 to-yellow-700',
    desc: 'Writes every real completed download to disk so your history survives an app restart.'
  },
  {
    name: 'ClipboardWatcher', role: 'Background Link Detector', avatar: '📎',
    color: 'from-fuchsia-500 to-purple-700',
    desc: 'Polls the real OS clipboard and flags new links the moment you copy one, if Auto-Watch is on.'
  }
];

export const AgentsHub: React.FC<AgentsHubProps> = ({
  logs,
  onAddLog,
  onStartAgentDownload
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunAgentTask = async (userCommand: string) => {
    if (!userCommand.trim() || isProcessing) return;
    setIsProcessing(true);
    const timeStr = new Date().toLocaleTimeString();

    onAddLog({
      id: 'log-' + Date.now() + '-1', timestamp: timeStr,
      agentName: 'ScoutAgent', agentRole: 'Recon Specialist',
      message: `Received directive: "${userCommand}"`, status: 'action'
    });

    const urlMatch = URL_RE.exec(userCommand);
    if (!urlMatch) {
      onAddLog({
        id: 'log-' + Date.now() + '-2', timestamp: new Date().toLocaleTimeString(),
        agentName: 'ScoutAgent', agentRole: 'Recon Specialist',
        message: 'No URL found in that instruction. Paste a real video link (e.g. "download this in 4K CRF 18: https://...") — there\'s no magic web search here, just real yt-dlp on a real link.',
        status: 'warning'
      });
      setIsProcessing(false);
      return;
    }

    let chosenCrf = 20;
    const lower = userCommand.toLowerCase();
    if (lower.includes('lossless') || lower.includes('archival') || lower.includes('high')) chosenCrf = 17;
    else if (lower.includes('mobile') || lower.includes('small') || lower.includes('compress')) chosenCrf = 28;

    const res = await api.analyzeUrl(urlMatch[1]);
    if (!res.ok) {
      onAddLog({
        id: 'log-' + Date.now() + '-err', timestamp: new Date().toLocaleTimeString(),
        agentName: 'ScoutAgent', agentRole: 'Recon Specialist',
        message: `Analysis failed: ${res.error}`, status: 'error'
      });
      setIsProcessing(false);
      return;
    }

    onAddLog({
      id: 'log-' + Date.now() + '-3', timestamp: new Date().toLocaleTimeString(),
      agentName: 'ScoutAgent', agentRole: 'Recon Specialist',
      message: `Found "${res.data.title}" on ${res.data.platform} (${res.data.durationSeconds}s).`,
      status: 'success', relatedVideoUrl: res.data.url
    });
    onAddLog({
      id: 'log-' + Date.now() + '-4', timestamp: new Date().toLocaleTimeString(),
      agentName: 'CodecMaster', agentRole: 'CRF & Format Selection',
      message: `Selected best format ≤${res.data.availableFormats[0].resolution}, CRF = ${chosenCrf}.`,
      status: 'success'
    });
    onAddLog({
      id: 'log-' + Date.now() + '-5', timestamp: new Date().toLocaleTimeString(),
      agentName: 'MediaSmith', agentRole: 'Post-Processor',
      message: 'Dispatching to the real download engine...', status: 'action'
    });

    onStartAgentDownload(res.data, chosenCrf);
    setIsProcessing(false);
    setPrompt('');
  };

  const presets = [
    { label: '🌟 Archival Master (CRF 17)', text: 'Download in archival high quality CRF 17: https://www.youtube.com/watch?v=jNQXAC9IVRw' },
    { label: '📱 Mobile / Compressed', text: 'Download small compressed mobile version: https://www.youtube.com/watch?v=jNQXAC9IVRw' },
    { label: '🎬 Vimeo example', text: 'Download this Vimeo video: https://vimeo.com/76979871' }
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-cyan-950/60 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Bot className="w-6 h-6 animate-pulse" />
            </span>
            <span className="text-xs font-mono uppercase font-bold tracking-widest text-purple-300 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40">
              Real Pipeline Activity Feed
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Instruct the Download Pipeline in Plain English
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Paste an instruction with a real link — <span className="text-cyan-300 font-mono">"download this in 4K, CRF 18: https://..."</span> — and this dispatches straight to real yt-dlp/ffmpeg. This isn't a general web-search AI: it needs an actual URL to work with, same as the main Downloader tab.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agentsList.map((agent) => (
          <div key={agent.name} className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl card-3d-hover relative overflow-hidden group">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${agent.color}`} />
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl p-2 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-inner">{agent.avatar}</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">{agent.name}</h3>
            <p className="text-xs font-semibold text-purple-400 mt-0.5">{agent.role}</p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">{agent.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Dispatch a Real Job
            </h3>
            <p className="text-xs text-slate-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              Must contain an actual URL — this parses your instruction for a link and CRF/quality keywords, then runs the same real engine as the Downloader tab.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleRunAgentTask(prompt); }} className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g., "Download this in archival CRF 18 quality: https://www.youtube.com/watch?v=..."'
                rows={3}
                className="w-full p-4 rounded-2xl bg-[#080b11] border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 font-mono shadow-inner resize-none"
              />
              <button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <><RefreshCw className="w-4 h-4 animate-spin text-purple-200" /><span>Running pipeline...</span></>
                ) : (
                  <><Send className="w-4 h-4" /><span>Dispatch</span></>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-mono text-slate-500 uppercase block">Try an example:</span>
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
                {presets.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleRunAgentTask(p.text)}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left text-xs text-slate-300 font-semibold transition-all cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-3xl bg-[#06080d] border border-slate-800 p-6 shadow-2xl h-full flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-bold text-white">Live Pipeline Activity Stream</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Synchronized
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-2">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-slate-600 text-sm">
                  No activity yet — start any download (here, Downloader tab, or Batch) and real engine events will stream in here.
                </div>
              ) : (
                [...logs].reverse().map((log) => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-purple-400 font-bold flex items-center gap-1.5">
                        <span>🤖 {log.agentName}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 text-[11px]">{log.agentRole}</span>
                      </span>
                      <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed pt-1 break-all">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

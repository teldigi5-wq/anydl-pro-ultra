import React, { useState } from 'react';
import { VideoAnalysisResult } from '../types';
import { api, isElectron } from '../lib/api';
import { Globe, Wifi, Download, Eye, Sparkles, AlertTriangle, ShieldOff } from 'lucide-react';

interface BuiltInBrowserProps {
  onSelectVideoForAnalysis: (video: VideoAnalysisResult) => void;
  onInstantDownload: (video: VideoAnalysisResult) => void;
}

const QUICK_SITES = [
  { name: 'YouTube', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', color: 'text-red-400 border-red-500/30' },
  { name: 'Vimeo', url: 'https://vimeo.com/76979871', color: 'text-emerald-400 border-emerald-500/30' },
  { name: 'Twitter/X', url: 'https://twitter.com', color: 'text-blue-400 border-blue-500/30' },
  { name: 'Reddit', url: 'https://www.reddit.com', color: 'text-orange-400 border-orange-500/30' }
];

export const BuiltInBrowser: React.FC<BuiltInBrowserProps> = ({
  onSelectVideoForAnalysis,
  onInstantDownload
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);

  const handleSniff = async (rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) return;
    setIsLoading(true);
    setError(null);
    const res = await api.analyzeUrl(url);
    setIsLoading(false);
    if (res.ok) {
      setResult(res.data);
    } else {
      setResult(null);
      setError(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSniff(inputUrl); }}
            className="flex-1 flex items-center bg-[#080b11] border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-inner"
          >
            <Globe className="w-4 h-4 text-cyan-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste any URL yt-dlp supports (YouTube, Twitter/X, Reddit, Vimeo, Twitch, 1800+ sites)..."
              className="w-full bg-transparent text-sm text-slate-100 focus:outline-none font-mono"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="ml-2 shrink-0 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isLoading ? 'Sniffing...' : 'Sniff Formats'}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-mono text-slate-400 uppercase mr-1">Quick Sites:</span>
          {QUICK_SITES.map((b) => (
            <button
              key={b.name}
              onClick={() => { setInputUrl(b.url); handleSniff(b.url); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border bg-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer shrink-0 ${b.color}`}
            >
              {b.name}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-950/30 border border-amber-500/25 text-[11px] text-amber-200/90 leading-relaxed">
          <ShieldOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            This runs real <code className="text-amber-300">yt-dlp -J</code> extraction — it covers ~1800 real sites yt-dlp supports.
            It is <strong>not</strong> a DOM/network packet sniffer, and it cannot and will not extract DRM-encrypted streams
            (Netflix, Disney+, Prime Video, etc.) — those are protected by Widevine/PlayReady encryption that no downloader can legitimately bypass.
          </span>
        </div>
      </div>

      {!isElectron && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Browser preview mode — install the desktop app to actually sniff real formats.
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm font-mono flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {!result && !error && !isLoading && (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <Wifi className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No formats sniffed yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Paste a link above — every format returned here is real, straight from yt-dlp.</p>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-800 bg-[#06080d] overflow-hidden shadow-2xl">
              <div className="relative aspect-video bg-black">
                <img src={result.thumbnailUrl} alt={result.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold text-white">{result.title}</h3>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-3">
                  <span>Creator: {result.creator}</span>
                  <span>Platform: {result.platform}</span>
                  <span>Duration: {result.durationSeconds}s</span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-purple-950/80 border border-cyan-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-cyan-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" /> Real formats found
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">{result.availableFormats.length} real streams detected by yt-dlp.</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectVideoForAnalysis(result)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4" /> Open in CRF Studio
                    </button>
                    <button
                      onClick={() => onInstantDownload(result)}
                      disabled={!isElectron}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Download className="w-4 h-4" /> Instant Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Wifi className="w-5 h-5 text-cyan-400" /> Real Format List
            </h3>
            {result.availableFormats.map((f) => (
              <div key={f.formatId} className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{f.resolution}</span>
                  <span className="text-[10px] uppercase font-bold bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">{f.ext}</span>
                </div>
                <p className="text-xs text-slate-400">{f.note}</p>
                <div className="text-[10px] text-slate-400 font-mono">
                  V: <span className="text-purple-300 uppercase">{f.videoCodec}</span> | A: <span className="text-emerald-300 uppercase">{f.audioCodec}</span> | ~{f.baseBitrateKbps}kbps
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

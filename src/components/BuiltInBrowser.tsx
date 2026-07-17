import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VideoAnalysisResult } from '../types';
import { api, isElectron, DetectedMediaEvent } from '../lib/api';
import { ElectronWebviewElement } from '../types/webview';
import {
  Globe, Wifi, Download, Eye, Sparkles, AlertTriangle, ShieldOff,
  ArrowLeft, ArrowRight, RotateCw, X, Copy, Check, Radio, Trash2
} from 'lucide-react';

interface BuiltInBrowserProps {
  onSelectVideoForAnalysis: (video: VideoAnalysisResult) => void;
  onInstantDownload: (video: VideoAnalysisResult) => void;
}

const QUICK_SITES = [
  { name: 'YouTube', url: 'https://www.youtube.com', color: 'text-red-400 border-red-500/30' },
  { name: 'Vimeo', url: 'https://vimeo.com', color: 'text-emerald-400 border-emerald-500/30' },
  { name: 'Twitter/X', url: 'https://twitter.com', color: 'text-blue-400 border-blue-500/30' },
  { name: 'Reddit', url: 'https://www.reddit.com', color: 'text-orange-400 border-orange-500/30' },
  { name: 'Twitch', url: 'https://www.twitch.tv', color: 'text-purple-400 border-purple-500/30' }
];

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const BuiltInBrowser: React.FC<BuiltInBrowserProps> = ({
  onSelectVideoForAnalysis,
  onInstantDownload
}) => {
  const webviewRef = useRef<ElectronWebviewElement | null>(null);
  const [partition, setPartition] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState('https://www.youtube.com');
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [detectedMedia, setDetectedMedia] = useState<DetectedMediaEvent[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [preloadPath, setPreloadPath] = useState<string | null>(null);

  // Manual sniffer (paste a link directly, no browsing needed)
  const [manualUrl, setManualUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);

  useEffect(() => {
    if (!isElectron) return;
    api.getBrowserPartition().then(setPartition);
    api.getBrowserPreloadPath().then(setPreloadPath);
    const unsubscribe = api.onMediaDetected((evt) => {
      setDetectedMedia(prev => {
        if (prev.some(m => m.url === evt.url)) return prev;
        return [evt, ...prev].slice(0, 60);
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv || !isElectron) return;

    const onStart = () => setIsPageLoading(true);
    const onStop = () => {
      setIsPageLoading(false);
      try {
        setCanGoBack(wv.canGoBack());
        setCanGoForward(wv.canGoForward());
        setAddressInput(wv.getURL());
      } catch { /* webview not ready yet */ }
    };
    const onNewWindow = (e: any) => {
      e.preventDefault?.();
      if (e.url) wv.loadURL(e.url);
    };
    const onIpcMessage = (e: any) => {
      if (e.channel === 'anydl:download-clicked' && e.args?.[0]?.url) {
        handleAnalyzeDetected(e.args[0].url);
      }
    };

    wv.addEventListener('did-start-loading', onStart);
    wv.addEventListener('did-stop-loading', onStop);
    wv.addEventListener('did-navigate', onStop);
    wv.addEventListener('did-navigate-in-page', onStop);
    wv.addEventListener('new-window', onNewWindow);
    wv.addEventListener('ipc-message', onIpcMessage);

    return () => {
      wv.removeEventListener('did-start-loading', onStart);
      wv.removeEventListener('did-stop-loading', onStop);
      wv.removeEventListener('did-navigate', onStop);
      wv.removeEventListener('did-navigate-in-page', onStop);
      wv.removeEventListener('new-window', onNewWindow);
      wv.removeEventListener('ipc-message', onIpcMessage);
    };
  }, [partition]);

  const navigate = useCallback((url: string) => {
    const target = normalizeUrl(url);
    if (!target) return;
    setAddressInput(target);
    if (webviewRef.current) {
      webviewRef.current.loadURL(target).catch(() => { /* ignore transient nav errors */ });
    }
  }, []);

  const handleAnalyzeDetected = async (url: string) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    const res = await api.analyzeUrl(url);
    setIsAnalyzing(false);
    if (res.ok) {
      setResult(res.data);
    } else {
      setAnalyzeError(`${url.slice(0, 60)}... — ${res.error}`);
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const handleManualSniff = async (rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    const res = await api.analyzeUrl(url);
    setIsAnalyzing(false);
    if (res.ok) setResult(res.data);
    else { setResult(null); setAnalyzeError(res.error); }
  };

  return (
    <div className="space-y-6">
      {/* Real embedded browser */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => webviewRef.current?.goBack()} disabled={!canGoBack}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => webviewRef.current?.goForward()} disabled={!canGoForward}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-all">
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => isPageLoading ? webviewRef.current?.stop() : webviewRef.current?.reload()}
              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition-all">
              {isPageLoading ? <X className="w-4 h-4" /> : <RotateCw className="w-4 h-4" />}
            </button>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); navigate(addressInput); }}
            className="flex-1 flex items-center bg-[#080b11] border border-slate-700/80 rounded-2xl px-4 py-2 shadow-inner"
          >
            <Globe className="w-4 h-4 text-cyan-400 mr-2.5 shrink-0" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Browse any real site — youtube.com, twitter.com, reddit.com..."
              className="w-full bg-transparent text-sm text-slate-100 focus:outline-none font-mono"
            />
            {isPageLoading && <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />}
          </form>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-3 pt-2.5 pb-2 border-b border-slate-800/60">
          <span className="text-xs font-mono text-slate-500 uppercase mr-1 shrink-0">Quick Sites:</span>
          {QUICK_SITES.map((b) => (
            <button
              key={b.name}
              onClick={() => navigate(b.url)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border bg-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer shrink-0 ${b.color}`}
            >
              {b.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3">
          <div className="xl:col-span-2 bg-black" style={{ height: '72vh', minHeight: 560 }}>
            {isElectron && partition ? (
              <webview
                ref={webviewRef as any}
                {...({ src: addressInput, partition, allowpopups: 'true', preload: preloadPath || undefined } as any)}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-center p-8">
                <div>
                  <Globe className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Real embedded browsing needs the desktop app.</p>
                  <p className="text-slate-600 text-xs mt-1">This preview can't load a live webview in a plain browser tab.</p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t xl:border-t-0 xl:border-l border-slate-800 flex flex-col" style={{ maxHeight: '72vh', minHeight: 560 }}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> Live Network Sniffer
              </h3>
              {detectedMedia.length > 0 && (
                <button onClick={() => setDetectedMedia([])} className="text-slate-500 hover:text-red-400 transition-all" title="Clear list">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {detectedMedia.length === 0 ? (
                <p className="text-xs text-slate-500 p-3 leading-relaxed">
                  Browse to a page with video (e.g. a YouTube watch page or a direct MP4 link) — real media
                  requests intercepted from the page's own network traffic (via <code className="text-slate-400">session.webRequest</code>)
                  will show up here as they happen.
                </p>
              ) : detectedMedia.map((m) => (
                <div key={m.url} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 shrink-0">
                      {m.kind}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleCopy(m.url)} className="p-1 rounded text-slate-400 hover:text-white transition-all" title="Copy URL">
                        {copiedUrl === m.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono break-all leading-snug">{m.url}</p>
                  <button
                    onClick={() => handleAnalyzeDetected(m.url)}
                    className="w-full mt-1 px-2 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-[11px] font-bold transition-all"
                  >
                    Analyze with yt-dlp
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 border-t border-slate-800 bg-amber-950/20 text-[11px] text-amber-200/90 leading-relaxed">
          <ShieldOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            This intercepts real network responses from the page you're browsing and flags ones that look like
            media (by URL pattern and Content-Type) — a real, working equivalent of a browser's Network tab
            filtered for video/audio. It still can't and won't extract DRM-encrypted streams (Netflix, Disney+,
            Prime Video, etc.) — those are protected by real encryption no downloader can legitimately bypass.
          </span>
        </div>
      </div>

      {/* Manual link analyzer */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 shadow-2xl space-y-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleManualSniff(manualUrl); }}
          className="flex items-center bg-[#080b11] border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-inner gap-2"
        >
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Or paste any link directly (skip browsing) — yt-dlp supports ~1800 sites..."
            className="w-full bg-transparent text-sm text-slate-100 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={isAnalyzing}
            className="shrink-0 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {!isElectron && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Browser preview mode — install the desktop app for the real browser + sniffer.
        </div>
      )}

      {analyzeError && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm font-mono flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {analyzeError}
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoAnalysisResult, VideoFormatOption } from '../types';
import { calculateEstimatedSizeMB, calculateETASeconds, formatDuration, generateYtDlpCommand } from '../utils/qualityEngine';
import { api, isElectron } from '../lib/api';
import { useTilt3D } from '../hooks/useTilt3D';
import {
  Search, Sliders, Film, Radio, Cpu, Copy, Check, Sparkles,
  DownloadCloud, Image, Subtitles, Volume2, Ban, MonitorPlay, AlertTriangle
} from 'lucide-react';

interface VideoAnalyzerProps {
  currentVideo: VideoAnalysisResult | null;
  onSelectVideo: (video: VideoAnalysisResult) => void;
  onStartDownload: (params: { video: VideoAnalysisResult; format: VideoFormatOption; crf: number }) => void;
  userSpeedMbps: number;
  setUserSpeedMbps: (val: number) => void;
}

const EXAMPLE_URLS = [
  { label: 'YouTube', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
  { label: 'Vimeo', url: 'https://vimeo.com/76979871' },
  { label: 'Twitch clip', url: 'https://www.twitch.tv/videos/' }
];

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({
  currentVideo,
  onSelectVideo,
  onStartDownload,
  userSpeedMbps,
  setUserSpeedMbps
}) => {
  const [urlInput, setUrlInput] = useState(currentVideo?.url || '');
  const [selectedFormatId, setSelectedFormatId] = useState<string>(
    currentVideo?.availableFormats[0]?.formatId || ''
  );
  const [crf, setCrf] = useState<number>(20);
  const [embedThumbnail, setEmbedThumbnail] = useState(true);
  const [embedSubtitles, setEmbedSubtitles] = useState(true);
  const [useSponsorBlock, setUseSponsorBlock] = useState(true);
  const [extractAudio, setExtractAudio] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [copiedSyntax, setCopiedSyntax] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const tilt = useTilt3D(8);

  const runAnalyze = async (rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);
    const res = await api.analyzeUrl(url);
    setIsAnalyzing(false);
    if (res.ok) {
      onSelectVideo(res.data);
      setSelectedFormatId(res.data.availableFormats[0]?.formatId || '');
    } else {
      setAnalyzeError(res.error);
    }
  };

  const handleAnalyzeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalyze(urlInput);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData('text');
    if (text) {
      setUrlInput(text);
      runAnalyze(text);
    }
  };

  const activeVideo = currentVideo;
  const selectedFormat = activeVideo?.availableFormats.find(f => f.formatId === selectedFormatId) || activeVideo?.availableFormats[0];

  const estimatedSizeMB = activeVideo && selectedFormat ? (selectedFormat.exactSizeMB ?? calculateEstimatedSizeMB(selectedFormat, activeVideo.durationSeconds, crf)) : 0;
  const estimatedEtaSeconds = calculateETASeconds(estimatedSizeMB, userSpeedMbps);

  const exactCommand = activeVideo && selectedFormat ? generateYtDlpCommand({
    url: activeVideo.url,
    formatId: selectedFormat.formatId,
    crf,
    outputContainer: selectedFormat.ext,
    embedThumbnail,
    embedSubtitles,
    extractAudio,
    useSponsorBlock
  }) : '';

  const getCrfLabel = (val: number) => {
    if (val <= 18) return { label: 'Visually Lossless / Archival Master', color: 'text-purple-400 bg-purple-950/60 border-purple-500/40' };
    if (val <= 21) return { label: 'Pro Quality / High Detail', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40' };
    if (val <= 24) return { label: 'Standard Streaming Quality', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
    if (val <= 28) return { label: 'Fast Mobile / Compressed', color: 'text-yellow-400 bg-yellow-950/60 border-yellow-500/40' };
    return { label: 'Max Compression / Bandwidth Saver', color: 'text-orange-400 bg-orange-950/60 border-orange-500/40' };
  };

  const crfInfo = getCrfLabel(crf);

  return (
    <div className="space-y-8">
      {/* URL Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-900/50 border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="absolute -right-32 -top-32 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        {isDragging && (
          <div className="absolute inset-0 bg-cyan-950/40 border-2 border-dashed border-cyan-400 rounded-3xl flex items-center justify-center backdrop-blur-sm z-10">
            <span className="text-cyan-300 font-black text-xl">Drop URL Here</span>
          </div>
        )}

        <div className="max-w-3xl mx-auto text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-5xl font-black text-white tracking-tight mb-3"
          >
            Paste Any Video Link to Extract & Optimize
          </motion.h1>
          <p className="text-sm sm:text-base text-slate-400">
            Powered by <span className="text-cyan-400 font-mono font-bold">yt-dlp</span> — real metadata, real formats, real downloads to your PC.
          </p>
          {!isElectron && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5" /> Browser preview mode — install the desktop app to actually analyze & download.
            </p>
          )}
        </div>

        <form onSubmit={handleAnalyzeUrl} className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste YouTube, TikTok, X/Twitter, Instagram, Vimeo, Twitch, or any yt-dlp supported link..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#080b11] border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running yt-dlp...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Analyze Link</span>
              </>
            )}
          </button>
        </form>

        {analyzeError && (
          <div className="max-w-3xl mx-auto mt-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{analyzeError}</span>
          </div>
        )}

        <div className="max-w-4xl mx-auto mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 uppercase font-mono mr-1">Try an example:</span>
            {EXAMPLE_URLS.map((ex) => (
              <button
                key={ex.url}
                onClick={() => { setUrlInput(ex.url); runAnalyze(ex.url); }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:text-white"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {!activeVideo || !selectedFormat ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center"
        >
          <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No video analyzed yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">Paste a link above and hit Analyze — real title, thumbnail, duration, and every real format yt-dlp finds will show up here.</p>
        </motion.div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 3D Video Card */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="perspective-1000"
          >
            <div
              ref={tilt.ref}
              onPointerMove={tilt.onPointerMove}
              onPointerLeave={tilt.onPointerLeave}
              className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl card-3d-hover glass-tilt"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black group">
                <img
                  src={activeVideo.thumbnailUrl}
                  alt={activeVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-transparent to-black/40" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500 text-black uppercase tracking-wider shadow-lg">
                    {activeVideo.platform}
                  </span>
                  {activeVideo.viewCount && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md text-slate-200 border border-slate-700">
                      {activeVideo.viewCount}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-xs font-mono font-bold text-cyan-400 border border-cyan-500/30">
                  {formatDuration(activeVideo.durationSeconds)}
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="px-4 py-2 rounded-2xl bg-black/70 backdrop-blur-md text-white text-sm font-bold flex items-center gap-2 border border-white/20">
                    <MonitorPlay className="w-4 h-4" /> Toggle Info
                  </div>
                </button>
              </div>

              <AnimatePresence>
                {showPreview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="aspect-video bg-black flex items-center justify-center">
                      <div className="text-center">
                        <MonitorPlay className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-mono">In-app preview isn't available — the file plays after download</p>
                        <p className="text-[10px] text-slate-600 font-mono mt-1">{selectedFormat.resolution} • {selectedFormat.fps}FPS • {selectedFormat.videoCodec.toUpperCase()}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-white leading-snug">{activeVideo.title}</h2>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    {activeVideo.creatorAvatar ? (
                      <img src={activeVideo.creatorAvatar} alt={activeVideo.creator} className="w-9 h-9 rounded-full border border-cyan-500/50" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-cyan-900/60 flex items-center justify-center font-bold text-cyan-300">
                        {activeVideo.creator.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">{activeVideo.creator}</h4>
                      <p className="text-xs text-slate-500">{activeVideo.uploadDate || 'Online Stream'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2 font-mono">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <Radio className="w-3.5 h-3.5 animate-pulse" /> Connection Speed:
                    </span>
                    <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{userSpeedMbps} Mbps</span>
                  </div>
                  <input
                    type="range" min="10" max="500" step="10"
                    value={userSpeedMbps}
                    onChange={(e) => setUserSpeedMbps(Number(e.target.value))}
                    className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                    <span>10 Mbps (4G LTE)</span>
                    <span>100 Mbps (Broadband)</span>
                    <span>500 Mbps (Fiber 1G)</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 font-mono">Used only to estimate download time below — the real engine downloads as fast as your connection and the source allow.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Format Matrix & CRF Tuner */}
        <div className="lg:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Video Quality & CRF Tuning</h3>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${crfInfo.color}`}>
                CRF {crf}: {crfInfo.label}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-purple-400 font-bold">Ultra Quality (CRF 16)</span>
                <span className="text-emerald-400 font-bold">Standard (CRF 23)</span>
                <span className="text-orange-400 font-bold">Compact (CRF 32)</span>
              </div>
              <input
                type="range" min="16" max="32" step="1"
                value={crf}
                onChange={(e) => setCrf(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 h-3 rounded-lg cursor-pointer shadow-inner"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
              <div className="p-3 rounded-2xl bg-[#06080d] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated Size</span>
                <span className="text-lg font-black text-cyan-400 font-mono">~{estimatedSizeMB} MB</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#06080d] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated ETA</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{formatDuration(estimatedEtaSeconds)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#06080d] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Video Codec</span>
                <span className="text-lg font-black text-purple-400 font-mono uppercase">{selectedFormat.videoCodec}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-400" />
                Available Formats (from real yt-dlp analysis)
              </h3>
              <span className="text-xs text-slate-400 font-mono">Click to select stream</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {activeVideo.availableFormats.map((format) => {
                const isSelected = format.formatId === selectedFormatId;
                const sizeEstimate = format.exactSizeMB ?? calculateEstimatedSizeMB(format, activeVideo.durationSeconds, crf);

                return (
                  <div
                    key={format.formatId}
                    onClick={() => setSelectedFormatId(format.formatId)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border-cyan-500/80 shadow-md shadow-cyan-500/15 scale-[1.01]'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${isSelected ? 'bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50' : 'bg-slate-700'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{format.resolution}</span>
                          {format.fps > 30 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 border border-purple-500/40 text-purple-300 font-mono">
                              {format.fps}FPS
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300 font-mono">
                            {format.ext}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{format.note}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <div className="text-sm font-bold text-cyan-300">~{sizeEstimate} MB</div>
                      <div className="text-[10px] text-slate-400">
                        V: <span className="text-purple-300 font-semibold uppercase">{format.videoCodec}</span> | A: <span className="text-emerald-300 uppercase">{format.audioCodec}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 cursor-pointer hover:bg-slate-800 transition-all">
                <input type="checkbox" checked={embedThumbnail} onChange={(e) => setEmbedThumbnail(e.target.checked)} className="rounded accent-cyan-500 w-4 h-4" />
                <Image className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">Embed Thumb</span>
              </label>
              <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                embedSubtitles
                  ? 'bg-violet-950/60 border-violet-500/50 shadow-sm shadow-violet-500/15'
                  : 'bg-slate-800/50 border-slate-800 hover:bg-slate-800'
              }`}>
                <input type="checkbox" checked={embedSubtitles} onChange={(e) => setEmbedSubtitles(e.target.checked)} className="rounded accent-violet-500 w-4 h-4" />
                <Subtitles className={`w-3.5 h-3.5 ${embedSubtitles ? 'text-violet-300' : 'text-slate-400'}`} />
                <span className={`font-medium ${embedSubtitles ? 'text-violet-200' : 'text-slate-300'}`}>
                  Auto Embed Subs {embedSubtitles ? '✓' : ''}
                </span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 cursor-pointer hover:bg-slate-800 transition-all">
                <input type="checkbox" checked={useSponsorBlock} onChange={(e) => setUseSponsorBlock(e.target.checked)} className="rounded accent-cyan-500 w-4 h-4" />
                <Ban className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">SponsorBlock</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 cursor-pointer hover:bg-slate-800 transition-all">
                <input type="checkbox" checked={extractAudio} onChange={(e) => setExtractAudio(e.target.checked)} className="rounded accent-cyan-500 w-4 h-4" />
                <Volume2 className="w-3.5 h-3.5 text-purple-300" />
                <span className="text-purple-300 font-medium">Extract MP3</span>
              </label>
            </div>

            <button
              onClick={() => onStartDownload({
                video: activeVideo,
                format: selectedFormat,
                crf
              })}
              disabled={!isElectron}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-base tracking-wide shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              <DownloadCloud className="w-6 h-6 text-black" />
              <span>START REAL DOWNLOAD TO PC</span>
              {embedSubtitles && (
                <span className="ml-1 px-2 py-0.5 rounded-lg bg-black/20 text-[10px] font-bold">+ AUTO SUBS</span>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl bg-[#05070a] border border-slate-800 p-4 font-mono shadow-inner"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Equivalent yt-dlp CLI Command:
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exactCommand);
                  setCopiedSyntax(true);
                  setTimeout(() => setCopiedSyntax(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg transition-all"
              >
                {copiedSyntax ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSyntax ? 'Copied syntax!' : 'Copy'}
              </button>
            </div>
            <div className="p-3 rounded-xl bg-[#0a0f18] border border-slate-800/80 text-xs text-slate-300 break-all select-all font-mono leading-relaxed">
              {exactCommand}
            </div>
          </motion.div>
        </div>
      </div>
      )}
    </div>
  );
};

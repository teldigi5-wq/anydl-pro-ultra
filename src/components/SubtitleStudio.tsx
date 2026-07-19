import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Subtitles, Languages, Flame, CheckCircle2, Sparkles,
  FileText, ToggleLeft, ToggleRight, Download, Globe2, Layers
} from 'lucide-react';
import { VideoAnalysisResult } from '../types';
import { detectSubtitlesForPlatform, SubtitleTrack } from '../utils/subtitleEngine';

interface SubtitleStudioProps {
  video: VideoAnalysisResult | null;
  embedSubtitles: boolean;
  setEmbedSubtitles: (v: boolean) => void;
  burnInSubtitles: boolean;
  setBurnInSubtitles: (v: boolean) => void;
  selectedLanguages: string[];
  setSelectedLanguages: (langs: string[]) => void;
}

const ALL_LANGS = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'si', label: 'Sinhala', flag: '🇱🇰' },
  { code: 'ta', label: 'Tamil', flag: '🇱🇰' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'all', label: 'All Available', flag: '🌍' }
];

export const SubtitleStudio: React.FC<SubtitleStudioProps> = ({
  video,
  embedSubtitles,
  setEmbedSubtitles,
  burnInSubtitles,
  setBurnInSubtitles,
  selectedLanguages,
  setSelectedLanguages
}) => {
  const [previewTrack, setPreviewTrack] = useState<SubtitleTrack | null>(null);

  const detectedTracks = useMemo(() => {
    if (!video) return [];
    return detectSubtitlesForPlatform(video.platform, video.subtitlesAvailable);
  }, [video]);

  const toggleLang = (code: string) => {
    if (code === 'all') {
      setSelectedLanguages(['all']);
      return;
    }
    const withoutAll = selectedLanguages.filter(l => l !== 'all');
    if (withoutAll.includes(code)) {
      const next = withoutAll.filter(l => l !== code);
      setSelectedLanguages(next.length ? next : ['en']);
    } else {
      setSelectedLanguages([...withoutAll, code]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900/90 to-slate-900/80 p-6 shadow-2xl space-y-5 relative overflow-hidden"
    >
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-violet-500/15 border border-violet-500/40 shadow-lg shadow-violet-500/20">
            <Subtitles className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Subtitle Studio
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300 uppercase tracking-wider">
                Auto-Embed Fixed
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Auto-download + soft-embed SRT for any site · Multi-language · Burn-in option
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-violet-300"
        >
          <Layers className="w-3.5 h-3.5" />
          {detectedTracks.length} tracks ready
        </motion.div>
      </div>

      {/* Master toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
        <button
          onClick={() => setEmbedSubtitles(!embedSubtitles)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            embedSubtitles
              ? 'bg-violet-950/70 border-violet-500/60 shadow-md shadow-violet-500/15'
              : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-300" /> Soft Embed (Recommended)
            </span>
            {embedSubtitles
              ? <ToggleRight className="w-6 h-6 text-violet-400" />
              : <ToggleLeft className="w-6 h-6 text-slate-500" />}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Writes + converts + embeds SRT tracks into MKV. Toggleable in any modern player.
          </p>
        </button>

        <button
          onClick={() => setBurnInSubtitles(!burnInSubtitles)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            burnInSubtitles
              ? 'bg-orange-950/70 border-orange-500/60 shadow-md shadow-orange-500/15'
              : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-300" /> Hard Burn-In
            </span>
            {burnInSubtitles
              ? <ToggleRight className="w-6 h-6 text-orange-400" />
              : <ToggleLeft className="w-6 h-6 text-slate-500" />}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Permanently burn subtitles into video frames (social media / TVs without sub support).
          </p>
        </button>
      </div>

      {/* Language multi-select */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          Languages to Download & Embed
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_LANGS.map((lang) => {
            const active = selectedLanguages.includes(lang.code) || selectedLanguages.includes('all');
            return (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleLang(lang.code)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {lang.flag} {lang.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detected tracks for current video */}
      {video && (
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
            Detected on {video.platform}: {video.title.slice(0, 40)}...
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {detectedTracks.map((track) => (
              <motion.button
                key={track.id}
                whileHover={{ x: 3 }}
                onClick={() => setPreviewTrack(track)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  previewTrack?.id === track.id
                    ? 'bg-emerald-950/50 border-emerald-500/50'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{track.name}</span>
                  {track.isDefault && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      DEFAULT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                  <span className="text-violet-300">{track.format.toUpperCase()}</span>
                  <span>•</span>
                  <span>{track.source}</span>
                  <span>•</span>
                  <span>{track.sizeKB}KB</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline status */}
      <div className="rounded-2xl bg-[#06080d] border border-slate-800 p-3 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold text-cyan-300 font-mono">Auto-Embed Pipeline (Fixed)</span>
        </div>
        <div className="space-y-1 text-[10px] font-mono text-slate-400">
          {[
            { step: '1. --write-subs + --write-auto-subs', ok: embedSubtitles || burnInSubtitles },
            { step: '2. --sub-langs multi-language fetch', ok: embedSubtitles || burnInSubtitles },
            { step: '3. --convert-subs srt (universal)', ok: embedSubtitles || burnInSubtitles },
            { step: '4. --embed-subs into MKV container', ok: embedSubtitles },
            { step: '5. Optional hard burn-in via ffmpeg', ok: burnInSubtitles }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.ok
                ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                : <div className="w-3 h-3 rounded-full border border-slate-600 shrink-0" />}
              <span className={item.ok ? 'text-emerald-300' : 'text-slate-500'}>{item.step}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {previewTrack && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl bg-slate-800/50 border border-slate-700 p-3 text-[11px] font-mono text-slate-300 relative z-10"
          >
            <div className="flex items-center gap-2 text-violet-300 font-bold mb-1">
              <Download className="w-3.5 h-3.5" /> Preview Track: {previewTrack.name}
            </div>
            <p className="text-slate-400">
              Language: {previewTrack.language} ({previewTrack.languageCode}) · Format: {previewTrack.format.toUpperCase()} · Source: {previewTrack.source}
            </p>
            <p className="text-slate-500 mt-1">
              00:00:01,000 → 00:00:04,500<br />
              [Sample] Welcome — auto-generated captions will appear here when embedded.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

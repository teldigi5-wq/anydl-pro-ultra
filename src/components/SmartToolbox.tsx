import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench, Scissors, Volume2, Image, Clock, Shield,
  Sparkles, FileVideo, Gauge, Wand2, Layers, Check, AlertTriangle
} from 'lucide-react';
import { api, isElectron } from '../lib/api';

export interface SmartToolsState {
  trimEnabled: boolean;
  trimStart: string;
  trimEnd: string;
  audioNormalize: boolean;
  chapterMarkers: boolean;
  watermarkRemove: boolean;
  noiseReduction: boolean;
  upscaleAI: boolean;
  splitByChapters: boolean;
  keepOriginalAudio: boolean;
  multiAudioTracks: boolean;
}

interface SmartToolboxProps {
  tools: SmartToolsState;
  setTools: (t: SmartToolsState) => void;
}

const TOOL_DEFS: Array<{
  key: keyof SmartToolsState;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  type: 'toggle';
}> = [
  {
    key: 'audioNormalize',
    icon: <Volume2 className="w-4 h-4" />,
    title: 'Audio Normalize',
    desc: 'Loudness normalize to -14 LUFS (broadcast standard)',
    color: 'cyan',
    type: 'toggle'
  },
  {
    key: 'chapterMarkers',
    icon: <Layers className="w-4 h-4" />,
    title: 'Chapter Markers',
    desc: 'Auto-embed chapter metadata from description timestamps',
    color: 'purple',
    type: 'toggle'
  },
  {
    key: 'watermarkRemove',
    icon: <Image className="w-4 h-4" />,
    title: 'Watermark Clean',
    desc: 'Not wired to the engine yet — no reliable auto-detection without per-video coordinates. Coming soon.',
    color: 'pink',
    type: 'toggle'
  },
  {
    key: 'noiseReduction',
    icon: <Wand2 className="w-4 h-4" />,
    title: 'Noise Reduction',
    desc: 'AI denoise for wind / hum / background hiss',
    color: 'emerald',
    type: 'toggle'
  },
  {
    key: 'upscaleAI',
    icon: <Sparkles className="w-4 h-4" />,
    title: 'AI Upscale (Real-ESRGAN)',
    desc: 'Real neural upscale after download — needs a real GPU, runs after the file finishes',
    color: 'amber',
    type: 'toggle'
  },
  {
    key: 'splitByChapters',
    icon: <Scissors className="w-4 h-4" />,
    title: 'Split by Chapters',
    desc: 'Real: uses yt-dlp --split-chapters to export each chapter as its own file',
    color: 'blue',
    type: 'toggle'
  },
  {
    key: 'keepOriginalAudio',
    icon: <FileVideo className="w-4 h-4" />,
    title: 'Keep Original Audio',
    desc: 'Preserve source audio track without re-encoding',
    color: 'teal',
    type: 'toggle'
  },
  {
    key: 'multiAudioTracks',
    icon: <Gauge className="w-4 h-4" />,
    title: 'Multi Audio Tracks',
    desc: 'Real: uses yt-dlp --audio-multistreams to embed all available audio tracks',
    color: 'indigo',
    type: 'toggle'
  }
];

export const SmartToolbox: React.FC<SmartToolboxProps> = ({ tools, setTools }) => {
  const [expanded, setExpanded] = useState(true);
  const [gpuChecked, setGpuChecked] = useState(false);
  const [hasCapableGpu, setHasCapableGpu] = useState(true);
  const [gpuNote, setGpuNote] = useState<string | null>(null);
  const activeCount = TOOL_DEFS.filter(t => tools[t.key] === true).length;

  useEffect(() => {
    if (!isElectron) { setGpuChecked(true); return; }
    api.checkGpu().then((res) => {
      if (res) {
        setHasCapableGpu(res.hasCapableGpu);
        setGpuNote(res.note);
      }
      setGpuChecked(true);
    });
  }, []);

  const toggle = (key: keyof SmartToolsState) => {
    if (key === 'upscaleAI' && !hasCapableGpu && !tools.upscaleAI) return; // blocked, no capable GPU
    setTools({ ...tools, [key]: !tools[key] });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl space-y-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
            <Wrench className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Smart Toolbox Pro</h3>
            <p className="text-[11px] text-slate-400">Post-process tools · Audio · Chapters · Cleanup</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono">
            {activeCount} Active
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 rounded-xl text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Trim controls */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-4 space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Smart Trim
          </span>
          <button
            onClick={() => toggle('trimEnabled')}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
              tools.trimEnabled
                ? 'bg-amber-950 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            {tools.trimEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {tools.trimEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 gap-3"
          >
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">Start (HH:MM:SS)</label>
              <input
                type="text"
                value={tools.trimStart}
                onChange={(e) => setTools({ ...tools, trimStart: e.target.value })}
                placeholder="00:00:00"
                className="w-full px-3 py-2 rounded-xl bg-[#080b11] border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">End (HH:MM:SS)</label>
              <input
                type="text"
                value={tools.trimEnd}
                onChange={(e) => setTools({ ...tools, trimEnd: e.target.value })}
                placeholder="00:05:00"
                className="w-full px-3 py-2 rounded-xl bg-[#080b11] border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </motion.div>
        )}
      </div>

      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 relative z-10">
          {TOOL_DEFS.map((tool, i) => {
            const active = Boolean(tools[tool.key]);
            const isUpscale = tool.key === 'upscaleAI';
            const blocked = isUpscale && gpuChecked && !hasCapableGpu;
            return (
              <motion.button
                key={tool.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={blocked ? {} : { y: -3, scale: 1.02 }}
                whileTap={blocked ? {} : { scale: 0.98 }}
                onClick={() => toggle(tool.key)}
                disabled={blocked}
                title={blocked ? gpuNote || 'No capable GPU detected' : undefined}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  blocked
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-50 cursor-not-allowed'
                    : active
                    ? 'bg-cyan-950/50 border-cyan-500/50 shadow-md shadow-cyan-500/10 cursor-pointer'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
              >
                {active && !blocked && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}
                {blocked && (
                  <div className="absolute top-2 right-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                )}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                  active && !blocked ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tool.icon}
                </div>
                <h4 className="text-xs font-bold text-white leading-tight">{tool.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {blocked ? 'No capable GPU detected — disabled. Hover for details.' : tool.desc}
                </p>
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono relative z-10">
        <Shield className="w-3 h-3 text-emerald-500" />
        All tools run locally via yt-dlp + ffmpeg post-processors · No cloud upload
      </div>
    </motion.div>
  );
};

export const DEFAULT_SMART_TOOLS: SmartToolsState = {
  trimEnabled: false,
  trimStart: '00:00:00',
  trimEnd: '00:05:00',
  audioNormalize: true,
  chapterMarkers: true,
  watermarkRemove: false,
  noiseReduction: false,
  upscaleAI: false,
  splitByChapters: false,
  keepOriginalAudio: true,
  multiAudioTracks: false
};

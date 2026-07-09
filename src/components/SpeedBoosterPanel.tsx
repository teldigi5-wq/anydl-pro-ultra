import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Rocket, Gauge, Shield, Settings2 } from 'lucide-react';
import { SpeedProfile } from '../types';

const SPEED_PROFILES: SpeedProfile[] = [
  { name: 'Economy', concurrentFragments: 2, bufferSize: 1024, retries: 3, description: 'Gentle on bandwidth. Single-thread friendly.' },
  { name: 'Standard', concurrentFragments: 4, bufferSize: 2048, retries: 5, description: 'Balanced speed & stability for most connections.' },
  { name: 'Turbo', concurrentFragments: 8, bufferSize: 4096, retries: 8, description: 'Multi-thread burst mode. 8 parallel fragments.' },
  { name: 'Hyper', concurrentFragments: 16, bufferSize: 8192, retries: 12, description: 'Maximum throughput. 16 concurrent connections.' },
  { name: 'Insane', concurrentFragments: 32, bufferSize: 16384, retries: 20, description: 'Unleash full bandwidth. 32 parallel fragments.' },
];

interface SpeedBoosterPanelProps {
  activeProfile: SpeedProfile;
  onSelectProfile: (profile: SpeedProfile) => void;
  customConcurrent: number;
  onCustomConcurrentChange: (v: number) => void;
  customBuffer: number;
  onCustomBufferChange: (v: number) => void;
  customRetries: number;
  onCustomRetriesChange: (v: number) => void;
}

export const SpeedBoosterPanel: React.FC<SpeedBoosterPanelProps> = ({
  activeProfile,
  onSelectProfile,
  customConcurrent,
  onCustomConcurrentChange,
  customBuffer,
  onCustomBufferChange,
  customRetries,
  onCustomRetriesChange
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <Rocket className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Speed Booster Engine</h3>
            <p className="text-[11px] text-slate-400">Concurrent fragment downloads & buffer tuning</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-950 border border-orange-500/40 text-orange-300 font-mono uppercase">
          {activeProfile.name} Mode
        </span>
      </div>

      {/* Profile Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {SPEED_PROFILES.map((profile) => (
          <button
            key={profile.name}
            onClick={() => onSelectProfile(profile)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeProfile.name === profile.name
                ? 'bg-orange-950/60 border-orange-500/60 shadow-md shadow-orange-500/15 scale-[1.02]'
                : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className={`w-3.5 h-3.5 ${activeProfile.name === profile.name ? 'text-orange-400' : 'text-slate-500'}`} />
              <span className={`text-xs font-bold ${activeProfile.name === profile.name ? 'text-orange-300' : 'text-slate-300'}`}>
                {profile.name}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 leading-tight">{profile.concurrentFragments} fragments</p>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {activeProfile.description} Using <span className="text-orange-300 font-mono font-bold">--concurrent-fragments {activeProfile.concurrentFragments}</span> with <span className="text-orange-300 font-mono font-bold">--buffer-size {activeProfile.bufferSize}K</span>.
      </p>

      {/* Custom Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80">
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1"><Gauge className="w-3 h-3" /> Concurrent Fragments</span>
            <span className="text-orange-300 font-bold">{customConcurrent}</span>
          </div>
          <input
            type="range" min="1" max="64" step="1"
            value={customConcurrent}
            onChange={(e) => onCustomConcurrentChange(Number(e.target.value))}
            className="w-full accent-orange-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1"><Settings2 className="w-3 h-3" /> Buffer Size (KB)</span>
            <span className="text-orange-300 font-bold">{customBuffer}K</span>
          </div>
          <input
            type="range" min="512" max="32768" step="512"
            value={customBuffer}
            onChange={(e) => onCustomBufferChange(Number(e.target.value))}
            className="w-full accent-orange-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Retry Attempts</span>
            <span className="text-orange-300 font-bold">{customRetries}</span>
          </div>
          <input
            type="range" min="1" max="50" step="1"
            value={customRetries}
            onChange={(e) => onCustomRetriesChange(Number(e.target.value))}
            className="w-full accent-orange-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </motion.div>
  );
};

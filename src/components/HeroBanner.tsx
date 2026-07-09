import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Subtitles, Globe, Sparkles } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const stats = [
    { icon: <Globe className="w-4 h-4" />, label: 'Any Site', value: 'Unlimited' },
    { icon: <Subtitles className="w-4 h-4" />, label: 'Auto Subs', value: 'Multi-Lang' },
    { icon: <Zap className="w-4 h-4" />, label: 'Fragments', value: 'Up to 32x' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: 'Recovery', value: '99.5%' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl overflow-hidden border border-slate-800/80 mb-8"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-violet-950/80 animate-gradient" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -left-20 top-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-float" />
      <div className="absolute -right-20 bottom-0 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-xl space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3" />
            AnyDL Pro Ultra · Next Level Edition
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl sm:text-4xl font-black tracking-tight"
          >
            <span className="text-gradient-animated">Download Anything.</span>
            <br />
            <span className="text-white">Auto-Subs. AI Agents. Zero Errors.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-slate-300 leading-relaxed"
          >
            Paste any link · Browse sites · Batch queues · Multi-language subtitles auto-embedded ·
            Smart CRF · 32-thread turbo · Windows PC bridge ready.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 pt-1"
          >
            {['Auto Subtitles Fixed', 'Netflix Sniffer', 'Batch Mode', 'AI Agents', 'Ludicrous Speed'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800/80 border border-slate-700 text-slate-300"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-2.5 w-full lg:w-auto">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-700/80 backdrop-blur-md min-w-[130px]"
            >
              <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                {s.icon}
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{s.label}</span>
              </div>
              <p className="text-lg font-black text-white font-mono">{s.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom pulse bar */}
      <div className="relative h-1 bg-slate-800">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};

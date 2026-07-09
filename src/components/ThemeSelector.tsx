import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Sparkles } from 'lucide-react';
import { THEMES, ThemeId, AppTheme } from '../themes/themeSystem';

interface ThemeSelectorProps {
  activeTheme: ThemeId;
  onThemeChange: (id: ThemeId) => void;
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  activeTheme,
  onThemeChange,
  compact = false
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            title={theme.name}
            className={`relative w-8 h-8 rounded-full border-2 shrink-0 transition-all cursor-pointer ${
              activeTheme === theme.id
                ? 'border-white scale-110 shadow-lg'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
            style={{
              background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]})`
            }}
          >
            {activeTheme === theme.id && (
              <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto drop-shadow" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-5 relative overflow-hidden"
      style={{ background: 'var(--bg-card)' }}
    >
      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: 'var(--accent)' }} />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl border"
            style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}>
            <Palette className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              Theme Studio
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)', color: 'var(--accent)' }}>
                {THEMES.length} Themes
              </span>
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              Instant theme switching · Saved for Windows desktop sessions
            </p>
          </div>
        </div>
        <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {THEMES.map((theme: AppTheme, i) => {
          const active = activeTheme === theme.id;
          return (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onThemeChange(theme.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                active ? 'shadow-lg scale-[1.02]' : 'hover:border-slate-600'
              }`}
              style={{
                background: active ? 'color-mix(in srgb, var(--accent) 12%, var(--bg-elevated))' : 'var(--bg-elevated)',
                borderColor: active ? 'var(--accent)' : 'var(--border-color)',
                boxShadow: active ? `0 0 24px var(--accent-glow)` : undefined
              }}
            >
              <div className="flex gap-1 mb-3">
                {theme.preview.map((c, idx) => (
                  <div
                    key={idx}
                    className="h-8 flex-1 first:rounded-l-lg last:rounded-r-lg"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white">{theme.name}</h4>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {theme.description}
                  </p>
                </div>
                {active && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    <Check className="w-3.5 h-3.5 text-black" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'Ctrl + V', action: 'Auto-detect & download from clipboard' },
  { key: 'Ctrl + 1', action: 'Switch to Downloader & CRF Studio' },
  { key: 'Ctrl + 2', action: 'Switch to Built-in Browser' },
  { key: 'Ctrl + 3', action: 'Switch to AI Agents Hub' },
  { key: 'Ctrl + 4', action: 'Switch to Windows PC Bridge' },
  { key: 'Ctrl + D', action: 'Focus URL input field' },
  { key: 'Ctrl + Enter', action: 'Start download with current settings' },
  { key: 'Esc', action: 'Close modals and panels' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-slate-700 shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <Keyboard className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {shortcuts.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <span className="text-sm text-slate-300">{s.action}</span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-slate-700 text-xs font-mono font-bold text-cyan-300 border border-slate-600">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">?</kbd> anywhere to open this modal
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

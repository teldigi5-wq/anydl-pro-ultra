import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ClipboardPaste, Zap, Link, X } from 'lucide-react';

interface QuickActionFabProps {
  onPasteDownload: (url: string) => void;
}

export const QuickActionFab: React.FC<QuickActionFabProps> = ({ onPasteDownload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onPasteDownload(text);
        setIsOpen(false);
        setShowInput(false);
      }
    } catch {
      setShowInput(true);
    }
  };

  const handleSubmit = () => {
    if (pasteUrl.trim()) {
      onPasteDownload(pasteUrl);
      setPasteUrl('');
      setIsOpen(false);
      setShowInput(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <>
            {showInput && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="mb-2"
              >
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl">
                  <input
                    type="text"
                    value={pasteUrl}
                    onChange={(e) => setPasteUrl(e.target.value)}
                    placeholder="Paste URL..."
                    autoFocus
                    className="w-64 px-3 py-2 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                  <button
                    onClick={handleSubmit}
                    className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.05 }}
              onClick={handlePaste}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-purple-500/40 text-purple-300 shadow-xl backdrop-blur-xl hover:bg-purple-950/60 transition-all text-sm font-semibold"
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste from Clipboard
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              onClick={() => { setShowInput(true); }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-cyan-300 shadow-xl backdrop-blur-xl hover:bg-cyan-950/60 transition-all text-sm font-semibold"
            >
              <Link className="w-4 h-4" />
              Type URL Manually
            </motion.button>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => { setIsOpen(!isOpen); setShowInput(false); }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-red-500/90 hover:bg-red-400 text-white rotate-45'
            : 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white'
        }`}
        style={{ boxShadow: isOpen ? '0 0 30px rgba(239, 68, 68, 0.4)' : '0 0 30px rgba(6, 182, 212, 0.4)' }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};

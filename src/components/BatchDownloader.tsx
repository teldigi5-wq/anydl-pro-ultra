import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListPlus, Trash2, Loader2, Link2, CheckCircle2, AlertCircle, Download, Layers } from 'lucide-react';
import { BatchDownloadItem } from '../types';

interface BatchDownloaderProps {
  items: BatchDownloadItem[];
  onAddItems: (urls: string[]) => void;
  onRemoveItem: (id: string) => void;
  onAnalyzeAll: () => void;
  onDownloadAll: () => void;
}

export const BatchDownloader: React.FC<BatchDownloaderProps> = ({
  items,
  onAddItems,
  onRemoveItem,
  onAnalyzeAll,
  onDownloadAll
}) => {
  const [batchInput, setBatchInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleAdd = () => {
    if (!batchInput.trim()) return;
    const urls = batchInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
    onAddItems(urls);
    setBatchInput('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const text = e.dataTransfer.getData('text');
    if (text) {
      const urls = text.split('\n').map(u => u.trim()).filter(u => u.length > 0);
      onAddItems(urls);
    }
  };

  const readyCount = items.filter(i => i.status === 'ready').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Batch / Playlist Downloader</h3>
            <p className="text-[11px] text-slate-400">Paste multiple URLs or drag & drop a playlist</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-950 border border-blue-500/40 text-blue-300 font-mono">
            {readyCount} Ready
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400 font-mono">
            {items.length} Total
          </span>
        </div>
      </div>

      {/* Drag & Drop Input */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-4 transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
        }`}
      >
        <textarea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="Paste multiple URLs here (one per line)...&#10;Or drag & drop a text file with links&#10;Supports YouTube playlists, TikTok collections, etc."
          rows={3}
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono resize-none"
        />
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/50 rounded-2xl backdrop-blur-sm">
            <span className="text-cyan-300 font-bold text-sm">Drop URLs Here</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleAdd}
          disabled={!batchInput.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          <ListPlus className="w-3.5 h-3.5" /> Add to Queue
        </button>
        <button
          onClick={onAnalyzeAll}
          disabled={pendingCount === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer border border-slate-700"
        >
          <Loader2 className="w-3.5 h-3.5" /> Auto-Analyze All
        </button>
        <button
          onClick={onDownloadAll}
          disabled={readyCount === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Download All ({readyCount})
        </button>
      </div>

      {/* Batch Items List */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 max-h-64 overflow-y-auto pr-1"
          >
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-800"
              >
                <div className="shrink-0">
                  {item.status === 'ready' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {item.status === 'analyzing' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                  {item.status === 'pending' && <Link2 className="w-4 h-4 text-slate-500" />}
                  {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 truncate font-mono">{item.url}</p>
                  {item.video && (
                    <p className="text-[10px] text-cyan-400 truncate">{item.video.title}</p>
                  )}
                  {item.error && (
                    <p className="text-[10px] text-red-400">{item.error}</p>
                  )}
                </div>
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  item.status === 'ready' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                  item.status === 'analyzing' ? 'bg-blue-950 text-blue-300 border border-blue-500/30' :
                  item.status === 'error' ? 'bg-red-950 text-red-300 border border-red-500/30' :
                  'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {item.status}
                </span>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-950 text-slate-500 hover:text-red-400 transition-all cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

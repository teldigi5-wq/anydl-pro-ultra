import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadTask } from '../types';
import { formatDuration } from '../utils/qualityEngine';
import {
  Play, Pause, CheckCircle2, Terminal, FolderOpen, Copy, Trash2,
  Zap, Award, ArrowUp, ArrowDown, Gauge, Clock, HardDrive
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DownloadQueueProps {
  tasks: DownloadTask[];
  onRemoveTask: (id: string) => void;
  onTogglePause: (id: string) => void;
  onPriorityChange: (id: string, priority: DownloadTask['priority']) => void;
  onOpenFolder?: (task: DownloadTask) => void;
}

export const DownloadQueue: React.FC<DownloadQueueProps> = ({
  tasks,
  onRemoveTask,
  onTogglePause,
  onPriorityChange,
  onOpenFolder
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.status === filterStatus);

  const downloadingCount = tasks.filter(t => t.status === 'downloading').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalSize = tasks.reduce((sum, t) => sum + t.totalSizeMB, 0);

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-slate-800/80 bg-slate-900/50 p-12 text-center backdrop-blur-md"
      >
        <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-500/10">
          <Zap className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-slate-200">Download Queue is Empty</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Analyze any URL above, use the batch downloader, or browse inside the built-in sniffer to start high-speed autonomous yt-dlp downloads with up to 32 concurrent fragments.
        </p>
      </motion.div>
    );
  }

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];

  const handleCelebrate = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#06b6d4', '#10b981', '#8b5cf6'] });
  };

  const getPriorityColor = (p: DownloadTask['priority']) => {
    switch (p) {
      case 'urgent': return 'text-red-400 bg-red-950 border-red-500/40';
      case 'high': return 'text-orange-400 bg-orange-950 border-orange-500/40';
      case 'normal': return 'text-cyan-400 bg-cyan-950 border-cyan-500/40';
      case 'low': return 'text-slate-400 bg-slate-800 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Queue Stats Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black flex items-center gap-2.5 text-slate-100">
            <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shadow-lg shadow-cyan-400/50" />
            Download Command Center
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {downloadingCount} active • {completedCount} completed • {tasks.length} total • ~{totalSize.toFixed(0)} MB queued
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800">
          {['all', 'downloading', 'completed', 'paused'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-7 space-y-3">
          <AnimatePresence>
            {filteredTasks.map(task => {
              const isCompleted = task.status === 'completed';
              const isDownloading = task.status === 'downloading' || task.status === 'merging';
              const isPaused = task.status === 'paused';
              const isSelected = selectedTask?.id === task.id;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500/70 bg-slate-900/95 shadow-xl shadow-cyan-500/10 scale-[1.01]'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-28 h-[4.5rem] rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 group">
                      <img src={task.thumbnailUrl} alt={task.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/80 text-cyan-300 border border-cyan-500/30 font-mono">
                        {task.resolution}
                      </div>
                      {isCompleted && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-100 truncate">{task.title}</h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            isCompleted ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                            isPaused ? 'bg-yellow-950 text-yellow-300 border border-yellow-500/40' :
                            task.status === 'error' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                            'bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-mono text-slate-400">
                        <span className="text-cyan-400 font-semibold">{task.videoCodec.toUpperCase()}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-purple-400 font-semibold">CRF {task.crf}</span>
                        <span className="text-slate-600">|</span>
                        <span>{task.outputFormat.toUpperCase()}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-orange-300">{task.options.concurrentFragments}x fragments</span>
                        <span className="text-slate-600">|</span>
                        <span>~{task.totalSizeMB} MB</span>
                      </div>

                      {/* Progress */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1 font-mono">
                          <span className="text-slate-300">
                            {task.downloadedMB.toFixed(1)} MB / {task.totalSizeMB} MB
                          </span>
                          {isDownloading && (
                            <span className="text-emerald-400 font-bold flex items-center gap-2">
                              <Gauge className="w-3 h-3" />
                              <span>{task.downloadSpeedMbps} MB/s</span>
                              <span className="text-slate-600">|</span>
                              <Clock className="w-3 h-3" />
                              <span>ETA {formatDuration(task.etaSeconds)}</span>
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready in PC
                            </span>
                          )}
                          {isPaused && (
                            <span className="text-yellow-400 font-bold">Paused</span>
                          )}
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                          <motion.div
                            className={`h-full rounded-full ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : isPaused
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${task.progressPercent}%` }}
                            transition={{ duration: 0.5 }}
                          />
                          {isDownloading && (
                            <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {!isCompleted && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onTogglePause(task.id); }}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title={isDownloading ? 'Pause' : task.status === 'error' ? 'Retry' : 'Resume'}
                        >
                          {isDownloading ? <Pause className="w-4 h-4" /> : <Play className={`w-4 h-4 ${task.status === 'error' ? 'text-amber-400' : 'text-emerald-400'}`} />}
                        </button>
                      )}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onPriorityChange(task.id, 'urgent'); }}
                          className="p-1 rounded-lg hover:bg-red-950 text-slate-500 hover:text-red-400 transition-all"
                          title="Urgent Priority"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onPriorityChange(task.id, 'low'); }}
                          className="p-1 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-all"
                          title="Low Priority"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      {isCompleted && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCelebrate(); }}
                          className="p-2 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-900 transition-all"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveTask(task.id); }}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-950 hover:text-red-400 text-slate-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Terminal Output */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-5 font-mono shadow-2xl h-full flex flex-col sticky top-24">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">
                  Live Engine Terminal
                </span>
                <span className="text-[10px] text-cyan-500 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  {selectedTask?.videoId?.slice(0, 12) || 'Idle'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
            </div>

            <div className="flex-1 min-h-[240px] max-h-[400px] overflow-y-auto space-y-1.5 text-xs text-slate-300 pr-2">
              {selectedTask ? (
                selectedTask.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 select-none shrink-0">&gt;</span>
                    <span className={
                      log.includes('[download]')
                        ? 'text-cyan-300 font-semibold'
                        : log.includes('MERGE') || log.includes('Finished')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('CRF') || log.includes('AV1')
                        ? 'text-purple-300'
                        : log.includes('fragments')
                        ? 'text-orange-300'
                        : 'text-slate-400'
                    }>
                      {log}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-center py-16 text-sm">No active job selected</div>
              )}
            </div>

            {selectedTask && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`yt-dlp -f "${selectedTask.selectedFormatId}" --concurrent-fragments ${selectedTask.options.concurrentFragments} "${selectedTask.url}"`);
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 font-mono transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  {copiedCmd ? 'Copied!' : 'Copy CLI'}
                </button>
                <button
                  onClick={() => { onOpenFolder?.(selectedTask); if (selectedTask.status === 'completed') handleCelebrate(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-900 transition-all"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Open PC Folder
                </button>
                <button
                  onClick={handleCelebrate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
                >
                  <HardDrive className="w-3.5 h-3.5" /> {selectedTask.totalSizeMB} MB
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

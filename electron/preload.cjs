'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('anydl', {
  isElectron: true,
  platform: process.platform,

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),

  // Filesystem / shell
  chooseFolder: () => ipcRenderer.invoke('dialog:chooseFolder'),
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
  showInFolder: (p) => ipcRenderer.invoke('shell:showInFolder', p),

  // Engine
  getEngineInfo: () => ipcRenderer.invoke('engine:info'),
  updateYtDlp: () => ipcRenderer.invoke('engine:updateYtDlp'),
  checkGpu: () => ipcRenderer.invoke('engine:gpuCheck'),

  // Analysis
  analyzeUrl: (url) => ipcRenderer.invoke('video:analyze', url),

  // Downloads
  startDownload: (task) => ipcRenderer.invoke('download:start', task),
  cancelDownload: (id) => ipcRenderer.invoke('download:cancel', id),
  pauseDownload: (id) => ipcRenderer.invoke('download:pause', id),
  resumeDownload: (task) => ipcRenderer.invoke('download:resume', task),
  onDownloadEvent: (cb) => {
    const listener = (_e, evt) => cb(evt);
    ipcRenderer.on('download:event', listener);
    return () => ipcRenderer.removeListener('download:event', listener);
  },

  // System stats
  onSystemStats: (cb) => {
    const listener = (_e, stats) => cb(stats);
    ipcRenderer.on('system:stats', listener);
    return () => ipcRenderer.removeListener('system:stats', listener);
  },

  // Embedded browser + real network sniffer
  getBrowserPartition: () => ipcRenderer.invoke('browser:partition'),
  onMediaDetected: (cb) => {
    const listener = (_e, evt) => cb(evt);
    ipcRenderer.on('browser:media-detected', listener);
    return () => ipcRenderer.removeListener('browser:media-detected', listener);
  },

  // Download history
  getHistory: () => ipcRenderer.invoke('history:get'),
  clearHistory: () => ipcRenderer.invoke('history:clear'),

  // Clipboard auto-watch
  onClipboardUrl: (cb) => {
    const listener = (_e, url) => cb(url);
    ipcRenderer.on('clipboard:url-detected', listener);
    return () => ipcRenderer.removeListener('clipboard:url-detected', listener);
  }
});

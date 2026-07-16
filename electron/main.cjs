'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('./store.cjs');
const engine = require('./engine.cjs');

let mainWindow = null;
let statsInterval = null;
let si = null; // lazy-loaded `systeminformation`

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#080b11',
    title: 'AnyDL Pro Ultra',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  });

  Menu.setApplicationMenu(null);

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

const BROWSER_PARTITION = 'persist:anydl-browser';
const seenMediaUrls = new Set();

const MEDIA_URL_RE = /\.(m3u8|mpd|mp4|webm|mov|m4a|mp3)(\?|#|$)/i;
const MEDIA_HOST_RE = /googlevideo\.com|videoplayback|\/manifest\b|\/hls\b|\/dash\b/i;
const MEDIA_CT_RE = /video\/|audio\/|application\/vnd\.apple\.mpegurl|application\/x-mpegurl|application\/dash\+xml/i;

function guessMediaKind(url, contentType) {
  const ct = (contentType || '').toLowerCase();
  if (/m3u8|mpegurl/i.test(url) || ct.includes('mpegurl')) return 'HLS Manifest (.m3u8)';
  if (/\.mpd/i.test(url) || ct.includes('dash+xml')) return 'DASH Manifest (.mpd)';
  if (/\.mp4/i.test(url) || ct.includes('video/mp4')) return 'MP4 Video';
  if (/\.webm/i.test(url) || ct.includes('video/webm')) return 'WebM Video';
  if (/\.(m4a|mp3)/i.test(url) || ct.startsWith('audio/')) return 'Audio Stream';
  return 'Media Stream';
}

async function applyProxyToSession(ses) {
  const settings = store.getAll();
  try {
    if (settings.proxyEnabled && settings.proxyUrl) {
      await ses.setProxy({ proxyRules: settings.proxyUrl });
    } else {
      await ses.setProxy({ mode: 'direct' });
    }
  } catch (e) {
    console.error('[proxy] failed to apply', e);
  }
}

function setupBrowserNetworkSniffer() {
  const { session } = require('electron');
  const ses = session.fromPartition(BROWSER_PARTITION);
  applyProxyToSession(ses);

  ses.webRequest.onHeadersReceived((details, callback) => {
    try {
      const headers = details.responseHeaders || {};
      const ctKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
      const contentType = ctKey ? headers[ctKey][0] : '';

      const urlMatches = MEDIA_URL_RE.test(details.url) || MEDIA_HOST_RE.test(details.url);
      const ctMatches = MEDIA_CT_RE.test(contentType || '');

      if ((urlMatches || ctMatches) && !seenMediaUrls.has(details.url)) {
        seenMediaUrls.add(details.url);
        if (seenMediaUrls.size > 500) seenMediaUrls.clear(); // basic memory cap for long sessions
        send('browser:media-detected', {
          url: details.url,
          kind: guessMediaKind(details.url, contentType),
          contentType: contentType || null,
          resourceType: details.resourceType,
          timestamp: Date.now()
        });
      }
    } catch { /* never let a sniffing error break the actual page load */ }
    callback({});
  });
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function applyAutoStart(enabled) {
  try {
    app.setLoginItemSettings({
      openAtLogin: !!enabled,
      path: process.execPath
    });
  } catch (e) {
    console.error('[autostart] failed', e);
  }
}

async function ensureDownloadDir() {
  const settings = store.getAll();
  if (!settings.downloadPath) {
    const def = path.join(app.getPath('downloads'), 'AnyDL Pro Ultra');
    store.set('downloadPath', def);
  }
  const dir = store.getAll().downloadPath;
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
  return dir;
}

let clipboardWatchTimer = null;
let lastClipboardText = '';
const URL_DETECT_RE = /^https?:\/\/[^\s]+$/i;

function startClipboardWatch() {
  if (clipboardWatchTimer) return;
  const { clipboard } = require('electron');
  clipboardWatchTimer = setInterval(() => {
    if (!store.getAll().clipboardWatch) return;
    try {
      const text = (clipboard.readText() || '').trim();
      if (text && text !== lastClipboardText && URL_DETECT_RE.test(text)) {
        lastClipboardText = text;
        send('clipboard:url-detected', text);
      } else if (text) {
        lastClipboardText = text;
      }
    } catch { /* clipboard can throw on some platforms/states — ignore */ }
  }, 1500);
}

function startSystemStats() {
  if (statsInterval) return;
  statsInterval = setInterval(async () => {
    try {
      if (!si) si = require('systeminformation');
      const [cpu, mem, net, fsSize, temp] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.networkStats(),
        si.fsSize(),
        si.cpuTemperature()
      ]);
      const primaryNet = net && net[0] ? net[0] : { rx_sec: 0, tx_sec: 0 };
      const networkSpeedMBps = ((primaryNet.rx_sec || 0) + (primaryNet.tx_sec || 0)) / (1024 * 1024);
      const diskFree = Array.isArray(fsSize)
        ? fsSize.reduce((sum, d) => sum + (d.size - d.used), 0) / (1024 ** 3)
        : 0;
      send('system:stats', {
        cpuUsage: Math.round(cpu.currentLoad || 0),
        ramUsage: Math.round((mem.active / mem.total) * 100),
        ramUsedGB: Number((mem.active / (1024 ** 3)).toFixed(1)),
        ramTotalGB: Number((mem.total / (1024 ** 3)).toFixed(1)),
        networkSpeed: Number(networkSpeedMBps.toFixed(2)),
        activeConnections: engine.isActive ? undefined : 0,
        diskSpaceGB: Math.round(diskFree),
        temperature: temp && typeof temp.main === 'number' && temp.main > 0 ? Math.round(temp.main) : 0
      });
    } catch (e) {
      // systeminformation can fail in sandboxed/VM environments — fail silently per tick.
    }
  }, 2000);
}

app.whenReady().then(async () => {
  await ensureDownloadDir();
  applyAutoStart(store.getAll().autoStart);
  createWindow();
  startSystemStats();
  setupBrowserNetworkSniffer();
  startClipboardWatch();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (statsInterval) clearInterval(statsInterval);
  if (clipboardWatchTimer) clearInterval(clipboardWatchTimer);
  if (process.platform !== 'darwin') app.quit();
});

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------
ipcMain.handle('settings:getAll', () => store.getAll());
ipcMain.handle('settings:set', (_e, key, value) => {
  const data = store.set(key, value);
  if (key === 'autoStart') applyAutoStart(value);
  if (key === 'proxyEnabled' || key === 'proxyUrl') {
    const { session } = require('electron');
    applyProxyToSession(session.fromPartition(BROWSER_PARTITION));
  }
  return data;
});

ipcMain.handle('dialog:chooseFolder', async () => {
  const res = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] });
  if (res.canceled || !res.filePaths.length) return null;
  store.set('downloadPath', res.filePaths[0]);
  return res.filePaths[0];
});

ipcMain.handle('shell:openPath', async (_e, targetPath) => {
  if (!targetPath) return false;
  const err = await shell.openPath(targetPath);
  return !err;
});
ipcMain.handle('shell:showInFolder', (_e, targetPath) => {
  if (!targetPath || !fs.existsSync(targetPath)) return false;
  shell.showItemInFolder(targetPath);
  return true;
});

ipcMain.handle('engine:info', () => engine.getEngineInfo(store.getAll()));
ipcMain.handle('engine:updateYtDlp', () => engine.updateYtDlp(store.getAll()));
ipcMain.handle('engine:gpuCheck', () => engine.checkGpuCapability());

ipcMain.handle('video:analyze', async (_e, url) => {
  try {
    const result = await engine.analyzeUrl(url, store.getAll());
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: e.message || 'Analysis failed' };
  }
});

function makeDownloadEventHandler(task, settings) {
  return (evt) => {
    send('download:event', evt);
    if (evt.type === 'complete' && evt.filePath && task.smartTools?.upscaleAI) {
      engine.runUpscale(task.id, evt.filePath, settings, (uEvt) => send('download:event', uEvt));
    }
    if (evt.type === 'complete') {
      store.addHistoryEntry({
        id: task.id,
        title: task.title || task.url,
        url: task.url,
        filePath: evt.filePath || null,
        resolution: task.resolution || null,
        completedAt: Date.now()
      });
    }
  };
}

ipcMain.handle('history:get', () => store.getHistory());
ipcMain.handle('history:clear', () => store.clearHistory());

ipcMain.handle('download:start', async (_e, task) => {
  const settings = store.getAll();
  const outputDir = settings.downloadPath || await ensureDownloadDir();
  const id = task.id;
  const proxyUrl = settings.proxyEnabled && settings.proxyUrl ? settings.proxyUrl : undefined;
  engine.startDownload(id, { ...task, outputDir, proxyUrl }, settings, makeDownloadEventHandler(task, settings));
  return { ok: true, id };
});

ipcMain.handle('download:cancel', (_e, id) => ({ ok: engine.cancelDownload(id) }));
ipcMain.handle('download:pause', (_e, id) => ({ ok: engine.pauseDownload(id) }));
ipcMain.handle('download:resume', async (_e, task) => {
  const settings = store.getAll();
  const outputDir = settings.downloadPath || await ensureDownloadDir();
  const proxyUrl = settings.proxyEnabled && settings.proxyUrl ? settings.proxyUrl : undefined;
  engine.startDownload(task.id, { ...task, outputDir, proxyUrl }, settings, makeDownloadEventHandler(task, settings));
  return { ok: true };
});

ipcMain.handle('app:platform', () => process.platform);
ipcMain.handle('browser:partition', () => BROWSER_PARTITION);
ipcMain.handle('browser:preload-path', () => `file://${path.join(__dirname, 'webview-preload.cjs')}`);

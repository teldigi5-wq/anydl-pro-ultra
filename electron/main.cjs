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
      sandbox: false
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (statsInterval) clearInterval(statsInterval);
  if (process.platform !== 'darwin') app.quit();
});

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------
ipcMain.handle('settings:getAll', () => store.getAll());
ipcMain.handle('settings:set', (_e, key, value) => {
  const data = store.set(key, value);
  if (key === 'autoStart') applyAutoStart(value);
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

ipcMain.handle('video:analyze', async (_e, url) => {
  try {
    const result = await engine.analyzeUrl(url, store.getAll());
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: e.message || 'Analysis failed' };
  }
});

ipcMain.handle('download:start', async (_e, task) => {
  const settings = store.getAll();
  const outputDir = settings.downloadPath || await ensureDownloadDir();
  const id = task.id;
  engine.startDownload(id, { ...task, outputDir }, settings, (evt) => {
    send('download:event', evt);
  });
  return { ok: true, id };
});

ipcMain.handle('download:cancel', (_e, id) => ({ ok: engine.cancelDownload(id) }));
ipcMain.handle('download:pause', (_e, id) => ({ ok: engine.pauseDownload(id) }));
ipcMain.handle('download:resume', async (_e, task) => {
  const settings = store.getAll();
  const outputDir = settings.downloadPath || await ensureDownloadDir();
  engine.startDownload(task.id, { ...task, outputDir }, settings, (evt) => send('download:event', evt));
  return { ok: true };
});

ipcMain.handle('app:platform', () => process.platform);

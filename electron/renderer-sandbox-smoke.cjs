'use strict';
// An isolated, offline Electron renderer/preload test. Does not contact services,
// create sessions, or alter the app's real user data.
const assert = require('node:assert/strict');
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

let timer;
let finished = false;
function stop(error) {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  if (error) console.error('Sandboxed preload smoke failed:', error);
  else console.log('Sandboxed AnyDL renderer/preload smoke passed');
  app.exit(error ? 1 : 0);
}

timer = setTimeout(() => stop(new Error('Electron renderer did not initialize in 30 seconds')), 30000);
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });
  win.webContents.on('render-process-gone', (_event, info) =>
    stop(new Error('Renderer exited: ' + info.reason)));
  win.webContents.on('did-fail-load', (_e, code, description) =>
    stop(new Error('Renderer failed to load: ' + code + ' ' + description)));
  await win.loadURL('data:text/html;charset=utf-8,%3Chtml%3E%3Cbody%3EAnyDL%20sandbox%20smoke%3C%2Fbody%3E%3C%2Fhtml%3E');
  const x = await win.webContents.executeJavaScript(`({
    bridge: typeof window.anydl,
    exposed: !!window.anydl?.isElectron,
    getSettings: typeof window.anydl?.getSettings,
    startDownload: typeof window.anydl?.startDownload,
    unrestrictedRequire: typeof window.require,
    unrestrictedProcess: typeof window.process
  })`);
  assert.deepEqual(x, {
    bridge: 'object',
    exposed: true,
    getSettings: 'function',
    startDownload: 'function',
    unrestrictedRequire: 'undefined',
    unrestrictedProcess: 'undefined'
  });
  stop();
}).catch(stop);

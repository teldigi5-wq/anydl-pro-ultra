'use strict';
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULTS = {
  downloadPath: '',
  notifications: true,
  autoStart: true,
  maxConcurrent: 3,
  theme: 'cyber-dark',
  embedSubtitles: true,
  selectedSubLanguages: ['en'],
  speedProfile: 'Turbo',
  customConcurrent: 8,
  customBuffer: 4096,
  customRetries: 8,
  smartTools: {
    trimEnabled: false,
    trimStart: '00:00:00',
    trimEnd: '00:00:00',
    audioNormalize: false,
    chapterMarkers: true,
    watermarkRemove: false,
    noiseReduction: false,
    upscaleAI: false,
    splitByChapters: false,
    keepOriginalAudio: false,
    multiAudioTracks: false
  },
  useSystemYtDlp: false,
  clipboardWatch: false,
  globalLimitRateKBps: 0,
  proxyEnabled: false,
  proxyUrl: '',
  useAria2: true,
  anthropicApiKey: '',
  aiProvider: 'groq',
  groqApiKey: '',
  disableHardwareAcceleration: false
};

function filePath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function load() {
  try {
    const raw = fs.readFileSync(filePath(), 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS, downloadPath: path.join(app.getPath('downloads'), 'AnyDL Pro Ultra') };
  }
}

let cache = null;

function getAll() {
  if (!cache) cache = load();
  return cache;
}

function set(key, value) {
  const data = getAll();
  data[key] = value;
  cache = data;
  try {
    fs.mkdirSync(path.dirname(filePath()), { recursive: true });
    fs.writeFileSync(filePath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[store] failed to persist settings', e);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Download history — a separate small JSON file so it doesn't bloat/slow
// down every settings write. Survives app restarts.
// ---------------------------------------------------------------------------
function historyFilePath() {
  return path.join(app.getPath('userData'), 'history.json');
}

function getHistory() {
  try {
    return JSON.parse(fs.readFileSync(historyFilePath(), 'utf-8'));
  } catch {
    return [];
  }
}

function addHistoryEntry(entry) {
  const history = getHistory();
  history.unshift(entry);
  const capped = history.slice(0, 200);
  try {
    fs.mkdirSync(path.dirname(historyFilePath()), { recursive: true });
    fs.writeFileSync(historyFilePath(), JSON.stringify(capped, null, 2), 'utf-8');
  } catch (e) {
    console.error('[store] failed to persist history', e);
  }
  return capped;
}

function clearHistory() {
  try { fs.writeFileSync(historyFilePath(), '[]', 'utf-8'); } catch { /* ignore */ }
  return [];
}

module.exports = { getAll, set, DEFAULTS, getHistory, addHistoryEntry, clearHistory };

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
  selectedSubLanguages: ['en', 'all'],
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
  useSystemYtDlp: false
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

module.exports = { getAll, set, DEFAULTS };

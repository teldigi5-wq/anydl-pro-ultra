'use strict';
const fs = require('fs');
const path = require('path');
const { app, safeStorage } = require('electron');

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
  openrouterApiKey: '',
  disableHardwareAcceleration: false
};

function filePath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

// API keys never belong in the renderer or plaintext settings.json.
const SECRET_KEYS = Object.freeze(['anthropicApiKey', 'groqApiKey', 'openrouterApiKey']);
function secureStorageAvailable() {
  try {
    return Boolean(safeStorage?.isEncryptionAvailable?.()) &&
      safeStorage?.getSelectedStorageBackend?.() !== 'basic_text';
  } catch { return false; }
}

function saveSettings(data) {
  const disk = { ...data };
  const encrypted = { ...(data._protectedKeys || {}) };
  for (const key of SECRET_KEYS) {
    const value = typeof data[key] === 'string' ? data[key] : '';
    if (value && secureStorageAvailable()) {
      encrypted[key] = safeStorage.encryptString(value).toString('base64');
    }
    // When the OS key service is absent, secrets stay usable only in memory.
    // Old plaintext secrets are removed on the first load/set, never re-saved.
    delete disk[key];
  }
  disk._protectedKeys = encrypted;
  fs.mkdirSync(path.dirname(filePath()), { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(disk, null, 2), { encoding: 'utf8', mode: 0o600 });
}

function load() {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath(), 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error('Invalid settings object');
  } catch {
    return { ...DEFAULTS, _protectedKeys: {}, downloadPath: path.join(app.getPath('downloads'), 'AnyDL Pro Ultra') };
  }
  const data = { ...DEFAULTS, ...parsed };
  data._protectedKeys = parsed._protectedKeys && typeof parsed._protectedKeys === 'object'
    && !Array.isArray(parsed._protectedKeys) ? { ...parsed._protectedKeys } : {};
  let plaintextPresent = false;
  for (const key of SECRET_KEYS) {
    const legacy = typeof parsed[key] === 'string' ? parsed[key] : '';
    plaintextPresent ||= Object.prototype.hasOwnProperty.call(parsed, key);
    if (legacy) { data[key] = legacy; continue; }
    data[key] = '';
    const ciphertext = data._protectedKeys[key];
    if (typeof ciphertext === 'string' && secureStorageAvailable()) {
      try { data[key] = safeStorage.decryptString(Buffer.from(ciphertext, 'base64')); }
      catch { console.error('[store] Unable to decrypt a saved AI key; it was not sent to the renderer.'); }
    }
  }
  if (plaintextPresent) {
    // main.cjs reads settings before app.whenReady() for GPU settings. Never
    // destroy persisted legacy secrets while the OS key service is still booting.
    if (typeof app.isReady === 'function' && !app.isReady()) {
      needsMigration = true;
    } else {
      try { saveSettings(data); }
      catch { console.error('[store] Failed to migrate plaintext secrets from settings.json'); }
    }
  }
  return data;
}

let cache = null;
let needsMigration = false;
function ensureMigration() {
  getAll();
  if (!needsMigration) return;
  try { saveSettings(cache); needsMigration = false; }
  catch { console.error('[store] Deferred secure-key migration failed'); }
}

function getAll() {
  if (!cache) cache = load();
  return cache; // Main process only: AI calls need the decrypted value.
}

function getPublic() {
  const data = getAll();
  const safe = { ...data };
  delete safe._protectedKeys;
  for (const key of SECRET_KEYS) {
    safe[key + 'Configured'] = Boolean(data[key]);
    safe[key] = ''; // Never return a saved key to an untrusted renderer.
  }
  return safe;
}

function set(key, value) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) return getPublic();
  const data = getAll();
  if (SECRET_KEYS.includes(key)) {
    if (typeof value !== 'string' || value.length > 4096) return getPublic();
    // Clearing/replacing a key must remove obsolete encrypted state.
    delete data._protectedKeys[key];
  }
  data[key] = value;
  cache = data;
  try { saveSettings(data); }
  catch (e) { console.error('[store] Failed to persist settings', e?.name || 'write_error'); }
  return getPublic();
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

module.exports = { getAll, getPublic, set, ensureMigration, DEFAULTS, getHistory, addHistoryEntry, clearHistory, secureStorageAvailable };

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, 'store.cjs'), 'utf8');
function createStore({ stored = null, encryption = true, backend = 'dpapi', ready = true } = {}) {
  let disk = stored;
  let appReady = ready;
  const fakeStorage = {
    isEncryptionAvailable: () => encryption,
    getSelectedStorageBackend: () => backend,
    encryptString: value => Buffer.from('encrypted:' + value),
    decryptString: encoded => {
      const plain = encoded.toString('utf8');
      if (!plain.startsWith('encrypted:')) throw Error('Bad ciphertext');
      return plain.slice('encrypted:'.length);
    },
  };
  const fakeFs = {
    readFileSync() { if (disk === null) throw Error('Missing file'); return disk; },
    writeFileSync(_file, value) { disk = value; },
    mkdirSync() {},
  };
  const module = { exports: {} };
  vm.runInNewContext(source, {
    require: name => name === 'fs' ? fakeFs : name === 'path' ? path
      : name === 'electron' ? { app: { getPath: () => '/tmp/anydl-security-fixture', isReady: () => appReady }, safeStorage: fakeStorage }
      : require(name),
    module, Buffer, console
  }, { filename: 'electron/store.cjs' });
  return { store: module.exports, saved: () => disk, setReady: value => { appReady = value; } };
}
test('API keys are encrypted at rest and not returned to renderer settings', () => {
  const e = createStore();
  e.store.set('groqApiKey', 'synthetic-never-a-real-secret-123');
  assert.ok(!e.saved().includes('synthetic-never-a-real-secret-123'));
  assert.ok(!e.saved().includes('"groqApiKey": "synthetic'));
  assert.equal(e.store.getAll().groqApiKey, 'synthetic-never-a-real-secret-123');
  assert.equal(e.store.getPublic().groqApiKey, '');
  assert.equal(e.store.getPublic().groqApiKeyConfigured, true);
  assert.ok(!JSON.stringify(e.store.getPublic()).includes('synthetic-never-a-real-secret-123'));
  const reopened = createStore({stored:e.saved()});
  assert.equal(reopened.store.getAll().groqApiKey, 'synthetic-never-a-real-secret-123');
});
test('legacy plaintext key migrates and is erased from settings.json', () => {
  const seed = JSON.stringify({ groqApiKey:'old-local-synthetic-key',theme:'dark' });
  const e = createStore({stored:seed});
  assert.equal(e.store.getAll().groqApiKey,'old-local-synthetic-key');
  assert.ok(!e.saved().includes('old-local-synthetic-key'));
  assert.equal(e.store.getPublic().theme,'dark');
});
test('no OS key store means keys are kept for session only, not saved plaintext', () => {
  const e = createStore({encryption:false,backend:'basic_text'});
  e.store.set('openrouterApiKey','local-test-only-value');
  assert.equal(e.store.getAll().openrouterApiKey,'local-test-only-value');
  assert.ok(!e.saved().includes('local-test-only-value'));
  const restored = createStore({stored:e.saved(),encryption:false,backend:'basic_text'});
  assert.equal(restored.store.getPublic().openrouterApiKeyConfigured,false);
});
test('clearing key also clears encrypted persisted data', () => {
  const e = createStore();
  e.store.set('anthropicApiKey', 'temporary-synthetic-key');
  e.store.set('anthropicApiKey', '');
  assert.equal(e.store.getPublic().anthropicApiKeyConfigured,false);
  assert.ok(!e.saved().includes('temporary-synthetic-key'));
  assert.ok(!e.saved().includes('anthropicApiKey'));
});
test('arbitrary settings keys cannot overwrite encrypted fields', () => {
  const e = createStore();
  e.store.set('_protectedKeys', {groqApiKey:'forged'});
  assert.equal(e.store.getPublic().groqApiKeyConfigured,false);
});

test('early GPU settings read never deletes legacy secrets before OS vault readiness', () => {
  const seed = JSON.stringify({ groqApiKey: 'startup-legacy-synthetic-key' });
  const e = createStore({stored:seed, ready:false});
  assert.equal(e.store.getAll().groqApiKey, 'startup-legacy-synthetic-key');
  assert.equal(e.saved(), seed, 'defer disk rewrite until Electron is ready');
  e.setReady(true);
  e.store.ensureMigration();
  assert.ok(!e.saved().includes('startup-legacy-synthetic-key'));
  const restored = createStore({stored:e.saved()});
  assert.equal(restored.store.getAll().groqApiKey, 'startup-legacy-synthetic-key');
});

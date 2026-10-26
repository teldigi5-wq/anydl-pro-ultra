'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../package.json');
const lock = require('../package-lock.json');

test('Electron certificate mitigation release is pinned for reproducible Windows builds', () => {
  assert.equal(manifest.devDependencies.electron, '44.9.1');
  assert.equal(lock.packages[''].devDependencies.electron, '44.9.1');
  assert.equal(lock.packages['node_modules/electron'].version, '44.9.1');
  assert.equal(lock.packages['node_modules/electron-builder'].version, '26.18.0');
  assert.equal(lock.packages['node_modules/vite'].version, '7.3.7');
  assert.match(lock.packages['node_modules/electron'].integrity, /^sha512-/);
  assert.equal(lock.packages['node_modules/@electron/get'].version, '5.0.0');
  assert.ok(lock.packages['node_modules/@electron-internal/extract-zip']);
  assert.equal(lock.packages['node_modules/electron/node_modules/@types/node'].version.startsWith('24.'), true);
  assert.equal(manifest.engines.node, '>=22.12.0');
});

const fs = require('node:fs');
const path = require('node:path');

test('main renderer uses OS sandbox and isolated, Node-free preload', () => {
  const main = fs.readFileSync(path.join(__dirname, 'main.cjs'), 'utf8');
  const preload = fs.readFileSync(path.join(__dirname, 'preload.cjs'), 'utf8');
  const windowBlock = main.match(/function createWindow\(\)\s*\{[\s\S]*?new BrowserWindow\(\{([\s\S]*?)\}\);/);
  assert.ok(windowBlock, 'main window construction must remain verifiable');
  assert.match(windowBlock[1], /sandbox:\s*true\b/);
  assert.match(windowBlock[1], /contextIsolation:\s*true\b/);
  assert.match(windowBlock[1], /nodeIntegration:\s*false\b/);
  assert.doesNotMatch(windowBlock[1], /webSecurity:\s*false\b/);
  const imports = [...preload.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)].map(x => x[1]);
  assert.deepEqual(imports, ['electron'], 'sandboxed preload must not depend on unrestricted Node imports');
  assert.match(preload, /contextBridge\.exposeInMainWorld/);
});

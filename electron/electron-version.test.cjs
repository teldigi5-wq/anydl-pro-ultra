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

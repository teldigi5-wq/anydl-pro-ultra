'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lock = require('../security/windows-binary-lock.json');
const input = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'fetch-bin.cjs'), 'utf8');
const expected = ['ytDlp', 'ffmpeg', 'realEsrgan', 'aria2'];

test('all bundled Windows executables require immutable versioned, SHA-256-pinned release inputs', () => {
  for (const key of expected) {
    const asset = lock[key];
    assert.ok(asset, key + ' must be explicitly locked');
    const u = new URL(asset.url);
    assert.equal(u.protocol, 'https:', key);
    assert.equal(u.hostname, 'github.com', key);
    assert.match(u.pathname, /^\/[^/]+\/[^/]+\/releases\/download\/[^/]+\/[^/]+$/i, key);
    assert.doesNotMatch(u.pathname, /\/latest\//i, key);
    assert.match(asset.sha256, /^[a-f0-9]{64}$/, key);
  }
  assert.equal(new Set(expected.map(key => lock[key].url)).size, expected.length);
});

test('hash validation precedes extraction or use of every downloaded binary', () => {
  for (const [key, assetCall] of [
    ['ytDlp', 'downloadVerified(binaryLock.ytDlp'],
    ['ffmpeg', 'downloadVerified(binaryLock.ffmpeg'],
    ['realEsrgan', 'downloadVerified(binaryLock.realEsrgan'],
    ['aria2', 'downloadVerified(binaryLock.aria2']
  ]) assert.ok(input.includes(assetCall), key + ' must use downloadVerified');
  assert.match(input, /SHA-256 mismatch/);
  assert.match(input, /Refusing non-HTTPS binary download or redirect/);
  assert.match(input, /MAX_DOWNLOAD_BYTES/);
  assert.match(input, /pipeline\(res, limit/);
});

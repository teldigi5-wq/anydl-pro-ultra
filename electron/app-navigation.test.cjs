'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isLocalDevUrl, isTrustedMainNavigation, allowedExternalBrowserLink } = require('./app-navigation.cjs');
const { pathToFileURL } = require('node:url');
const html = '/tmp/AnyDL Test/dist/index.html';
test('packaged app only allows its own local UI file', () => {
  const home = pathToFileURL(html).toString();
  assert.equal(isTrustedMainNavigation(home, html), true);
  assert.equal(isTrustedMainNavigation(home + '#settings', html), true);
  assert.equal(isTrustedMainNavigation('https://example.com/', html), false);
  assert.equal(isTrustedMainNavigation('file:///etc/passwd', html), false);
  assert.equal(isTrustedMainNavigation('javascript:alert(1)', html), false);
});
test('dev server must be explicitly local, not a remote origin', () => {
  assert.equal(isLocalDevUrl('http://127.0.0.1:5173/'), true);
  assert.equal(isLocalDevUrl('http://localhost:5173/'), true);
  for (const value of ['http://evil.example:5173/', 'https://localhost:5173/', 'http://localhost.evil:5173/', 'http://user:secret@localhost:5173/', 'file:///tmp/index.html', 'http://localhost:80/']) {
    assert.equal(isLocalDevUrl(value), false, value);
  }
  assert.equal(isTrustedMainNavigation('http://localhost:5173/settings', html, 'http://localhost:5173/'), true);
  assert.equal(isTrustedMainNavigation('http://evil.example:5173/', html, 'http://localhost:5173/'), false);
});
test('opening system browser excludes privileged and loopback schemes', () => {
  assert.equal(allowedExternalBrowserLink('https://example.org/docs'), true);
  for (const u of ['file:///etc/passwd', 'javascript:alert(1)', 'vscode://settings', 'http://127.0.0.1:8000/private', 'http://localhost:8000', 'http://u:p@example.com', 'data:text/plain,secret']) {
    assert.equal(allowedExternalBrowserLink(u), false, u);
  }
});

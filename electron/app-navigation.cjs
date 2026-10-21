'use strict';
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

function isLocalDevUrl(raw) {
  try {
    const u = new URL(String(raw));
    const port = Number(u.port);
    return u.protocol === 'http:' && LOOPBACK.has(u.hostname)
      && Number.isInteger(port) && port >= 1024 && port <= 65535
      && !u.username && !u.password && u.pathname === '/'
      && !u.search && !u.hash;
  } catch { return false; }
}

function isTrustedMainNavigation(raw, productionHtmlPath, devServerUrl = null) {
  try {
    const target = new URL(String(raw));
    if (devServerUrl && isLocalDevUrl(devServerUrl)) {
      const approved = new URL(devServerUrl);
      return target.origin === approved.origin && !target.username && !target.password;
    }
    if (target.protocol !== 'file:' || target.username || target.password) return false;
    return path.resolve(fileURLToPath(target)) === path.resolve(productionHtmlPath);
  } catch { return false; }
}

function allowedExternalBrowserLink(raw) {
  try {
    const u = new URL(String(raw));
    return (u.protocol === 'https:' || u.protocol === 'http:') &&
      !u.username && !u.password && !LOOPBACK.has(u.hostname);
  } catch { return false; }
}

module.exports = { isLocalDevUrl, isTrustedMainNavigation, allowedExternalBrowserLink };

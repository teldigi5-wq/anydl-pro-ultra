'use strict';
const path = require('node:path');
const { fileURLToPath } = require('node:url');

function normalizedLocalPath(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    if (raw.startsWith('file:')) return path.resolve(fileURLToPath(raw));
    return path.resolve(raw);
  } catch { return null; }
}
function acceptedGuestUrl(raw) {
  try {
    const u = new URL(String(raw || ''));
    return (u.protocol === 'https:' || u.protocol === 'http:') &&
      Boolean(u.hostname) && !u.username && !u.password;
  } catch { return false; }
}
// Bound privileged embed setup in main process; the renderer's <webview>
// attributes are request input and must not choose a preload or partition.
function authorizeWebviewAttach(webPreferences, params, trustedPreload, partition) {
  if (!webPreferences || !params ||
      params.partition !== partition ||
      !acceptedGuestUrl(params.src)) return false;
  const expected = path.resolve(trustedPreload);
  for (const candidate of [params.preload, webPreferences.preload]) {
    if (candidate !== undefined && candidate !== null && candidate !== '') {
      if (normalizedLocalPath(candidate) !== expected) return false;
    }
  }
  // Electron guest process is untrusted website content.
  webPreferences.nodeIntegration = false;
  webPreferences.contextIsolation = true;
  webPreferences.sandbox = true;
  webPreferences.webSecurity = true;
  return true;
}
module.exports = { authorizeWebviewAttach, acceptedGuestUrl };

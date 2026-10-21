'use strict';

// Deny IPC from embedded remote websites (webviews), child frames, and
// destroyed/replaced windows; privileged APIs belong to the app's top frame.
function trustedRenderer(event, window) {
  if (!window || window.isDestroyed?.() || !window.webContents || !event) return false;
  return event.sender === window.webContents &&
    event.senderFrame === window.webContents.mainFrame;
}
module.exports = { trustedRenderer };

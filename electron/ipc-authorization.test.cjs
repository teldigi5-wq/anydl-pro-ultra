'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { trustedRenderer } = require('./ipc-authorization.cjs');
const frame = { id: 'app-frame' };
const webContents = { id: 1, mainFrame: frame };
const win = { webContents, isDestroyed: () => false };
test('app main frame can invoke IPC', () => {
  assert.equal(trustedRenderer({sender:webContents,senderFrame:frame}, win), true);
});
test('embedded webview and injected subframes cannot invoke IPC', () => {
  assert.equal(trustedRenderer({sender:{id:2},senderFrame:frame}, win), false);
  assert.equal(trustedRenderer({sender:webContents,senderFrame:{id:'child-frame'}}, win), false);
  assert.equal(trustedRenderer(null,win),false);
});
test('destroyed or detached app window blocks IPC', () => {
  assert.equal(trustedRenderer({sender:webContents,senderFrame:frame}, null),false);
  assert.equal(trustedRenderer({sender:webContents,senderFrame:frame},{...win,isDestroyed:()=>true}),false);
});

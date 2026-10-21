'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { authorizeWebviewAttach, acceptedGuestUrl } = require('./webview-policy.cjs');
const expected = path.join(__dirname,'webview-preload.cjs');
const partition = 'persist:anydl-browser';
const attach = (overrides = {}, prefs = {}) => {
  const settings = {nodeIntegration:true,contextIsolation:false,sandbox:false,webSecurity:false,...prefs};
  const params = {src:'https://www.youtube.com/',partition,preload:pathToFileURL(expected).href,...overrides};
  return {allowed:authorizeWebviewAttach(settings,params,expected,partition),settings};
};
test('approved media guest keeps required browser functionality but has no node access',()=>{
  const {allowed,settings}=attach();
  assert.equal(allowed,true);
  assert.deepEqual(
    [settings.nodeIntegration,settings.contextIsolation,settings.sandbox,settings.webSecurity],
    [false,true,true,true]);
});
test('webview may initialize before optional preload becomes available',()=>{
  assert.equal(attach({preload:undefined}).allowed,true);
});
test('unauthorized partitions and alternative preloads are rejected',()=>{
  assert.equal(attach({partition:'persist:stolen'}).allowed,false);
  assert.equal(attach({preload:pathToFileURL(path.join(__dirname,'main.cjs')).href}).allowed,false);
  assert.equal(attach({}, {preload:'/tmp/evil.cjs'}).allowed,false);
  assert.equal(attach({preload:'file:///%%%%'}).allowed,false);
});
test('non-web or credentialed guest source URLs are blocked',()=>{
  for(const src of ['file:///etc/passwd','javascript:alert(1)','data:text/html,hello',
    'https://user:pass@example.com','about:blank','']) {
    assert.equal(attach({src}).allowed,false,src);
  }
  assert.equal(acceptedGuestUrl('http://example.com/video'),true);
});

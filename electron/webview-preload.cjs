'use strict';
const { ipcRenderer } = require('electron');

function injectButton() {
  if (document.getElementById('anydl-inject-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'anydl-inject-btn';
  btn.type = 'button';
  btn.textContent = '⬇ Download';
  btn.style.cssText = [
    'position:fixed', 'top:14px', 'right:14px', 'z-index:2147483647',
    'background:linear-gradient(90deg,#10b981,#06b6d4)', 'color:#04110c',
    'font:700 13px/1 -apple-system,Segoe UI,sans-serif', 'padding:10px 18px',
    'border:none', 'border-radius:999px', 'cursor:pointer',
    'box-shadow:0 8px 22px rgba(0,0,0,0.4)', 'display:flex', 'align-items:center', 'gap:6px',
    'transition:transform .15s ease'
  ].join(';');
  btn.onmouseenter = () => { btn.style.transform = 'translateY(-1px) scale(1.04)'; };
  btn.onmouseleave = () => { btn.style.transform = 'none'; };
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const original = btn.textContent;
    btn.textContent = 'Analyzing...';
    btn.disabled = true;
    ipcRenderer.sendToHost('anydl:download-clicked', { url: location.href, title: document.title });
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
  });
  (document.body || document.documentElement).appendChild(btn);
}

function maybeInject() {
  // Heuristic detection so this works on real video pages generically,
  // not a hardcoded per-site list: a real <video> element on the page, or
  // a URL shape that's almost always a single-video watch/status page on
  // the most common video-hosting sites.
  const hasVideoTag = !!document.querySelector('video');
  const looksLikeVideoUrl = /youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d|twitch\.tv\/videos|tiktok\.com\/.+\/video|(twitter|x)\.com\/.+\/status|reddit\.com\/r\/[^/]+\/comments|facebook\.com\/.+\/videos|instagram\.com\/(reel|p)\//i.test(location.href);
  if (hasVideoTag || looksLikeVideoUrl) injectButton();
}

document.addEventListener('DOMContentLoaded', maybeInject);
// Re-check periodically since single-page-app sites (YouTube, Twitter/X,
// Reddit) navigate between videos without a full page reload.
setInterval(maybeInject, 1500);
window.addEventListener('popstate', maybeInject);

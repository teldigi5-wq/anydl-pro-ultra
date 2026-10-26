#!/usr/bin/env node
'use strict';
/**
 * Downloads the real, official Windows binaries this app bundles:
 *   - yt-dlp.exe   (https://github.com/yt-dlp/yt-dlp)
 *   - ffmpeg.exe / ffprobe.exe  (https://github.com/BtbN/FFmpeg-Builds)
 *
 * Run once before packaging: `npm run fetch-bin`
 * electron-builder's `extraResources` config then bundles resources/bin/*
 * into the final installer, so end users need zero manual setup.
 */
const https = require('https');
const { createHash } = require('node:crypto');
const { pipeline, Transform } = require('node:stream');
const binaryLock = require('../security/windows-binary-lock.json');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = path.join(__dirname, '..', 'resources', 'bin');
const YTDLP_URL = binaryLock.ytDlp.url;
const FFMPEG_ZIP_URL = binaryLock.ffmpeg.url;
const REALESRGAN_ZIP_URL = binaryLock.realEsrgan.url;
const ARIA2_ZIP_URL = binaryLock.aria2.url;

// A build never executes a downloaded release file without checking that its
// content matches a reviewed, immutable SHA-256 in security/windows-binary-lock.json.
const MAX_DOWNLOAD_BYTES = 350 * 1024 * 1024;
function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    let target;
    try {
      target = new URL(url);
      if (target.protocol !== 'https:') throw new Error('Refusing non-HTTPS binary download or redirect');
    } catch (error) { reject(error); return; }
    const req = https.get(target, { headers: { 'User-Agent': 'anydl-pro-ultra-build' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirected;
        try { redirected = new URL(res.headers.location, target); } catch (error) {
          res.resume(); reject(error); return;
        }
        res.resume();
        resolve(download(redirected.href, dest, redirects + 1));
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode + ' for ' + target.href));
        return;
      }
      const part = dest + '.partial';
      let received = 0;
      const limit = new Transform({
        transform(chunk, _enc, callback) {
          received += chunk.length;
          if (received > MAX_DOWNLOAD_BYTES) {
            callback(new Error('Binary download exceeds 350 MiB maximum'));
          } else callback(null, chunk);
        }
      });
      pipeline(res, limit, fs.createWriteStream(part), (error) => {
        if (error) {
          fs.rmSync(part, { force: true });
          reject(error);
          return;
        }
        try { fs.renameSync(part, dest); resolve(); }
        catch (err) { fs.rmSync(part, { force: true }); reject(err); }
      });
    });
    req.setTimeout(180000, () => req.destroy(new Error('Binary download timed out')));
    req.on('error', reject);
  });
}

async function downloadVerified(asset, dest) {
  if (!asset || typeof asset.url !== 'string' ||
      !asset.url.startsWith('https://github.com/') ||
      /\/latest\//i.test(asset.url) ||
      !/^[0-9a-f]{64}$/i.test(asset.sha256)) {
    throw new Error('Refusing unpinned or unverified third-party binary');
  }
  await download(asset.url, dest);
  const hash = createHash('sha256');
  for await (const chunk of fs.createReadStream(dest)) hash.update(chunk);
  const actual = hash.digest('hex');
  if (actual !== asset.sha256.toLowerCase()) {
    fs.rmSync(dest, { force: true });
    throw new Error('SHA-256 mismatch for ' + path.basename(dest));
  }
  console.log('[fetch-bin] Verified SHA-256: ' + path.basename(dest) + ' (' + actual + ')');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('[fetch-bin] Downloading yt-dlp.exe ...');
  await downloadVerified(binaryLock.ytDlp, path.join(OUT_DIR, 'yt-dlp.exe'));
  console.log('[fetch-bin] yt-dlp.exe OK');

  console.log('[fetch-bin] Downloading ffmpeg (BtbN build) ...');
  const zipPath = path.join(OUT_DIR, 'ffmpeg.zip');
  await downloadVerified(binaryLock.ffmpeg, zipPath);

  console.log('[fetch-bin] Extracting ffmpeg.exe / ffprobe.exe ...');
  // Use the `unzip` CLI on the build machine (present on GitHub Actions
  // windows/linux/macOS runners); falls back to PowerShell Expand-Archive.
  try {
    execFileSync('unzip', ['-o', '-j', zipPath, '*/bin/ffmpeg.exe', '*/bin/ffprobe.exe', '-d', OUT_DIR], { stdio: 'inherit' });
  } catch {
    execFileSync('powershell', ['-Command',
      `Expand-Archive -Force '${zipPath}' '${OUT_DIR}\\_ffmpeg_tmp'; ` +
      `Get-ChildItem -Recurse '${OUT_DIR}\\_ffmpeg_tmp' -Include ffmpeg.exe,ffprobe.exe | Move-Item -Destination '${OUT_DIR}' -Force; ` +
      `Remove-Item -Recurse -Force '${OUT_DIR}\\_ffmpeg_tmp'`
    ], { stdio: 'inherit' });
  }
  fs.unlinkSync(zipPath);

  console.log('[fetch-bin] Downloading Real-ESRGAN (AI upscaler) ...');
  const esrganDir = path.join(OUT_DIR, 'realesrgan');
  fs.mkdirSync(esrganDir, { recursive: true });
  const esrganZip = path.join(OUT_DIR, 'realesrgan.zip');
  await downloadVerified(binaryLock.realEsrgan, esrganZip);
  try {
    execFileSync('unzip', ['-o', '-j', esrganZip,
      'realesrgan-ncnn-vulkan.exe', 'vcomp140.dll', 'vcomp140d.dll',
      '-d', esrganDir], { stdio: 'inherit' });
    execFileSync('unzip', ['-o', esrganZip, 'models/*', '-d', esrganDir], { stdio: 'inherit' });
    // The zip stores models/ inside no subfolder, so it lands at esrganDir/models directly.
  } catch {
    execFileSync('powershell', ['-Command',
      `Expand-Archive -Force '${esrganZip}' '${esrganDir}'`
    ], { stdio: 'inherit' });
  }
  fs.unlinkSync(esrganZip);
  console.log('[fetch-bin] Real-ESRGAN OK');

  console.log('[fetch-bin] Downloading aria2c (multi-connection downloader) ...');
  const aria2Zip = path.join(OUT_DIR, 'aria2.zip');
  await downloadVerified(binaryLock.aria2, aria2Zip);
  try {
    execFileSync('unzip', ['-o', '-j', aria2Zip, '*/aria2c.exe', '-d', OUT_DIR], { stdio: 'inherit' });
  } catch {
    execFileSync('powershell', ['-Command',
      `Expand-Archive -Force '${aria2Zip}' '${OUT_DIR}\\_aria2_tmp'; ` +
      `Get-ChildItem -Recurse '${OUT_DIR}\\_aria2_tmp' -Include aria2c.exe | Move-Item -Destination '${OUT_DIR}' -Force; ` +
      `Remove-Item -Recurse -Force '${OUT_DIR}\\_aria2_tmp'`
    ], { stdio: 'inherit' });
  }
  fs.unlinkSync(aria2Zip);
  console.log('[fetch-bin] aria2c OK');

  console.log('[fetch-bin] Done. Binaries in', OUT_DIR);
}

main().catch((e) => {
  console.error('[fetch-bin] FAILED:', e.message);
  console.error('[fetch-bin] You can also install yt-dlp/ffmpeg system-wide and enable');
  console.error('[fetch-bin] "Use system yt-dlp" in Settings instead of bundling.');
  process.exit(1);
});

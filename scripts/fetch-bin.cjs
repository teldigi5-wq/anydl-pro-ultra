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
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = path.join(__dirname, '..', 'resources', 'bin');
const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
const FFMPEG_ZIP_URL = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip';

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'anydl-pro-ultra-build' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return resolve(download(res.headers.location, dest, redirects + 1));
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('[fetch-bin] Downloading yt-dlp.exe ...');
  await download(YTDLP_URL, path.join(OUT_DIR, 'yt-dlp.exe'));
  console.log('[fetch-bin] yt-dlp.exe OK');

  console.log('[fetch-bin] Downloading ffmpeg (BtbN build) ...');
  const zipPath = path.join(OUT_DIR, 'ffmpeg.zip');
  await download(FFMPEG_ZIP_URL, zipPath);

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

  console.log('[fetch-bin] Done. Binaries in', OUT_DIR);
}

main().catch((e) => {
  console.error('[fetch-bin] FAILED:', e.message);
  console.error('[fetch-bin] You can also install yt-dlp/ffmpeg system-wide and enable');
  console.error('[fetch-bin] "Use system yt-dlp" in Settings instead of bundling.');
  process.exit(1);
});

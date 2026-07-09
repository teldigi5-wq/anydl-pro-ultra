# AnyDL Pro Ultra — real Windows desktop video downloader

A native Windows desktop app (Electron) with a real `yt-dlp` + `ffmpeg` backend.
Same UI/theme system as the original design, but every download is real: real
metadata from `yt-dlp -J`, a real child process doing the download, real
progress parsed from its output, and real files landing on your PC.

## What's real

- **Analyze** — runs `yt-dlp -J` on the URL you paste. Title, thumbnail,
  duration, uploader, subtitles, and the format list all come straight from
  the source.
- **Download** — spawns a real `yt-dlp` process with `--newline` and parses
  its stdout for live percent / speed / ETA. Pause = kill the process
  (yt-dlp's `.part` files + `--continue`, on by default, make resume trivial:
  it's just re-running the same command). Cancel = kill + remove.
- **System stats** — CPU/RAM/network/disk/temperature come from the
  [`systeminformation`](https://systeminformation.io) package, polled every
  2s in the Electron main process.
- **Settings** — persisted to a real JSON file in the OS user-data folder.
  Download folder picker uses the native Windows folder dialog. "Launch on
  startup" uses Electron's real `app.setLoginItemSettings`.
- **Smart tools** — audio normalize / denoise / chapter embed / trim /
  split-by-chapters / multi-audio-tracks all map to real `yt-dlp`/`ffmpeg`
  flags. Two are intentionally **not** implemented and say so in the UI:
  watermark auto-removal (no reliable per-video coordinates without a
  detection model) and AI upscaling (needs a bundled ML model). I didn't want
  to fake those.
- **Universal Sniffer** (Browser tab) — same real `yt-dlp -J` call, reframed
  as a format sniffer. It is **not** a DOM/network packet sniffer, and it
  cannot extract DRM-protected streams (Netflix, Disney+, Prime Video, etc.)
  — those are protected by real encryption that no downloader can
  legitimately bypass. The old version of this tab faked exactly that, so
  this is a deliberate simplification, not an oversight.
- **yt-dlp + ffmpeg are bundled** — `scripts/fetch-bin.cjs` pulls the real,
  official Windows binaries from their GitHub releases
  (`yt-dlp/yt-dlp` and `BtbN/FFmpeg-Builds`) into `resources/bin/` before
  packaging, so the installed app needs zero manual setup. You can also point
  it at a system install instead (toggle in the "Windows Bridge" tab).

## Project layout

```
electron/main.cjs      Electron app lifecycle + all IPC handlers
electron/engine.cjs     The actual yt-dlp/ffmpeg process management
electron/preload.cjs    Safe contextBridge API exposed to the renderer
electron/store.cjs      Settings persistence (JSON file on disk)
scripts/fetch-bin.cjs   Downloads real yt-dlp.exe/ffmpeg.exe for bundling
src/lib/api.ts          Typed wrapper the React UI calls into
src/                    The original UI, rewired to call the real engine
```

## Running it yourself

You'll need [Node.js 20+](https://nodejs.org).

```bash
npm install
npm run dev          # starts Vite + Electron together, hot reload
```

The dev window works fully for testing — it uses whatever `yt-dlp`/`ffmpeg`
it finds in `resources/bin` (run `npm run fetch-bin` once) or on your system
PATH if you don't fetch the bundled copies.

## Building the real Windows installer

You have two options:

**Option A — GitHub Actions (recommended, no Windows machine needed)**
Push this repo to GitHub. `.github/workflows/build-windows.yml` builds it on
a real `windows-latest` runner and uploads
`AnyDL Pro Ultra-Setup-6.0.0.exe` as a downloadable artifact. Or trigger it
manually from the Actions tab ("Run workflow").

**Option B — build locally on Windows**
```bash
npm install
npm run dist          # builds the frontend, fetches real binaries, packages the installer
```
The installer lands in `release/AnyDL Pro Ultra-Setup-*.exe`. This step must
run on Windows (or with Wine) because `electron-builder`'s NSIS installer is
a native Windows format.

## What I simplified from the original mockup

The original project was a beautifully designed but entirely simulated UI —
fake progress math, a hardcoded 5-video sample list matched against typed
URLs, random system stats, and an unused Python WebSocket bridge script. This
version keeps the UI and rewires it to a real backend. A few things were
intentionally scaled back rather than faked further — see "Smart tools" and
"Universal Sniffer" above. If you want those finished (e.g. a real embedded
`<webview>` browser with `session.webRequest` network sniffing, or a bundled
upscaling model), that's a reasonable next step — just ask.

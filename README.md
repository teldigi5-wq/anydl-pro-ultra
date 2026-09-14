<div align="center">

# ⚡ AnyDL Pro Ultra

### Real Windows desktop media downloader powered by `yt-dlp` + `FFmpeg`

[![Build Windows Installer](https://github.com/teldigi5-wq/anydl-pro-ultra/actions/workflows/build-windows.yml/badge.svg)](https://github.com/teldigi5-wq/anydl-pro-ultra/actions/workflows/build-windows.yml)

![Electron](https://img.shields.io/badge/Electron-33-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-x64-0078D4?style=for-the-badge&logo=windows11&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Media-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)

**A production-style Electron application with real metadata analysis, process management, media processing, live progress and Windows packaging.**

</div>

---

## 🎯 Project snapshot

| Area | Implementation |
|---|---|
| Desktop shell | Electron |
| Frontend | React + TypeScript + Vite |
| Download engine | `yt-dlp` child processes |
| Media processing | FFmpeg |
| Native integration | IPC + `contextBridge` |
| System telemetry | `systeminformation` |
| Packaging | electron-builder + NSIS |
| CI | TypeScript validation + frontend build + Windows installer packaging |
| Target | Windows x64 |

> **Engineering principle:** if a feature is shown as working, it should be backed by real behavior rather than simulated UI data.

---

## 🚀 Core capabilities

- Real URL analysis through `yt-dlp -J`
- Live percentage, speed and ETA parsing
- Pause/resume-compatible download flow
- Native Windows folder selection
- Persistent application settings
- CPU, RAM, disk, network and supported temperature telemetry
- FFmpeg-backed media tools
- Bundled `yt-dlp` and FFmpeg binaries
- Windows installer generation
- GitHub Actions validation and Windows packaging workflow

---

## 🧠 Architecture

```mermaid
flowchart LR
    UI[React + Vite UI] --> API[Typed renderer API]
    API --> Bridge[Electron preload / contextBridge]
    Bridge --> Main[Electron main process]
    Main --> Engine[Download & media engine]
    Engine --> YTDLP[yt-dlp]
    Engine --> FFMPEG[FFmpeg]
    Main --> Store[Settings store]
    Main --> System[System telemetry]
```

### Project layout

```text
electron/main.cjs       Electron lifecycle + IPC handlers
electron/engine.cjs     yt-dlp / FFmpeg process management
electron/preload.cjs    Safe contextBridge API
electron/store.cjs      Persistent settings storage
scripts/fetch-bin.cjs   Fetches Windows media binaries
src/lib/api.ts          Typed renderer-side API
src/                    React application UI
```

---

## 🔍 How the real workflow works

### 1. Analyze

The renderer requests metadata through the Electron bridge. The main process runs `yt-dlp -J`, then returns actual title, thumbnail, duration, uploader, subtitles and format information.

### 2. Download

The engine starts a real `yt-dlp` child process and parses newline progress output to update percentage, speed and ETA in the UI.

### 3. Process media

Supported tools map to actual `yt-dlp` or FFmpeg operations such as normalization, denoise, trim, chapter handling and multi-audio workflows.

### 4. Persist settings

Application preferences are stored in Electron's OS user-data location. Native folder selection and startup integration are handled by Electron APIs.

---

## 🧩 Deliberately not faked

Some advanced ideas are intentionally not presented as complete when they require more engineering:

- **Automatic watermark removal** needs reliable detection/localization logic.
- **AI upscaling** needs a bundled model and inference pipeline.
- The **Universal Sniffer** performs real `yt-dlp` metadata/format analysis; it is not a packet-level browser sniffer and does not bypass DRM-protected media.

That distinction is intentional: incomplete functionality is labelled honestly rather than simulated.

---

## 🛠️ Development

### Requirements

- Node.js 20+
- npm
- Windows recommended for native installer packaging

### Run locally

```bash
npm install
npm run fetch-bin
npm run dev
```

The app uses binaries from `resources/bin` when available, or supported system binaries where configured.

---

## 📦 Build for Windows

### Local build

```bash
npm install
npm run dist
```

Installer output is written under:

```text
release/
```

### GitHub Actions

The CI pipeline now performs three checks on clean runners:

1. installs dependencies from the committed lockfile,
2. runs TypeScript validation and the frontend production build,
3. packages a Windows installer and uploads it as a workflow artifact.

Pull requests are validated before merge, while pushes to `main` also exercise the packaging path.

---

## 💼 What this project demonstrates

AnyDL is useful as a portfolio project because it combines several engineering concerns inside one desktop product:

- frontend state and UI design
- Electron process separation
- safe renderer-to-main communication
- child-process lifecycle management
- parsing real CLI output
- filesystem integration
- binary/tool distribution
- desktop packaging
- CI validation on clean environments
- honest feature boundaries

---

## 🗺️ Next upgrades

- [ ] Add automated unit tests around command construction and progress parsing
- [ ] Add integration tests for download lifecycle states
- [ ] Add release notes and versioned GitHub Releases
- [ ] Add polished product screenshots / demo media
- [ ] Explore optional AI upscaling through a clearly separated model pipeline

---

## ⚠️ Responsible use

Use this application only for media you are legally permitted to download or process. Platform terms, copyright law and content licenses still apply.

---

<div align="center">

### Real processes. Real files. Real desktop engineering.

**Built by Poojana Kaveesh**

</div>

<div align="center">

# AnyDL Pro Ultra

**Windows desktop media downloader • Electron + React + TypeScript • yt-dlp + FFmpeg**

[![Windows build](https://github.com/teldigi5-wq/anydl-pro-ultra/actions/workflows/build-windows.yml/badge.svg)](https://github.com/teldigi5-wq/anydl-pro-ultra/actions/workflows/build-windows.yml)
[Source](https://github.com/teldigi5-wq/anydl-pro-ultra) · [Security policy](SECURITY.md) · [Release evidence](docs/SECURITY_RELEASE_EVIDENCE.md)

**Engineering portfolio project maintained by [Poojana Kaveesh Sellahewa](https://github.com/teldigi5-wq).**

</div>

## At a glance

AnyDL combines a React desktop UI with an Electron main process that invokes **real local command-line download and media tools**. It is designed to expose useful progress, metadata, OS integration, and media workflows without granting arbitrary Node.js access to web content.

| Layer | Implemented approach |
| --- | --- |
| Desktop UI | React 19, TypeScript 5, Vite 7, Tailwind CSS |
| Native shell | Electron 44, isolated/sandboxed renderer, preload bridge |
| Download engine | Local yt-dlp process; structured metadata and progress parsing |
| Media processing | FFmpeg and optional native tooling |
| Configuration | Electron user-data settings; OS-backed encryption for supported AI credentials |
| Windows distribution | electron-builder / NSIS (x64) |
| CI | Node security tests, TypeScript, Vite build, dependency audit, Windows renderer smoke and installer packaging |

**Verification boundary:** GitHub Actions has produced Windows installer artifacts and passed the automated suite. That is **not** evidence of complete installation testing, feature-by-feature downloads, code signing, or production certification.

## The engineering problem

A desktop downloader sits across multiple trust and reliability boundaries: untrusted URLs, long-running external processes, a privileged filesystem-capable application, and an embedded browser. The project separates the UI from privileged operations and attempts to make download state and failures observable.

### Architecture

~~~mermaid
flowchart LR
    User[Desktop user] --> UI[React / TypeScript UI]
    UI --> Preload[Isolated Electron preload bridge]
    Preload --> IPC[Validated main-process IPC]
    IPC --> Engine[Download / media engine]
    Engine --> YT[yt-dlp]
    Engine --> FF[FFmpeg]
    IPC --> Store[Local settings / OS credential backend]
    IPC --> OS[Native dialog / system data]
~~~

The **renderer is not the operating system**. Native actions go through the main process, with an explicit IPC trust boundary. Embedded web content is treated separately from the trusted application UI.

### Representative workflow

1. Enter a supported URL and request **real metadata** using yt-dlp.
2. Select available formats or media options and start a managed child process.
3. Observe parsed progress, speed and ETA where the underlying tool reports them.
4. Write output through configured local paths; optional FFmpeg steps process supported formats.
5. Recover from failures or retry through the application's workflow rather than assuming every site or format works.

Site restrictions, broken upstream extractors, DRM, missing models, drivers and network failures can limit functionality. No claim is made that every download source succeeds.

## What I can explain in an interview

The implementation and commit history provide concrete topics to demonstrate—not a claim that every line was written without assistance.

| Engineering area | Where to inspect | Decision / trade-off |
| --- | --- | --- |
| Privileged UI boundary | [electron/main.cjs](electron/main.cjs), [preload](electron/preload.cjs), [IPC policy](electron/ipc-authorization.cjs) | Renderer sandbox, context isolation and main-frame IPC authorization |
| Untrusted browsing | [webview policy](electron/webview-policy.cjs), [navigation policy](electron/app-navigation.cjs) | Keep external navigation outside privileged application pages |
| API credential handling | [settings store](electron/store.cjs), [key storage notes](SECURITY_KEY_STORAGE.md) | Encrypt supported saved keys through Electron safeStorage; use session-only fallback |
| Native build supply chain | [binary lock](security/windows-binary-lock.json), [fetch script](scripts/fetch-bin.cjs) | Pin release URLs, check SHA-256 before extraction and package reproducibly |
| Regression gates | [Electron tests](electron/ipc-authorization.test.cjs), [Windows CI](.github/workflows/build-windows.yml) | Run trusted-renderer and policy tests before packaging |

**Security remediation evidence:** [PR #13](https://github.com/teldigi5-wq/anydl-pro-ultra/pull/13) was merged with the Electron upgrade, sandbox smoke testing and pinned external binaries. The test suite included **20 passing automated Node tests** on the verified October 26, 2026 build. The numbers describe that run, not a promise about all future commits.

## Run and test

**Prerequisites:** Windows x64 for the intended desktop installer, Node.js compatible with the [package engines](package.json) (the CI baseline is 22.23.4), npm, internet access for pinned third-party binaries, and sufficient disk space.

~~~bash
git clone https://github.com/teldigi5-wq/anydl-pro-ultra.git
cd anydl-pro-ultra
npm ci
npm run security:test
npx tsc --noEmit
npm run build
~~~

For local Electron development:

~~~bash
npm run dev
~~~

For a Windows installer build:

~~~bash
npm run dist
~~~

The build downloads pinned official release artifacts specified in [security/windows-binary-lock.json](security/windows-binary-lock.json), validates SHA-256, and creates an NSIS installer under **release/**. Do not replace hashes without reviewing the corresponding source artifact. To inspect CI-produced files, open [Build Windows Installer](https://github.com/teldigi5-wq/anydl-pro-ultra/actions/workflows/build-windows.yml), select a successful run and review its uploaded installer and SHA256SUMS.txt.

### Verified vs. not verified

| Verified by repository CI | Still requires manual validation |
| --- | --- |
| Static TypeScript and Vite build | Clean Windows installation and uninstall |
| Main-frame IPC, navigation, webview and settings regressions | Real downloads across representative permitted providers |
| Sandbox preload smoke on Windows | Actual OS key-store migration and AI provider credential lifecycle |
| High-severity dependency audit and installer generation | Installer signing, SmartScreen behavior and end-user benchmarks |

**No fake performance claims:** throughput depends on the media provider, network, yt-dlp, FFmpeg, hardware and download settings. The built-in browser is not a DRM bypass.

## Repository guide

| Location | Responsibility |
| --- | --- |
| [src/](src/) | UI, views, state and application interactions |
| [electron/engine.cjs](electron/engine.cjs) | Download and processing subprocesses |
| [electron/main.cjs](electron/main.cjs) | Desktop lifecycle and privileged IPC |
| [electron/store.cjs](electron/store.cjs) | Settings and protected key storage |
| [scripts/fetch-bin.cjs](scripts/fetch-bin.cjs) | Reviewed native binary acquisition |
| [docs/SECURITY_RELEASE_EVIDENCE.md](docs/SECURITY_RELEASE_EVIDENCE.md) | Security verification history and manual release gates |

Some UI development fixtures exist (for example, [src/data/mockVideos.ts](src/data/mockVideos.ts)); **do not mistake mock content for a measured live download**.

## Demo checklist

- Launch the app and identify the UI → preload → main → yt-dlp path.
- Show a supported, authorized media URL being analyzed and explain what metadata actually comes from yt-dlp.
- Show a non-destructive security test (`npm run security:test`) and its assertions.
- Open the Windows build workflow to demonstrate independent-runner packaging and checksums.
- Explain one failure mode you addressed (renderer crash, untrusted IPC, or malicious binary replacement), plus one limitation you have not yet solved.

## Ownership and attribution

**Repository owner / project maintainer:** [Poojana Kaveesh Sellahewa](https://github.com/teldigi5-wq). The version-controlled source, [commits](https://github.com/teldigi5-wq/anydl-pro-ultra/commits/main), [PR history](https://github.com/teldigi5-wq/anydl-pro-ultra/pulls?q=is%3Apr) and automated tests are the evidence of work. In interviews, describe which design/code/review tasks you performed personally and disclose collaboration or AI-assisted work accurately. No external penetration-test certification or sole-authorship claim is implied.

### Next engineering work

- [ ] Clean-Windows installer, update and uninstall acceptance checklist
- [ ] Integration tests for yt-dlp download state transitions and interruptions
- [ ] Real-world smoke tests using legally permitted media
- [ ] Installer signing and documented rollback/release procedure
- [ ] Screenshots or a short reproducible demonstration video from the actual app

## Responsible use

Only download or process content you are permitted to access and store. Respect copyright, service conditions, security controls and DRM restrictions. Report vulnerabilities privately following [SECURITY.md](SECURITY.md).

**Scope:** Windows desktop engineering portfolio project, **not** a claim of enterprise-grade production certification.

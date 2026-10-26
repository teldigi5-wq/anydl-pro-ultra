# Security release evidence and review gates

**Scope:** anydl-pro-ultra draft PR #13, assessed 26 October 2026. These are candidate code changes, not an authorized merge or deployment.

## Automated checks and defended boundaries

- Electron 44.9.1, Electron Builder 26.18.0 and Vite 7.3.7 are locked at patched versions.
- Main renderer has `sandbox: true`, `contextIsolation: true` and `nodeIntegration: false`; preload's only native import is Electron contextBridge/ipcRenderer.
- A real Electron/Windows offline smoke validates the bridged APIs with a sandboxed renderer; CI also runs privileged IPC and webview policy regression tests.
- `security/windows-binary-lock.json` pins yt-dlp, FFmpeg, Real-ESRGAN and aria2 URLs and SHA-256 digests; build downloads reject non-HTTPS, oversized content and mismatched hashes before extraction.
- Release digests for yt-dlp/FFmpeg came from GitHub release asset metadata; hashes for the older Real-ESRGAN/aria2 archives were captured from the prior HTTPS CI download (not independent publisher signatures).
- Windows installer artifact from this PR was uploaded by CI, not signed or deployed.

**CI evidence:** https://github.com/teldigi5-wq/anydl-pro-ultra/actions/runs/40272892772

To verify that the scan remains valid, use the latest PR-head workflow result; older CI links are historical evidence only. Zero findings from a dependency scan do **not** establish absence of application or infrastructure vulnerabilities.

## Mandatory manual and release checks

- [ ] Install and open the PR-built executable on an isolated Windows workstation; verify renderer console/network and no sandbox preload errors.
- [ ] Exercise URL analysis, downloads, playlists, subtitles, AI-key storage, browser/webviews and proxy settings with test media.
- [ ] Evaluate external yt-dlp/FFmpeg licensing, update policy, binary provenance and Authenticode signing.
- [ ] Verify Windows Defender/SmartScreen behavior, no unexpected network requests and signed installer hash.
- [ ] Obtain independent code/security review before merging.

## Release decision standard

- Keep the PR draft until required checks on its **exact latest commit** pass.
- Inspect the changed-file diff, ensure `main` is not overwritten, and require an approving reviewer.
- Never push API keys, account credentials, WhatsApp/Telegram session files or production customer data to a test log.
- Sign and publish only after owner approval, preserve reproducible artifacts and a rollback point.
- Label all claims precisely: **CI passed**, **packaged successfully**, **manual test performed**, or **not yet verified**. Never substitute one for another.

# AI provider key storage hardening

The Electron main process encrypts Groq, OpenRouter and Anthropic API keys using
Electron safeStorage when an appropriate operating-system credential backend is available.
Only a boolean "configured" indicator reaches the renderer through settings IPC.
Existing downloaded files, history and the AI provider call path are unchanged.

Legacy settings.json migration: On first launch, any previous plaintext API keys
are read into main-process memory, rewritten encrypted if the OS backend is available,
and removed from the JSON file. Migration does not clean old drive backups, recovered
deleted files or historical copies; rotate a previously exposed provider key.

Fallback: Without usable safeStorage, secrets work only in the current session.
They are never silently stored unencrypted. Reenter on the next launch if required.
If the OS credential store changes or its key becomes unavailable, reenter your API
credentials. Back up existing configuration before installing an upgrade.

Remaining limitations: Privileged main-process code still needs decrypted keys.
The renderer sees a newly typed secret while the user enters it (standard password-input
behavior), but it cannot read an existing saved secret back. Proxy URL may contain proxy
credentials and needs its own migration/security review before deployment with
credentialed proxies. The main Electron window now enables Chromium sandboxing, context isolation and disabled Node integration. The sandboxed preload uses Electron contextBridge/IPC rather than unrestricted Node imports, and embedded webviews remain isolated behind main-frame sender checks. This is defense in depth, not proof that arbitrary untrusted pages are safe or a substitute for real Windows security testing.

Validation: npm run security:test, npx tsc --noEmit, npm run build,
and the existing Windows installer CI. A real Windows OS key-store migration and
AI-provider smoke test are required before calling the key lifecycle fully certified.

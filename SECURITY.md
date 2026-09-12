# Security Policy

## Supported version

Security fixes are applied to the latest maintained version of AnyDL Pro Ultra.

## Reporting a vulnerability

Please do **not** publish credentials, private media, tokens, local file paths, or exploit details in a public issue.

Report security-sensitive findings privately to the repository owner with:

- a clear description of the issue
- steps to reproduce
- affected version / commit
- expected vs actual behavior
- impact and suggested mitigation, if known

## Security boundaries

AnyDL Pro Ultra launches local `yt-dlp` and `FFmpeg` processes and can write downloaded or processed files to disk. Treat downloaded media and externally supplied URLs as untrusted input.

The project should never require users to commit API keys, session cookies, browser profiles, account credentials, or other secrets to the repository.

## Responsible use

Use the application only with media you are authorized to download or process. Do not use the project to bypass DRM, access controls, authentication, or platform restrictions.

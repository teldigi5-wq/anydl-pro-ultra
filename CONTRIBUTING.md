# Contributing to AnyDL Pro Ultra

Thanks for improving the project.

## Before opening a change

- Keep changes focused and easy to review.
- Prefer real behavior over simulated UI states.
- Do not add DRM bypasses, credential harvesting, or features that depend on private user data.
- Avoid committing generated installers, local settings, downloaded media, or secrets.

## Development workflow

1. Create a focused branch.
2. Install dependencies with `npm install`.
3. Fetch required binaries with `npm run fetch-bin` when needed.
4. Run the application in development mode with `npm run dev`.
5. Test the affected workflow manually and, where applicable, through existing automated checks.
6. Use clear commit messages such as `feat:`, `fix:`, `docs:`, `refactor:`, or `test:`.

## Pull requests

A good pull request should explain:

- the problem being solved
- the implementation approach
- how it was tested
- any limitations or follow-up work

Keep unrelated refactors separate from functional changes.

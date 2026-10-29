# MoEasy Claude Code Instructions

Read `@docs/CODEX_HANDOFF.md` and `@docs/PROJECT_LINKS.md` before changing code. They contain the current implementation state, external references, and the context handed over from the prior Codex session.

## Non-negotiable scope

- This repository is the MoEasy frontend. Never edit backend source code or claim that a backend change was completed.
- Backend behavior may be inspected through documented APIs when relevant, but backend fixes must be reported to the backend team.
- Preserve existing user changes. Always inspect `git status`, the current branch, and the relevant files before editing.
- Do not commit environment files, credentials, client secrets, access tokens, cookies, or private Notion exports.
- Browser-exposed map JavaScript keys and OAuth client IDs still belong in environment variables; never copy their real values into documentation or source.
- Do not replace the local-storage fallback or API integration wholesale without first understanding both modes.

## Git and delivery workflow

- Organization remote: `origin`.
- Personal mirror: `personal`.
- Start requested feature work from an up-to-date `main` unless the user specifies another base.
- Use descriptive branches beginning with `feat/`, `fix/`, `chore/`, or `docs/`. Do not put `codex` or `claude` in new branch names, issue titles, commits, or PR titles.
- Use conventional commit subjects such as `feat: ...` and `fix: ...`.
- For implementation tasks, keep the issue, branch, commit, PR, verification, merge, and deployment status explicit. Never report a push, merge, or deployment as complete without verifying it.
- Do not rewrite shared history, force-push, delete branches, or discard uncommitted work without explicit user approval.

## Project conventions

- Stack: React, TypeScript, Vite, Tailwind CSS 4, PWA, Tesseract.js.
- Prefer the existing component and service patterns under `src/app`.
- Routing is currently coordinated in `src/app/App.tsx` with browser history and pathname state. Inspect it before adding or changing routes.
- Browser persistence goes through `src/app/lib/persistence.ts` and `usePersistentState` where possible.
- API calls go through `src/app/lib/apiClient.ts`; preserve cookie credentials, CSRF handling, error-envelope handling, and the single reissue retry.
- Social login is Kakao and Google only. Do not restore local email/password signup unless the user explicitly reverses this product decision.
- Keep Kakao Login and Kakao Maps keys separated.
- Keep OCR processing client-side unless the user explicitly chooses a server OCR product.

## Validation

- Available scripts are `npm run dev` and `npm run build`.
- There is currently no dedicated lint or test script in `package.json`; do not claim that lint/tests passed unless such tooling is added and run.
- Validate changes proportionally: at minimum run the production build for code changes and inspect the changed user flow when practical.
- Report unrelated pre-existing failures separately from failures introduced by the current change.


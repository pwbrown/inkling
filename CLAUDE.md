# Inkling: working conventions

Inkling is an offline-first, open-source browser typing game (TypeScript + Vite + PixiJS). Start with `docs/REQUIREMENTS.md` (what to build, milestones) and `docs/DESIGN.md` (look and feel).

## Git workflow

- Work on a branch, never directly on `main`. Name it `feat/<short-name>` for features (e.g. `feat/m7-polish`), `fix/<short-name>` for fixes, `chore/<short-name>` for housekeeping.
- Merge into `main` with a fast-forward merge (`git merge --ff-only <branch>`).
- **Once a branch is merged, delete it locally** (`git branch -d <branch>`). Use `-d`, not `-D`, so git refuses to delete anything unmerged.
- Commit only when asked. Commit messages: a short summary line, then bullet points of what changed.

## Before calling work done

- `npm run check` (typecheck, lint, tests) and `npm run build` must pass.
- For anything visible, run the game (`npm run dev`) and check it in a browser.
- Service workers only run in production builds (`npm run build && npm run preview`).

## Code conventions

- Game rules live in `src/core/` and stay free of DOM and PixiJS so they can be unit tested. Rendering (`src/render/`) reads state and never changes it.
- Menus and settings screens are plain DOM in `src/ui/`, for accessibility.
- All tuning numbers go in `src/core/config.ts`.
- Every user-facing string goes through `t()` with an entry in `src/i18n/en.ts`.
- No network requests, analytics or third-party scripts (see `PRIVACY.md`). The single exception is the player-triggered word download in `src/content/vocabApi.ts`, the only origin allowed by the CSP's `connect-src`. Every bundled third-party asset needs a redistributable license and an entry in `CREDITS.md`.
- Keep the save format versioned: changing `SaveData` means bumping `SAVE_VERSION` and adding a migration in `src/storage/schema.ts`.

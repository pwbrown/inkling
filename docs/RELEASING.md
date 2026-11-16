# Releasing Inky Keys

Every release has a [semantic version](https://semver.org/), a git tag `v<version>`, and a few lines of notes that players see in the game.

## Picking the version

Inky Keys has no API, so "breaking" means breaking for a **player**: what someone coming back to the game will notice.

| Bump | When | Examples |
|---|---|---|
| **Major** (`2.0.0`) | The shape of the game changes: a new way to play becomes the main one, or saved progress can't carry over. Rare. | The Apprentice course replacing the endless notebook (2.0.0). |
| **Minor** (`2.4.0`) | Something new a player can see or do. Every milestone is at least a minor. | New creatures, powers, layouts, menus, a rename. |
| **Patch** (`2.2.1`) | Only fixes and tuning: nothing new to learn. | Playtest fixes, gentler difficulty, kinder word lists. |

Versions below 1.0 were the early milestones. 1.0.0 is where the first plan (REQUIREMENTS §13, milestones 1–7) was complete.

A save format change (`SAVE_VERSION`) doesn't force a major on its own. Migrations keep old saves working, so it's usually part of a minor.

## Writing the notes

Notes live in `src/core/releases.ts`, newest first, with their text in `src/i18n/en.ts` under `release.<version>.<name>`.

- Only what changes the game for a player. One short line each, at most four per release, written for a kid to read.
- Everything else (fixes, tuning, refactors, docs, build changes) is covered by `fixes: true`, which adds "Bug fixes and small improvements."
- Use today's names for things (Scrawlers, not Blotlings), since players read old notes in today's game.

## What players see

- **After an update:** the first time a browser runs a new version, a "What's new" card lists every release since the version it last ran (up to three, older ones folded under "Earlier versions"). New players see nothing. Players from before versions were tracked see just the current release. The last version seen is kept in `localStorage` (`inkling.lastVersion`), per browser.
- **Any time:** About shows the version and a **What's new** button with every release.

## Making a release

1. On a branch, add the release to the top of `RELEASES` in `src/core/releases.ts`, its strings to `src/i18n/en.ts`, and set `version` in `package.json` (and the two matching lines in `package-lock.json`, or run `npm version <x.y.z> --no-git-tag-version`). A test checks they agree.
2. `npm run check` and `npm run build`, then merge to `main` as usual.
3. On `main`: `npm run release:tag`. It checks the tree is clean and the versions match, then makes an annotated tag whose message is the notes.
4. `git push origin v<version>`. The Release workflow turns the tag into a GitHub Release with the same notes.

Not every commit needs a release. Batch small fixes into the next patch or minor.

To tag an older commit (as done once for the history below): `npm run release:tag -- <version> <commit>`. The tag gets the commit's date.

## History

Tagged after the fact on 2026-11-16.

| Version | Commit | What |
|---|---|---|
| 0.1.0 | `7e350bb` | M1 Scaffold |
| 0.2.0 | `25186eb` | M2 Core loop |
| 0.3.0 | `e670c76` | M3 Word pages |
| 0.4.0 | `5e85a0b` | M4 Chapters and difficulty |
| 0.5.0 | `145776d` | M5 Type Case |
| 0.6.0 | `2047df6` | M6 Saves, offline play, first deploy |
| 1.0.0 | `9168fc8` | M7 Polish: first plan complete |
| 1.1.0 | `a988927` | M8 Run-ons, Misprints, word lists |
| 1.2.0 | `39d338a` | M9 Menus |
| 1.3.0 | `ef38850` | M10 Readability |
| 1.4.0 | `6c024f7` | M11 Creatures |
| 2.0.0 | `d1fafbf` | M12 Apprentice campaign: the game becomes a course |
| 2.1.0 | `3fe54b2` | M13 Rewards |
| 2.1.1 | `1b30fbd` | Playtest fixes |
| 2.2.0 | `bd874fa` | M14 Players and looks |
| 2.2.1 | `708b40c` | Playtest fixes |
| 2.3.0 | `114804b` | Word filter, Scrawlers from chapter 1, hands guide, typewriter Type Case |
| 2.4.0 | `c34334c` | M15 Character and teaching |
| 2.5.0 | `f88d488` | M16 Keyboard layouts |
| 2.6.0 | `47fe7f2` | Inky Keys name, domain and icons; What's new and version on About |
| 2.7.0 | `974e8bb` | M17 First impressions: Free Write first, no more Misprints |

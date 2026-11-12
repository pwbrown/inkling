# Inkling: Requirements

> Name: **Inkling**. Theme and art direction are in [DESIGN.md](DESIGN.md).
> Status: Draft v0.1 (2026-11-12)

This doc is the source of truth for what the game must do. It is organized so the game can be built one milestone at a time (§13).

---

## 1. Vision

This is an arcade typing game inspired by *Typer Shark*. The player sits on the **left** side of the screen, and targets carrying text drift in from the **right**. Typing a target's text destroys it. A target that reaches the player does damage.

**What makes it different:** the player chooses exactly which keys they want to practice, by individual key or by whole region. Every piece of content the game makes uses only those keys, so the game grows with the player as they learn.

### Guiding principles
- **Adaptive by design.** All content respects the player's key selection.
- **Offline-first.** It runs fully in the browser with no server.
- **Private.** No data ever leaves the device.
- **Hackable.** Built on plain web tech that is easy to edit and tune.

---

## 2. Core Gameplay

| Element | Requirement |
|---|---|
| **Player** | A character or object fixed on the left edge. It has health or lives (decided in design). |
| **Targets** | They spawn off-screen on the right, move left, and each carries a text payload. |
| **Targeting** | Typing the first character locks onto the closest target that starts with it. Later keystrokes go to the locked target until it is destroyed. Esc releases the lock (optional). |
| **Mistakes** | A wrong key counts as an error. It lowers accuracy and the score multiplier but does **not** cost health. The penalty is tunable. |
| **Collision** | A target that reaches the player deals damage and is removed. |
| **Structure** | Campaign → Levels → Waves. **Each wave contains a single target type.** |
| **Summaries** | A short summary screen appears between waves and levels, showing WPM, accuracy, score and the most-missed keys. |

---

## 3. Target Types

| ID | Name | Payload | Skill trained | Phase |
|---|---|---|---|---|
| **T1** | Word target | A word, or a string of allowed keys when no words fit | Typing sequences | MVP |
| **T2** | Character target | One character (letter, digit or symbol) | Single-key recall, reaction time | MVP |
| **T3** | Phrase target | Several words or a sentence. Errors stay in the buffer and **must be fixed with Backspace** | Accuracy and correction | Post-MVP |
| **T4** | Correction target | A misspelled word shown in an editable field. Fix it with **arrow keys plus Backspace/Delete** | Cursor navigation and editing | Post-MVP |

### Input models
- **Match mode (T1, T2):** each keystroke is checked against the next expected character.
- **Buffer mode (T3, T4):** the target keeps a text buffer with a cursor. It is complete when the buffer equals the target text.

The input layer must let both models plug in behind a common interface.

---

## 4. Difficulty Model

### Tunable parameters
- Target speed
- Spawn interval
- Maximum targets on screen at once
- Payload complexity: length, use of rare keys, shift/symbol density
- Wave length (number of targets)

### Scaling factors
1. **Campaign difficulty.** Chosen before a new campaign starts (e.g. *Relaxed / Normal / Hard / Expert*). It sets the base values.
2. **Level progression.** Difficulty rises slightly from one level to the next.
3. **Wave progression.** Difficulty rises slightly from one wave to the next inside a level.

```
param = clamp(
  base[difficulty][param]
    × (1 + levelStep × levelIndex)
    × (1 + waveStep  × waveIndex),
  min, max)
```

- All constants live in **one config file**, so tuning needs no code changes.
- *Later (optional):* nudge difficulty up or down based on recent accuracy.

---

## 5. Key Selection (Core Differentiator)

- The setup screen shows an **interactive on-screen keyboard**, starting with the US QWERTY layout.
- The player can toggle **individual keys** or whole **regions**:
  - Lowercase letters, uppercase letters
  - Home row, top row, bottom row
  - Left hand, right hand
  - Digits
  - Unshifted symbols, shifted symbols
  - Space
- Built-in **presets** (e.g. "Home row", "Left hand", "Numbers only"), plus **custom presets** the player can name and save.
- The selection is stored per profile and per campaign.
- The selection is **by character** (`KeyboardEvent.key`), so `a`/`A` and `1`/`!` are separate choices. Shifted characters show their physical key with a Shift indicator.
- **Validation:** the game warns when a selection is too small for some target types. For example, if no real words are possible, T1 falls back to generated strings (§6).

---

## 6. Content Generation

### Word pool
- Ships with a bundled, **profanity-filtered English word list** of about 50k+ words, each tagged with length and frequency.
- At runtime the list is filtered to words made **only** of the selected characters.
- **Complexity ranking:** candidate words are scored by length, word frequency and per-key difficulty, so harder waves draw harder words.

### Fallback generator
- If the number of matching words falls below a configurable threshold, T1 builds pseudo-random strings from the selected keys.
- When vowels are available, generation favors pronounceable patterns (consonant-vowel mixes).

### Explicit-content guard
- **Every** string is checked against a blocklist before use, whether generated, bundled, imported or fetched.
- The check covers **substrings** and common **leetspeak/symbol substitutions** (e.g. `@`→`a`, `1`→`i`, `$`→`s`).
- A string that fails is thrown away and replaced.

### Per target type
- **T2:** characters are sampled from the selected keys, with **extra weight on the player's most-missed keys** (from local stats).
- **T3 (post-MVP):** phrases come from a bundled phrase/sentence list filtered the same way, or are built from matching words.
- **T4 (post-MVP):** misspellings are made by applying swap, drop, duplicate or replace operations to matching words.

### Optional vocabulary fetch (post-MVP)
- The **player** starts it from settings, and only while online.
- The request asks only for words. It sends no identifiers, cookies or player data.
- Fetched words go through the same filters and are cached locally.
- The game **never depends** on this feature.

---

## 7. Platform & Tech

| Area | Choice |
|---|---|
| Language / build | **TypeScript + Vite** |
| Play-field rendering | **PixiJS** (WebGL, with Canvas fallback) |
| Menus, settings, keyboard picker | Plain DOM/HTML/CSS |
| Offline | **PWA**: a service worker precaches every asset (code, word lists, fonts, art, audio) |
| i18n | Translation layer (`t()`), per-locale message files and content packs, data-driven keyboard layouts (§11) |
| Testing | **Vitest** for game logic and content generation |
| Target devices | Desktop browsers with a physical keyboard. Mobile is out of scope. |

### Architecture notes
- **Fixed-timestep** game loop.
- Game logic (state, spawning, input matching, difficulty, content generation) is **separate from rendering**, so it can be unit tested without a canvas.
- Runtime makes no CDN calls. Everything is bundled.

---

## 8. Persistence

- **All state stays on the device.**
  - **IndexedDB** holds profiles, campaign progress, key presets, imported or cached words, and per-key stats.
  - **localStorage** holds small UI settings (volume, font size and so on).
- The save schema is **versioned**, with forward migrations.
- **Export and import** a save as a JSON file, for backups and moving between machines.

---

## 9. Privacy (Hard Requirement)

- **No** analytics, telemetry, crash reporting, ads, tracking pixels or third-party scripts.
- **No** network requests except the optional vocabulary fetch the player starts (§6).
- Per-key accuracy stats exist only for in-game adaptation and display, and **never leave the device**.
- A strict **Content Security Policy** is enforced.
- When hosted, the host's own access logs are disclosed in a privacy note (§12).

---

## 10. Accessibility & Comfort

- Pause at any time.
- Adjustable font size.
- Colorblind-safe palette.
- Reduced-motion mode.
- Volume controls and a mute toggle.

---

## 11. Internationalization (Future-Ready)

English is the only language at launch, but the game is built so new languages can be added later without refactoring.

### UI text
- No hard-coded user-facing strings. All UI text goes through a translation function (e.g. `t('menu.start')`) backed by per-locale message files (`src/i18n/en.json`).
- Use ICU-style messages for plurals and interpolation. Format numbers and dates with `Intl`.
- The locale is chosen in settings and saved locally. It defaults to the browser language when supported and falls back to English.
- Layouts must allow for longer translated strings, and right-to-left support should not be ruled out (use CSS logical properties).

### Content (typing material)
- Word lists, phrase lists and blocklists are **per-locale content packs** (e.g. `content/en/words.json`, `content/en/blocklist.json`), not one global list.
- Content generation (§6) treats characters as Unicode grapheme clusters, not bytes or UTF-16 units, so accented and non-Latin characters work.
- The explicit-content guard runs against the active locale's blocklist (and its substitution rules).

### Keyboard layouts
- Keyboard layouts are **data**, not code: each layout is a definition file describing rows, keys and the characters each key produces (plain, Shift, and later AltGr/dead keys).
- US QWERTY ships first. Other layouts (Dvorak, Colemak, AZERTY, QWERTZ, …) can be added as new layout files.
- Locale and keyboard layout are **independent** settings (e.g. English words on a Dvorak layout).

### MVP scope
- Only English and US QWERTY ship. The MVP still builds the structure: the `t()` layer, locale-keyed content folders and a layout definition format.

---

## 12. Licensing & Distribution

Inkling is **open source** and will be **publicly hosted** as a static web app.

### Licenses
| What | License | Notes |
|---|---|---|
| Source code | **MIT** (default; GPL-3.0 is the alternative if forks must stay open) | `LICENSE` at the repo root |
| Original art & audio | **CC-BY-4.0** (proposed) | Licensed separately from the code |
| Word & phrase lists | Must allow redistribution | e.g. ENABLE (public domain) or SCOWL-derived lists (permissive) |
| Profanity blocklist | Must allow redistribution | Or write and maintain our own |
| Fonts | SIL OFL or similar | e.g. Atkinson Hyperlegible |
| Third-party sounds/art | CC0 or CC-BY only | |

- Every third-party asset is listed with its source and license in **`CREDITS.md`**.
- No asset is added to the repo without a confirmed redistributable license.

### Hosting
- A static host with free HTTPS: **GitHub Pages** (default), Cloudflare Pages or Netlify.
- HTTPS is required for the service worker and PWA install.
- Vite's `base` setting must match the deploy path (e.g. `/inkling/` on GitHub Pages).
- The host must not inject analytics or third-party scripts.
- The same build must also work fully offline after first load, and locally through `vite preview`.

### Privacy on a hosted site
- The game collects nothing (§9). However, the **host keeps standard server access logs** (e.g. IP addresses), which are outside the game's control.
- Publish a short **privacy note** in the README and on the site that explains this, along with what the optional word fetch sends (§6).
- The CSP `connect-src` allows only the game's own origin, plus the one vocabulary API if that feature is enabled.

### Project & community
- `README.md` (pitch, how to play, how to run locally, privacy note), `LICENSE`, `CREDITS.md`, `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.
- **CI (GitHub Actions):** typecheck, lint and test on every PR. Deploy to the host on every push to `main`.
- **Good first contributions:** translations, keyboard layout files and word/phrase content packs (§11). These need contribution guidelines covering format, licensing and the blocklist check.

### Naming
- Local folder: `~/projects/inkling`.
- Use a distinctive public identifier (repo or site name), e.g. `inkling-type` or *Inkling: Type Case*, to avoid confusion with similarly named games (see DESIGN.md §9).
- Do a trademark search before any commercial use.

---

## 13. Milestones

| # | Milestone | Scope |
|---|---|---|
| 1 | **Scaffold** | Vite + TS + PixiJS, fixed-timestep loop, one target moving across the screen, `LICENSE`, CI (typecheck/lint/test) |
| 2 | **Core loop (T2)** | Character targets, targeting, collision/damage, scoring |
| 3 | **T1 + word pool** | Bundled list, key filtering, fallback generator, explicit-content guard |
| 4 | **Progression** | Config-driven waves/levels/difficulty, campaign difficulty select |
| 5 | **Key-selection UI** | Interactive keyboard, regions, presets |
| 6 | **Persistence + PWA + deploy** | IndexedDB saves, export/import, offline service worker, auto-deploy to the static host, privacy note |
| 7 | **Polish** | Summary screens, per-key stats, accessibility settings, i18n string audit |
| 8 | **Post-MVP** | T3 phrases (Backspace), T4 corrections (arrows), optional vocabulary fetch, additional locales and keyboard layouts |

---

## 14. Open Questions / TODO

- [x] **Theme, art direction and audio.** See [DESIGN.md](DESIGN.md) (Inkwell direction). Name: **Inkling**.
- [ ] Health or lives? (DESIGN.md proposes an ink-reservoir health meter.) Does game-over restart the level or the campaign?
- [ ] Which additional locales and keyboard layouts to add first (§11)?
- [x] Word-list source: SCOWL levels 10–50 (via `wordlist-english`) plus the LDNOOBW blocklist. See CREDITS.md.
- [x] Vocabulary API: Datamuse (`api.datamuse.com/words?ml=<topic>`). No key needed, CORS-enabled, sends only the topic. See PRIVACY.md.
- [ ] Confirm the code license (MIT vs GPL-3.0) and the art/audio license.
- [ ] Pick the public repo/site name (§12). Host: GitHub Pages via `.github/workflows/deploy.yml` (any static host works).
- [ ] An endless or practice mode alongside the campaign?

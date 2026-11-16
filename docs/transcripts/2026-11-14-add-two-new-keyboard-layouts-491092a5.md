# Add two new keyboard layouts

Claude Code session started 2026-11-14. 2 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> Task (from the session that started this one):
> Background (from the session that started this one):
> Inkling is an offline-first, open-source browser typing game (TypeScript + Vite + PixiJS). Follow `CLAUDE.md`:
> - Game rules live in `src/core/`, free of DOM and PixiJS, with tests beside them.
> - Every user-facing string goes through `t()` with an entry in `src/i18n/en.ts`.
> - Tuning numbers go in `src/core/config.ts`.
> - No network requests.
> - Changing the save format means bumping the version and adding a migration.
> - Work on a `feat/` branch; when merging into `main`, fast-forward only, then delete the branch with `git branch -d`.
>
> The previous session just shipped milestone M15 (commit `c34334c` on `main`, not yet pushed to origin):
> - Game feel.
> - Mistake penalties and ink recovery.
> - Five abilities (Paperweight on ↑/1, Highlighter on ↓/2, Blotter on Enter/3).
> - Tutorial briefings.
> - The Caveat display font.
> - Save version 7.
>
> The ability shortcuts 1/2/3 only fire when the digit isn't one of the player's practice keys, so check they still behave on layouts whose digit row differs (for example AZERTY needs Shift for digits). Extra layouts were left as future work in M8.
>
> The user has a git stash for a parked custom-domain change: leave it alone. At the end of the milestone, `npm run snapshots -- m16` and `-- latest` update the gallery in `docs/progression/README.md`.
>
> Task:
> Add support for at least two new keyboard layouts to Inkling, alongside the existing US QWERTY. Ask the user which two before building: likely candidates are Dvorak, Colemak, UK QWERTY, German QWERTZ and French AZERTY. Each choice has different consequences for the Apprentice course and for characters outside a–z.
>
> Start by reading `docs/REQUIREMENTS.md` §11 (Internationalization) and `src/content/layouts/us-qwerty.ts` (`US_QWERTY`, `findKey`, and the key/hand/finger data). Then trace everything that assumes US QWERTY:
> - `src/main.ts`: `const layout = US_QWERTY`.
> - `src/core/keySelection.ts`: `builtInPresets(layout)` and `apprenticePreset`.
> - The Type Case keyboard in `src/ui/typeCase.ts`.
> - The hands guide in `src/render/handsArt.ts`.
> - The chapter intro card in `src/render/overlay.ts`, which uses `findKey(US_QWERTY, …)` for finger hints.
> - The Apprentice key order in `src/core/campaign.ts` (`LESSONS`, `SPACE_CHAPTER`, home row F/J first), which is QWERTY-specific and probably needs a per-layout lesson order.
> - Word and drip content built from keys in `src/content/`.
>
> Done means:
> - The player can choose a layout, and the choice is remembered. Decide whether it belongs per player in the save (that means a `SAVE_VERSION` bump to 8 plus a migration in `src/storage/schema.ts`) or in device Settings. Recommend one to the user.
> - The Type Case, hands guide, finger hints, presets and the Apprentice course all follow the chosen layout.
> - Typing works, since input is matched on `event.key`.
> - Unit tests are added for the layout data and lesson orders.
> - `npm run check` and `npm run build` pass, and the game is checked in the browser on each layout.
>
> Work on a `feat/` branch and don't commit unless asked.
>
> Shared notes folder for this group of sessions (outside the repo; read siblings' notes there, leave hand-over notes or large findings there instead of pasting them into messages): /Users/[removed]/Library/Application Support/Claude/side-session-notes/local_4e99b989-7090-4515-9e6b-d1930a78bf7b

<details><summary>7 tool calls</summary>

- **Shell:** List source dirs and find QWERTY references

  ```bash
  ls "/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_4e99b989-7090-4515-9e6b-d1930a78bf7b" 2>/dev/null; ls src/content src/content/layouts src/core src/ui src/render src/storage; grep -rn "US_QWERTY\|findKey\|us-qwerty" src --include=*.ts | grep -v "\.test\." ; grep -n "^## \|^### " docs/REQUIREMENTS.md | head -60
  ```
- **Shell:** Find layout usages and read i18n requirements

  ```bash
  grep -rn "US_QWERTY\|findKey\|us-qwerty\|layouts/" src | grep -v "\.test\.ts" ; sed -n 178,202p docs/REQUIREMENTS.md; cat src/content/layouts/types.ts; wc -l src/content/layouts/us-qwerty.ts src/core/campaign.ts src/core/keySelection.ts src/ui/typeCase.ts src/render/handsArt.ts src/render/overlay.ts src/main.ts src/storage/schema.ts src/ui/settingsDialog.ts
  ```
- **Read** `src/content/layouts/us-qwerty.ts`
- **Read** `src/core/campaign.ts`
- **Read** `src/core/keySelection.ts`
- **Shell:** Find consumers of lesson and layout helpers

  ```bash
  grep -rn "apprenticeKeys\|newKeysFor\|LESSONS\|SPACE_CHAPTER\|APPRENTICE_CHAPTERS\|apprenticePreset\|builtInPresets\|HOME_ROW_LESSON\|layoutChars\|orderedSelection\|regionChars\|\blayout\b" src --include="*.ts" | grep -v "\.test\.ts" | grep -v "^src/core/campaign.ts\|^src/core/keySelection.ts"
  ```
- **Shell:** Read save schema and ability shortcut handling

  ```bash
  sed -n 1,120p src/storage/schema.ts; grep -n "SAVE_VERSION\|function migrate\|version" src/storage/schema.ts | head -40; grep -rn "Digit1\|'1'\|ArrowUp\|abilityKey\|practiceKeys\|isPracticeKey" src/main.ts src/core/abilities.ts src/core/input.ts src/core/config.ts | head -30
  ```

</details>

### 🤖 Claude

Still mapping the US-QWERTY assumptions (save schema, ability shortcuts, Type Case, hands guide) before asking which layouts.

<details><summary>1 tool call</summary>

- **Shell:** Read key handler, intro card, settings storage

  ```bash
  sed -n 740,800p src/main.ts; sed -n 125,160p src/render/overlay.ts; grep -n "keyLabel\|ROW_OFFSET\|code\b\|\.code" src/ui/typeCase.ts src/render/handsArt.ts src/render/hud.ts | head; ls src/ui; grep -n "Settings\b\|interface Settings\|localStorage" src/ui/settingsDialog.ts src/storage/store.ts | head -20
  ```

</details>

### ❓ Claude asked

- Which keyboard layouts should Inkling add alongside US QWERTY? (Pick at least two.) Dvorak and Colemak use only the US symbols, so they mainly need a new Apprentice key order. UK QWERTY keeps the US lessons and changes a few symbols (£, @ and " swapped, # key). German QWERTZ and French AZERTY bring umlauts or accents, dead keys (^ ´ ¨) that need special handling, and AZERTY needs Shift for digits, which changes the 1/2/3 ability shortcuts.
  - Dvorak (Recommended)
  - Colemak (Recommended)
  - UK QWERTY
  - German QWERTZ / French AZERTY
- Where should the chosen keyboard layout be remembered?
  - Per player save (Recommended)
  - Device Settings

**Answer:** Your questions have been answered: "Which keyboard layouts should Inkling add alongside US QWERTY? (Pick at least two.) Dvorak and Colemak use only the US symbols, so they mainly need a new Apprentice key order. UK QWERTY keeps the US lessons and changes a few symbols (£, @ and " swapped, # key). German QWERTZ and French AZERTY bring umlauts or accents, dead keys (^ ´ ¨) that need special handling, and AZERTY needs Shift for digits, which changes the 1/2/3 ability shortcuts."="Dvorak (Recommended),Colemak (Recommended)", "Where should the chosen keyboard layout be remembered?"="Per player save (Recommended)". You can now continue with these answers in mind.

<details><summary>8 tool calls</summary>

- **Asked questions** (shown above)
- **Shell:** Search for remaining QWERTY assumptions

  ```bash
  sed -n 1,120p src/render/handsArt.ts | grep -n "Key[A-Z]\|home\|HOME\|'f'\|'j'\|Semicolon" ; grep -n "Key[A-Z]\|bump\|'f'\|'j'\|home" src/ui/typeCase.ts src/render/overlay.ts src/content/generator.ts src/content/contentSource.ts | head -20; grep -n "DEFAULT_KEYS" -r src | head; grep -n "layout\|Keyboard" src/i18n/en.ts | head; grep -n "keys\b\|keys:" src/storage/profiles.ts | head
  ```
- **Shell:** Read settings dialog, hands art home, main setup

  ```bash
  sed -n 1,72p src/ui/settingsDialog.ts; sed -n 100,166p src/ui/settingsDialog.ts; grep -n "tutorials\|openSettings" src/main.ts | head; sed -n 40,115p src/render/handsArt.ts; sed -n 60,110p src/main.ts
  ```
- **Shell:** Check world creation, player switching, preset strings

  ```bash
  sed -n 300,375p src/core/world.ts; grep -n "switchPlayer\|location.reload\|players.activate\|createWorld\|startNotebook(" src/main.ts | head; grep -n "preset\.\|typeCase.keyboard\|settings.tips'" src/i18n/en.ts | head -20; sed -n 395,420p src/main.ts
  ```
- **Read** `src/ui/typeCase.ts`
- **Shell:** Check key suggestion order and tests using lessons

  ```bash
  grep -n "suggestNextKeys" -A25 src/core/mastery.ts | head -40; grep -rn "LESSONS\|apprenticeKeys\|SPACE_CHAPTER\|newKeysFor" src --include="*.test.ts" | cut -d: -f1 | sort | uniq -c
  ```
- **Shell:** Find LESSON_ORDER in mastery

  ```bash
  grep -n "LESSON_ORDER" -B3 -A3 src/core/mastery.ts | head -20; grep -n "settings.tips\b\|'settings\.\w*': " src/i18n/en.ts | head -5
  ```
- **Wrote** `/Users/[removed]/.claude/plans/task-from-the-session-valiant-haven.md`

</details>

<details><summary><strong>📋 Plan for approval</strong></summary>

# M16: Dvorak and Colemak keyboard layouts

## Context
Inkling only knows US QWERTY. `docs/REQUIREMENTS.md` §11 says layouts are data files and that Dvorak, Colemak and others can be added later. The user chose **Dvorak and Colemak**, with the choice stored **per player in the save** (save version 8). Both layouts use the same physical ANSI keys and the same symbols as US QWERTY. Typing works on `event.key`, so the OS layout already produces the right characters. What is QWERTY-specific is everything that *teaches* or *draws* keys: the Type Case, the hands guide, the finger hints, the presets, the "suggest next keys" order and the Apprentice key order.

Branch: `feat/m16-layouts`. Do not commit unless asked. Leave the git stash alone.

## 1. Layout data (`src/content/layouts/`)
- `types.ts`: add to `LayoutKey` an optional `home?: true` (the 8 resting keys). Add to `KeyboardLayout`:
  - `lessons: readonly (readonly string[])[]`, the Apprentice key order (moved out of campaign.ts).
  - A `LayoutId` union: `'us-qwerty' | 'dvorak' | 'colemak'`.
- New `ansi.ts`: one builder for the shared ANSI geometry. It holds the physical `code`, hand and finger for each position (taken from today's `US_QWERTY`), the home flags on A S D F / J K L ;, and the space bar. Each layout passes per-row base and shift strings. Letters get their uppercase automatically. `findKey` moves here.
- `us-qwerty.ts`: rebuild with the builder. Lessons = today's `LESSONS` (`fj`, `d k s l a ; g h`, space, `e i r u t y o w n m c v b x p q z`).
- `dvorak.ts`: rows `` `1234567890[] `` / `',.pyfgcrl/=\` / `aoeuidhtns-` / `;qjkxbmwvz`, with US Dvorak shifts.
  - Lessons: `u h`, then `e t o n a s i d`, space, then `r l c g p y f m w b v k . j x q z`.
  - Dvorak has no non-letter on the home row, so `.` stands in for QWERTY's `;` to keep 27 chapters.
- `colemak.ts`: rows: number row as US / `qwfpgjluy;[]\` / `arstdhneio'` / `zxcvbkm,./`.
  - Lessons: `t n`, then `s e r i a o d h`, space, then `u l f p y w g m c v b k ; j x q z`.
- New `index.ts`: `LAYOUTS`, `LAYOUT_IDS`, `DEFAULT_LAYOUT_ID = 'us-qwerty'`, `layoutById(id)` (falls back to US), `isLayoutId`.
- The home-row pattern is the same in all three: index pair, middle, ring, pinky, stretch. So `APPRENTICE_CHAPTERS` stays 27 and stars and unlocks stay valid when a player switches.

## 2. Core rules take a layout
- `src/core/campaign.ts`:
  - `LESSONS` becomes `lessonsFor(layout)`.
  - `apprenticeKeys(layout, chapter)` and `newKeysFor(layout, chapter)` take the layout.
  - `SPACE_CHAPTER` and `APPRENTICE_CHAPTERS` stay constants, enforced by tests on every layout.
- `src/core/keySelection.ts`:
  - `HOME_ROW_LESSON` becomes `homeRowLesson(layout)`: the first 10 base keys of row 2.
  - The `homeRowEI` preset becomes "home row + first two keys after space". QWERTY gives E I, as now; Dvorak gives R L; Colemak gives U L.
  - Its name is interpolated as `'Home row + {keys}'`.
  - `apprenticePreset(layout, …)`.
  - New `remapSelection(oldLayout, newLayout, keys, unlocked)`: if the keys match a built-in or Apprentice preset of the old layout, return the same preset on the new layout. Otherwise keep the keys as they are.
- `src/core/mastery.ts`: `LESSON_ORDER` becomes `lessonOrder(layout)`, which is the flattened lessons minus space, then the rest of rows 1–3. `suggestNextKeys` takes it.
- `src/core/world.ts`: add `layout: KeyboardLayout` to `World` (option in `WorldOptions`, default US). `useApprenticeKeys` passes `world.layout`.
- `src/core/config.ts`: `DEFAULT_KEYS` stays the QWERTY home row, because new players start on US.

## 3. Save (version 8)
`src/storage/schema.ts`:
- `SAVE_VERSION = 8`, with `layout: LayoutId` on `SaveData` and in the default save.
- Validation falls back to US for unknown ids.
- `MIGRATIONS[7]` adds `layout: 'us-qwerty'`.
- Add tests in `schema.test.ts` for the migration from version 7 and for an unknown id.

## 4. Rendering and UI follow the player's layout
- `src/render/handsArt.ts`: replace the `HOME` char map with the layout's `home` keys, looked up by hand and finger.
- `src/render/overlay.ts`: `findKey(world.layout, …)` for finger hints, `handsArt(world.layout, …)`, `newKeysFor(world.layout, …)`.
- `src/render/hud.ts`: `newKeysFor(world.layout, …)`.
- `src/ui/typeCase.ts`: already takes `layout`. Pass `lessonOrder(layout)` to `suggestNextKeys`. Show the layout name in the keyboard group label.
- `src/ui/settingsDialog.ts`: new per-player "Keyboard layout" radio group, next to Tips (optional `layout?: { current; onPick }`). The help text explains:
  - It must match the layout set on the computer.
  - Apprentice chapters will teach this layout's keys.
- `src/main.ts`:
  - `layout` becomes `() => layoutById(store.data.layout)`. Presets are computed from it on each call.
  - Set `game.layout` at startup, in `switchPlayer` and on layout change.
  - On layout change: write `save.layout`, run `remapSelection` on `save.keys`, then refresh the menu.
  - Chapter list in the menu: `lessonsFor(layout())`.
  - Ability digits 1/2/3 are unchanged: Dvorak and Colemak keep digits unshifted.
- `src/i18n/en.ts`: `layout.us-qwerty` / `layout.dvorak` / `layout.colemak`, `settings.layout`, `settings.layout.help`, and the new `preset.homeRowPlus`.

## 5. Tests
- New `src/content/layouts/layouts.test.ts`, run over every layout:
  - Every row has the same codes as US, and the codes are unique.
  - The 26 letters each appear once, with uppercase shifts.
  - There are exactly 8 home keys, one per finger.
  - US output equals the old hand-written data (fingers, codes, chars).
  - Spot checks: Dvorak `findKey('e')` = left middle, KeyD. Colemak `findKey('t')` = left index, KeyF.
- Lesson orders, for every layout:
  - 27 chapters, and the first has 2 keys, both home index keys.
  - Chapters 1–8 cover the rest of the home row.
  - Chapter 9 is space.
  - No duplicates, and every key exists on the layout.
  - All 26 letters are covered.
- Update `campaign.test.ts`, `keySelection.test.ts` (per-layout presets, `remapSelection`), mastery, `handsArt.test.ts` (Dvorak/Colemak render) and `progress.test.ts` for the new signatures.

## 6. Docs and milestone
- REQUIREMENTS §11 / §13b: Dvorak and Colemak have shipped.
- Add CREDITS only if needed (none expected).
- At the end: `npm run snapshots -- m16` and `-- latest`, plus a section in `docs/progression/README.md`.

## Verification
- `npm run check` and `npm run build` pass.
- `npm run dev`, then in the browser for each layout (US, Dvorak, Colemak):
  - Switch it in Settings. Check that the Type Case keyboard and presets change, and that the hands guide rests on the right home keys.
  - Start Apprentice. The chapter 1 intro card shows the right keys (F J / U H / T N) and finger hints. The chapter list shows the new order.
  - Type in the game with simulated `keydown` events for the layout's characters.
  - Switch player and confirm each keeps its own layout.
  - Reload and confirm the choice persists.
- Load an old v7 save export and check that it migrates to US QWERTY.


</details>

<details><summary>5 tool calls</summary>

- **Presented the plan** (shown above)
- **Shell:** Create feature branch and check existing layout tests

  ```bash
  git switch -c feat/m16-layouts && cat src/content/layouts/*.test.ts 2>/dev/null | head -5; grep -rn "us-qwerty\|findKey" src --include="*.test.ts" | head
  ```
- **Shell:** Write layout builder, US/Dvorak/Colemak data and registry

  ```bash
  cd /Users/[removed]/projects/inkling/src/content/layouts && python3 - <<'EOF'
  import re
  p='types.ts'
  s=open(p).read()
  s=s.replace("""  /** Relative key width (1 = a normal key). */
    width?: number;
  }""","""  /** Relative key width (1 = a normal key). */
    width?: number;
    /** A home key, where a finger rests (one per finger, thumbs aside). */
    home?: true;
  }

  /** The layouts Inkling knows. */
  export type LayoutId = 'us-qwerty' | 'dvorak' | 'colemak';""")
  s=s.replace("""export interface KeyboardLayout {
    id: string;
    /** Rows from the number row down to the space bar. */
    rows: LayoutKe
  … (6633 more characters)
  ```
- **Shell:** Make campaign lessons per layout

  ```bash
  python3 - <<'EOF'
  p='src/core/campaign.ts'
  s=open(p).read()
  s=s.replace("""import type { Grade } from './grade';""","""import type { KeyboardLayout } from '../content/layouts/types';
  import { US_QWERTY } from '../content/layouts/us-qwerty';
  import type { Grade } from './grade';""")
  old=s[s.index("export interface Lesson {"):s.index("/** Chapter (0-based) where space is learned. */")]
  new='''export interface Lesson {
    /** Keys introduced in this chapter. */
    newKeys: string[];
  }

  /**
   * A layout's lessons (its `lessons` data). A beginner starts with the two
   * home keys under the index finger
  … (2034 more characters)
  ```
- **Shell:** Typecheck to find broken call sites

  ```bash
  sed -i '' 's|  const keys = apprenticeKeys(US_QWERTY, chapter).length;|  // Every layout teaches the same number of keys per chapter.\n  const keys = apprenticeKeys(US_QWERTY, chapter).length;|' src/core/campaign.ts && npx tsc --noEmit -p . 2>&1 | head -40
  ```

</details>

### 🤖 Claude

Now keySelection, mastery and world.

<details><summary>6 tool calls</summary>

- **Shell:** Per-layout presets, remap and lesson order

  ```bash
  python3 - <<'EOF'
  p='src/core/keySelection.ts'
  s=open(p).read()
  s=s.replace("""/** Home keys plus G and H, as taught in a first typing lesson. */
  export const HOME_ROW_LESSON = 'asdfghjkl;';

  /** Common lessons, roughly in the order a typing course teaches them. */
  export function builtInPresets(layout: KeyboardLayout): Preset[] {
    const r = (id: RegionId) => regionChars(layout, id);
    const preset = (id: string, chars: string[]): Preset => ({ id, chars: [...new Set(chars)], builtIn: true });
    return [
      // The classic first lesson: the home row without the far-right quote key.
      preset(
  … (3580 more characters)
  ```
- **Shell:** Wire nameParams, world layout, i18n preset

  ```bash
  python3 - <<'EOF'
  p='src/core/mastery.ts'
  s=open(p).read()
  s=s.replace("import { GAME_CONFIG } from './config';","import type { KeyboardLayout } from '../content/layouts/types';\nimport { GAME_CONFIG } from './config';")
  s=s.replace("""/**
   * Order letters are usually taught in: home keys, then reaching out a row
   * at a time, common letters first.
   */""","""/**
   * Order keys are usually taught in on a layout: the Apprentice course, then
   * the rest of the letter block (the first ten keys of each letter row).
   */""")
  s=s.replace("const rest = layout.rows.slice(1, 4).flat().map((key) => key.bas
  … (2683 more characters)
  ```
- **Shell:** Add layout to World and typecheck

  ```bash
  grep -n "^  mode: GameMode" -B2 src/core/world.ts && python3 - <<'EOF'
  p='src/core/world.ts'
  s=open(p).read()
  s=s.replace("import { createContentSource, type ContentSource } from '../content/contentSource';","import { createContentSource, type ContentSource } from '../content/contentSource';\nimport type { KeyboardLayout } from '../content/layouts/types';\nimport { US_QWERTY } from '../content/layouts/us-qwerty';",1)
  i=s.index("  mode: GameMode;")
  j=s.index("\n",i)
  s=s[:j+1]+"  /** The player's keyboard layout: which keys the Apprentice teaches, and where they are. */\n  layout: KeyboardLayout
  … (98 more characters)
  ```
- **Shell:** Read save defaults, validation and migrations

  ```bash
  sed -n 125,150p src/storage/schema.ts; sed -n 230,340p src/storage/schema.ts
  ```
- **Shell:** Add layout to save, version 8 migration

  ```bash
  python3 - <<'EOF'
  p='src/storage/schema.ts'
  s=open(p).read()
  s=s.replace("export const SAVE_VERSION = 7;","export const SAVE_VERSION = 8;")
  s=s.replace("import { DEFAULT_CONTENT_LEVEL, isContentLevel, type ContentLevel } from '../content/contentFilter';","import { DEFAULT_CONTENT_LEVEL, isContentLevel, type ContentLevel } from '../content/contentFilter';\nimport { DEFAULT_LAYOUT_ID, isLayoutId } from '../content/layouts';\nimport type { LayoutId } from '../content/layouts/types';")
  s=s.replace("""  tutorials: Tutorials;
  }

  export interface Tutorials {""","""  tutorials: Tutorials;
    /** The ke
  … (979 more characters)
  ```
- **Shell:** Read hands art home key usage

  ```bash
  grep -n "HOME\b\|HOME\[" src/render/handsArt.ts; sed -n 116,215p src/render/handsArt.ts
  ```

</details>

### 🤖 Claude

Layout data, core rules and save v8 are in; now wiring the hands guide, overlay, HUD, Settings and main.ts.

<details><summary>6 tool calls</summary>

- **Shell:** Make hands guide, overlay and HUD use the world layout

  ```bash
  python3 - <<'EOF'
  p='src/render/handsArt.ts'
  s=open(p).read()
  s=s.replace("""/** Home-row key under each finger. */
  const HOME: Record<Side, Record<Digit, string>> = {
    left: { pinky: 'a', ring: 's', middle: 'd', index: 'f' },
    right: { pinky: ';', ring: 'l', middle: 'k', index: 'j' },
  };
  ""","")
  s=s.replace("""  const homeOf = (ch: string) => {
      const key = all.find((k) => k.base === ch);
      return key ? centers.get(key.code) : undefined;
    };
    const f = homeOf('f') ?? { x: 4.75, y: 2.1 };
    const j = homeOf('j') ?? { x: 7.75, y: 2.1 };""","""  // Where each finger rests: the layout's 
  … (1409 more characters)
  ```
- **Shell:** Check hands art cache key in overlay

  ```bash
  sed -n 375,392p src/render/overlay.ts; grep -n "handsKey" src/render/overlay.ts
  ```
- **Shell:** Read main.ts sections to wire layout

  ```bash
  sed -n 170,200p src/main.ts; echo ----; sed -n 250,275p src/main.ts; echo ----; sed -n 305,345p src/main.ts; echo ----; sed -n 430,470p src/main.ts; echo ----; sed -n 525,545p src/main.ts; grep -n "useKeys = \|const useKeys\|refreshMenu\|menu.refresh\|showMenu" src/main.ts | head
  ```
- **Shell:** Read applySave in main.ts

  ```bash
  sed -n 410,432p src/main.ts; grep -n "const applySave" -A20 src/main.ts | head -25
  ```
- **Shell:** Wire layout through main.ts, Settings and strings

  ```bash
  python3 - <<'EOF'
  p='src/main.ts'
  s=open(p).read()
  def rep(a,b,count=1):
      global s
      assert s.count(a)>=1, a
      s=s.replace(a,b) if count==0 else s.replace(a,b,count)
  rep("import { US_QWERTY } from './content/layouts/us-qwerty';","import { layoutById } from './content/layouts';\nimport type { LayoutId } from './content/layouts/types';")
  rep("import { apprenticePreset, builtInPresets, matchingPreset, type Preset } from './core/keySelection';","import { apprenticePreset, builtInPresets, matchingPreset, remapSelection, type Preset } from './core/keySelection';")
  rep("import { APPRENTICE_CHA
  … (3973 more characters)
  ```
- **Shell:** Find layoutHands callers

  ```bash
  grep -n "layoutHands\|hands: keys\|content.hands\|hands?:" src/render/overlay.ts
  ```

</details>

### 🤖 Claude

Fixing the last type error: the overlay's hands picture needs the layout passed in with its keys.

<details><summary>3 tool calls</summary>

- **Shell:** Pass layout with hands keys in overlay

  ```bash
  sed -n 42,45p src/render/overlay.ts && python3 - <<'EOF'
  p='src/render/overlay.ts'
  s=open(p).read()
  s=s.replace("        hands: keys,","        hands: { layout: world.layout, keys },")
  s=s.replace("const handsHeight = this.layoutHands(content.hands ?? []);","const handsHeight = this.layoutHands(content.hands?.layout ?? world.layout, content.hands?.keys ?? []);" )
  s=s.replace("private layoutHands(keys: string[]): number {","private layoutHands(layout: KeyboardLayout, keys: string[]): number {")
  s=s.replace("handsArt(world.layout, keys,","handsArt(layout, keys,")
  s=s.replace("  hands?: string[];
  … (353 more characters)
  ```
- **Shell:** Check scope and typecheck

  ```bash
  sed -n 318,328p src/render/overlay.ts; npx tsc --noEmit -p . 2>&1 | grep -v "\.test\.ts" | head
  ```
- **Shell:** Use layout id in overlay content, typecheck all

  ```bash
  python3 - <<'EOF'
  p='src/render/overlay.ts'
  s=open(p).read()
  s=s.replace("        hands: { layout: world.layout, keys },","        hands: { layout: world.layout.id, keys },")
  s=s.replace("const handsHeight = this.layoutHands(content.hands?.layout ?? world.layout, content.hands?.keys ?? []);","const handsHeight = this.layoutHands(layoutById(content.hands?.layout ?? world.layout.id), content.hands?.keys ?? []);")
  s=s.replace("""  /** Keys to show on the hands-on-keyboard picture (an Apprentice chapter's new keys). */
    hands?: { layout: KeyboardLayout; keys: string[] };""","""  /** Keys to show 
  … (474 more characters)
  ```

</details>

### 🤖 Claude

Now the tests: updating existing ones and adding layout data tests.

<details><summary>6 tool calls</summary>

- **Shell:** Read tests needing signature updates

  ```bash
  sed -n 1,45p src/core/campaign.test.ts; sed -n 78,82p src/core/campaign.test.ts; sed -n 40,62p src/core/mastery.test.ts; sed -n 115,121p src/storage/progress.test.ts; grep -n "homeRowEI\|HOME_ROW\|apprenticePreset" src/core/keySelection.test.ts
  ```
- **Shell:** Update tests for new signatures and run suite

  ```bash
  python3 - <<'EOF'
  import re
  p='src/core/campaign.test.ts'
  s=open(p).read()
  s=s.replace("  LESSONS,\n","")
  s=s.replace("import { createContentSource } from '../content/contentSource';","import { createContentSource } from '../content/contentSource';\nimport { US_QWERTY } from '../content/layouts';")
  s=s.replace("const all = LESSONS.flatMap((l) => l.newKeys);","const all = US_QWERTY.lessons.flat();")
  s=s.replace("toHaveLength(LESSONS.flatMap((l) => l.newKeys).length)","toHaveLength(US_QWERTY.lessons.flat().length)")
  s=re.sub(r"apprenticeKeys\((?!US_QWERTY)", "apprenticeKeys(US_QWERTY, ", s)
  s=re
  … (1261 more characters)
  ```
- **Shell:** Add layout data and lesson order tests

  ```bash
  python3 - <<'EOF'
  p='src/storage/progress.test.ts'
  s=open(p).read()
  s=s.replace("import { US_QWERTY } from '../content/layouts';\nimport { describe, expect, it } from 'vitest';\nimport { createContentSource } from '../content/contentSource';","import { describe, expect, it } from 'vitest';\nimport { createContentSource } from '../content/contentSource';\nimport { US_QWERTY } from '../content/layouts';",1)
  open(p,'w').write(s)
  EOF
  cat > src/content/layouts/layouts.test.ts <<'EOF'
  import { describe, expect, it } from 'vitest';
  import { APPRENTICE_CHAPTERS, SPACE_CHAPTER } from '../../core/campai
  … (5384 more characters)
  ```
- **Shell:** Read preset tests

  ```bash
  sed -n 18,25p src/core/keySelection.test.ts; sed -n 75,96p src/core/keySelection.test.ts
  ```
- **Shell:** Add per-layout preset and remap tests

  ```bash
  python3 - <<'EOF'
  p='src/core/keySelection.test.ts'
  s=open(p).read()
  s=s.replace("import { US_QWERTY } from '../content/layouts/us-qwerty';","import { COLEMAK, DVORAK, LAYOUTS, US_QWERTY } from '../content/layouts';")
  s=s.replace("""import {
    REGIONS,
    builtInPresets,""","""import {
    REGIONS,
    apprenticePreset,
    builtInPresets,
    homeRowLesson,""")
  s=s.replace("  regionState,\n  toggleRegion,\n} from './keySelection';","  regionState,\n  remapSelection,\n  toggleRegion,\n} from './keySelection';")
  s=s.replace("""describe('US QWERTY layout', () => {
    it('produces all 95 printable ASCII ch
  … (2745 more characters)
  ```
- **Shell:** Read hands art tests

  ```bash
  sed -n 1,48p src/render/handsArt.test.ts
  ```

</details>

### 🤖 Claude

Adding the last tests (hands guide on Dvorak/Colemak, v7→v8 migration), then running the full check.

<details><summary>6 tool calls</summary>

- **Shell:** Add hands/schema tests and run full check

  ```bash
  python3 - <<'EOF'
  p='src/render/handsArt.test.ts'
  s=open(p).read()
  s=s.replace("import { US_QWERTY } from '../content/layouts/us-qwerty';","import { COLEMAK, DVORAK, US_QWERTY } from '../content/layouts';")
  s=s.replace("""  it('adds the number row only when a key needs it', () => {""","""  it('rests the hands on the home keys of the layout in use', () => {
      const arrows = (layout: typeof US_QWERTY, keys: string[]) => count(handsArt(layout, keys, colors).svg, 'stroke-dasharray');
      expect(arrows(DVORAK, ['u', 'h', 'e', 's'])).toBe(0);
      expect(arrows(DVORAK, ['f'])).toBe(1);
      expect(a
  … (1206 more characters)
  ```
- **Shell:** Find Type Case header and keyboard placement

  ```bash
  grep -n "keyboard,\|tc-intro\|h('h2'\|typeCase.intro\|typeCase.title" src/ui/typeCase.ts; grep -n "'typeCase\.\(intro\|title\|keyboard\)" src/i18n/en.ts
  ```
- **Shell:** Show layout name in Type Case; recheck

  ```bash
  grep -n "'typeCase.legend'" src/i18n/en.ts && python3 - <<'EOF'
  p='src/ui/typeCase.ts'
  s=open(p).read()
  s=s.replace("{ className: 'tc-keyboard', role: 'group', 'aria-label': t('typeCase.keyboard') },","{ className: 'tc-keyboard', role: 'group', 'aria-label': t('typeCase.keyboard', { layout: t(`layout.${layout.id}` as MessageKey) }) },")
  s=s.replace("h('div', {}, [keyboard, h('p', { className: 'tc-legend' }, [t('typeCase.legend')])]),","h('div', {}, [\n      keyboard,\n      h('p', { className: 'tc-legend' }, [t('typeCase.legend'), ' ', t('typeCase.layoutNote', { layout: t(`layout.${layout.id}`
  … (374 more characters)
  ```
- **preview_start** `{"name":"inkling-dev"}`
- **computer** `{"action":"screenshot","scale":0.5}`
- **find** `{"query":"Practice"}`

</details>

### 🤖 Claude

Checking the game in the browser now: opening Settings to switch layout.

<details><summary>8 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].map(b=>b.innerText.replace(/\\n/g,' | ')).slice(0,12)"}`
- **browser_batch** `{"actions":[{"name":"find","input":{"query":"Settings button"}}]}`
- **computer** `{"action":"left_click","coordinate":[302,466],"action_summary":"Opens the Settings dialog"}`
- **find** `{"query":"Keyboard layout"}`
- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Settings').click(); await new Promise(r=>setTimeout(r,300)); [...document.querySelectorAll('.settings legend')].map(l=>l.textContent)"}`
- **javascript_tool** `{"action":"javascript_exec","text":"const fs=[...document.querySelectorAll('.settings fieldset')].find(f=>f.querySelector('legend').textContent==='Keyboard layout'); fs.scrollIntoView(); [...fs.querySelectorAll('label')].find(l=>l.textContent==='Dvorak').querySelector('input').click(); [...fs.queryS
… (52 more characters)`
- **computer** `{"action":"screenshot"}`
- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('.settings button')].find(b=>b.innerText.trim()==='Done').click(); await new Promise(r=>setTimeout(r,200)); const p=[...document.querySelectorAll('button')].find(b=>b.innerText.startsWith('Practice')); const txt=p.innerText; p.click()
… (146 more characters)`

</details>

### 🤖 Claude

Dvorak switch works and the home-row preset carried over. Opening the Type Case to check the keyboard picture.

<details><summary>8 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Change keys').click(); await new Promise(r=>setTimeout(r,300)); [document.querySelector('.tc-keyboard').getAttribute('aria-label'), [...document.querySelectorAll('.tc-row')].map(r=>[...r.queryS
… (328 more characters)`
- **computer** `{"action":"screenshot"}`
- **javascript_tool** `{"action":"javascript_exec","text":"const fire=(k)=>{for(const t of ['keydown','keyup']) (document.activeElement||document.body).dispatchEvent(new KeyboardEvent(t,{key:k,bubbles:true}))}; fire('Escape'); await new Promise(r=>setTimeout(r,200)); [...document.querySelectorAll('button')].find(b=>b.inne
… (317 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].find(b=>b.innerText.startsWith('Chapter 1')).click(); await new Promise(r=>setTimeout(r,800)); document.querySelectorAll('.dialog').length"}`
- **computer** `{"action":"screenshot"}`
- **Shell:** Check applySave and game.layout assignments

  ```bash
  grep -n "const applySave\|applySave()" src/main.ts; grep -n "game = \|game\.layout" src/main.ts
  ```
- **Shell:** Read SaveStore.update

  ```bash
  grep -n "update(" -A12 src/storage/store.ts | head -30
  ```
- **Shell:** Look for world resets

  ```bash
  grep -rn "createWorld\|Object.assign(world\|Object.assign(game" src --include=*.ts | grep -v test
  ```

</details>

### 🤖 Claude

Found a bug: the chapter-1 card still showed F/J on Dvorak. Tracking down where the world's layout gets reset.

<details><summary>7 tool calls</summary>

- **Shell:** Look for world resets

  ```bash
  grep -rn "createWorld\|Object.assign(world\|Object.assign(game" src | grep -v "\.test\.ts"
  ```
- **Shell:** Read world reset function

  ```bash
  sed -n 418,445p src/core/world.ts
  ```
- **Shell:** Keep layout across world resets; find bumps string

  ```bash
  python3 - <<'EOF'
  p='src/core/world.ts'
  s=open(p).read()
  s=s.replace("""    makeContent: world.makeContent,
      abilities: world.abilities,
    });
    fresh.nextId""","""    makeContent: world.makeContent,
      abilities: world.abilities,
      layout: world.layout,
    });
    fresh.nextId""")
  open(p,'w').write(s)
  EOF
  grep -n "'overlay.intro.first'" src/i18n/en.ts; grep -n "overlay.intro.first" src/render/overlay.ts
  ```
- **Shell:** Name each layout's bump keys on the first intro card

  ```bash
  python3 - <<'EOF'
  p='src/i18n/en.ts'
  s=open(p).read()
  s=s.replace("'overlay.intro.first': 'Rest your fingers on the home row (f and j have little bumps), then press the keys as they come.',","'overlay.intro.first': 'Rest your fingers on the home row ({left} and {right} have little bumps), then press the keys as they come.',")
  open(p,'w').write(s)
  p='src/render/overlay.ts'
  s=open(p).read()
  s=s.replace("t(world.page.chapter === 0 ? 'overlay.intro.first' : 'overlay.intro.body'),","""world.page.chapter === 0 ? t('overlay.intro.first', bumpKeys(world.layout)) : t('overlay.intro.body'),""")
  s=s.repl
  … (528 more characters)
  ```
- **Shell:** Read startApprentice test

  ```bash
  sed -n 68,86p src/core/campaign.test.ts
  ```
- **Shell:** Add regression test and run check

  ```bash
  python3 - <<'EOF'
  p='src/core/campaign.test.ts'
  s=open(p).read()
  s=s.replace("""describe('Apprentice flow', () => {
  ""","""describe('Apprentice flow', () => {
    it("teaches the player's own layout, and keeps it across notebooks", () => {
      const world = apprenticeWorld();
      world.layout = DVORAK;
      startApprentice(world, 0, 'normal');
      expect(world.layout).toBe(DVORAK);
      expect(world.keys).toEqual(['u', 'h']);
      startApprentice(world, 10, 'normal');
      expect(world.keys).toEqual(apprenticeKeys(DVORAK, 10));
      expect(world.keys).toContain('r');
    });

  """,1)
  s=s.replace("import
  … (193 more characters)
  ```
- **Shell:** Confirm startApprentice resets the world

  ```bash
  grep -n "export function startApprentice" -A6 src/core/input.ts | grep -n resetWorld
  ```

</details>

### 🤖 Claude

Fix is in and covered by a test. Rechecking the Dvorak chapter-1 card in the browser.

<details><summary>9 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"location.reload(); await new Promise(r=>setTimeout(r,2500)); [...document.querySelectorAll('button')].find(b=>b.innerText.startsWith('Apprentice')).click(); await new Promise(r=>setTimeout(r,300)); [...document.querySelectorAll('button')].find(b=>b.innerText.start
… (76 more characters)`
- **computer** `{"action":"screenshot"}`
- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].find(b=>b.innerText.startsWith('Apprentice')).click(); await new Promise(r=>setTimeout(r,300)); [...document.querySelectorAll('button')].find(b=>b.innerText.startsWith('Chapter 1')).click(); await new Promise(r=>setTimeout(
… (15 more characters)`
- **computer** `{"action":"screenshot"}`
- **javascript_tool** `{"action":"javascript_exec","text":"const press=(k)=>{window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}))}; press('Enter'); await new Promise(r=>setTimeout(r,1500)); for(let i=0;i<40;i++){press(i%2?'u':'h'); aw
… (48 more characters)`
- **computer** `{"action":"screenshot","scale":0.6}`
- **Shell:** Find hardcoded sample keys in briefing art

  ```bash
  grep -rn "'f'\|\"f\"\|'j'\|sample\|example" src/ui/briefingDialog.ts src/core/mechanics.ts src/ui/art.ts | head -20
  ```
- **Shell:** Find briefing art labels

  ```bash
  grep -rln "briefing" src | grep -v test; grep -n "label\|char\|text" src/ui/briefingDialog.ts | head -20
  ```
- **Shell:** Read briefing dialog art source

  ```bash
  sed -n 1,30p src/ui/briefingDialog.ts; grep -n "openBriefingDialog" -A8 src/main.ts | head -20
  ```

</details>

### 🤖 Claude

The tip card's drip picture shows a generic "f" (it's a creature portrait, not a lesson); leaving that. Now typing on Dvorak.

<details><summary>11 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"const press=(k)=>{const t=document.activeElement&&document.activeElement!==document.body?document.activeElement:window; t.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));t.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}))}; press('Ent
… (193 more characters)`
- **computer** `{"action":"screenshot","scale":0.6}`
- **javascript_tool** `{"action":"javascript_exec","text":"location.reload()"}`
- **javascript_tool** `{"action":"javascript_exec","text":"await new Promise(r=>setTimeout(r,1500)); [...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Settings').click(); await new Promise(r=>setTimeout(r,300)); const fs=[...document.querySelectorAll('.settings fieldset')].find(f=>f.querySelector('leg
… (665 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].find(b=>b.innerText.startsWith('Chapter 1')).click(); await new Promise(r=>setTimeout(r,800)); 'ok'"}`
- **computer** `{"action":"zoom","region":[200,230,600,630],"scale":0.7}`
- **javascript_tool** `{"action":"javascript_exec","text":"const press=(k)=>{const t=document.activeElement&&document.activeElement!==document.body?document.activeElement:window; t.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));t.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}))}; press('Ent
… (138 more characters)`
- **computer** `{"action":"zoom","region":[0,180,800,640],"scale":0.6}`
- **javascript_tool** `{"action":"javascript_exec","text":"location.reload()"}`
- **javascript_tool** `{"action":"javascript_exec","text":"await new Promise(r=>setTimeout(r,1500)); [...document.querySelectorAll('button')].find(b=>b.innerText.includes('Switch player')).click(); await new Promise(r=>setTimeout(r,300)); [...document.querySelectorAll('button,input')].map(b=>(b.innerText||b.placeholder||b
… (31 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Add a player').click(); await new Promise(r=>setTimeout(r,300)); const inp=document.querySelector('input[type=text]'); inp.value='Tester'; inp.dispatchEvent(new Event('input',{bubbles:true})); 
… (84 more characters)`

</details>

### 🤖 Claude

Checking that a second player keeps their own layout (adding a local test player in the dev build).

<details><summary>1 tool call</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Save').click(); await new Promise(r=>setTimeout(r,500)); const btns=[...document.querySelectorAll('button')].map(b=>b.innerText.replace(/\\n/g,' | ')); const t=[...document.querySelectorAll('bu
… (381 more characters)`

</details>

### 🤖 Claude

Tester gets US QWERTY. Switching back to Player 1 to confirm Colemak stuck.

<details><summary>3 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"[...document.querySelectorAll('button')].find(b=>b.innerText.trim()==='Back')?.click(); await new Promise(r=>setTimeout(r,300)); [...document.querySelectorAll('button')].find(b=>b.innerText.includes('Switch player')).click(); await new Promise(r=>setTimeout(r,300)
… (448 more characters)`
- **read_console_messages** `{"onlyErrors":true}`
- **Shell:** Run check and production build

  ```bash
  npm run check 2>&1 | grep -E "passed|failed|error" ; npm run build 2>&1 | tail -6
  ```

</details>

### 🤖 Claude

Check and build pass. Now docs and the milestone snapshots.

<details><summary>6 tool calls</summary>

- **Shell:** Read docs sections and snapshot script

  ```bash
  sed -n 193,202p docs/REQUIREMENTS.md; sed -n 259,275p docs/REQUIREMENTS.md; grep -n "^## \|^### " docs/progression/README.md | tail -15; grep -n '"snapshots"' package.json; ls scripts 2>/dev/null
  ```
- **Shell:** Read progression README and snapshot script setup

  ```bash
  sed -n 1,30p docs/progression/README.md; sed -n 168,215p docs/progression/README.md; sed -n 1,40p scripts/snapshots.ts | grep -n "port\|5173\|preview\|url" 
  ```
- **Shell:** Read snapshot tour steps

  ```bash
  grep -n "TOUR\|name: '" scripts/snapshots.ts | head -40; grep -n "name: 'chapter-intro'" -A25 scripts/snapshots.ts
  ```
- **Shell:** Read snapshot TOUR definition

  ```bash
  sed -n 60,215p scripts/snapshots.ts
  ```
- **Shell:** Add Dvorak steps to the snapshot tour

  ```bash
  python3 - <<'EOF'
  p='scripts/snapshots.ts'
  s=open(p).read()
  s=s.replace("""  { click: 'Settings' }, { shot: 'settings' }, { key: 'Escape' },
  ""","""  { click: 'Settings' }, { shot: 'settings' }, { key: 'Escape' },
    // Another keyboard layout (M16): the Type Case and the first chapter card follow it.
    { click: 'Settings' }, { click: 'Dvorak' }, { eval: SHOW_LAYOUT }, { shot: 'settings-layout' }, { key: 'Escape' },
    { click: 'Practice' }, { click: 'Change keys' }, { shot: 'type-case-dvorak' }, { key: 'Escape' }, { key: 'Escape' },
    { click: 'Apprentice' }, { click: 'Chapter 1' }, { shot: 'ch
  … (732 more characters)
  ```
- **Shell:** Capture M16 milestone snapshots

  ```bash
  npm run snapshots -- m16 2>&1 | tail -30
  ```

</details>

### 🤖 Claude

Snapshots captured; checking the new Dvorak shots and that the later QWERTY ones weren't affected.

<details><summary>8 tool calls</summary>

- **Read** `docs/progression/m16/chapter-intro-dvorak.png`
- **Read** `docs/progression/m16/chapter-intro.png`
- **Read** `docs/progression/m16/settings-layout.png`
- **Shell:** Capture latest snapshots and find README spots

  ```bash
  npm run snapshots -- latest 2>&1 | tail -3; grep -n "latest/" docs/progression/README.md | head -5; grep -n "^## Milestone by milestone\|^### Latest\|^## Latest" docs/progression/README.md
  ```
- **Shell:** Update progression README and REQUIREMENTS

  ```bash
  python3 - <<'EOF'
  p='docs/progression/README.md'
  s=open(p).read()
  s=s.replace("""## Keeping this up to date""","""### M16: Keyboard layouts

  | Settings | Chapter 1 on Dvorak | Type Case on Dvorak |
  |---|---|---|
  | <img src="m16/settings-layout.png" width="260" alt="Settings with a Keyboard layout choice: US QWERTY, Dvorak, Colemak"> | <img src="m16/chapter-intro-dvorak.png" width="260" alt="Dvorak chapter card teaching u and h, hands resting on a o e u and h t n s"> | <img src="m16/type-case-dvorak.png" width="260" alt="Type Case typewriter with Dvorak keys and the Dvorak home row selected"> |
  … (3060 more characters)
  ```
- **Shell:** Keep only snapshots the gallery page uses

  ```bash
  git ls-files --others --exclude-standard docs/progression/latest | xargs rm -f && cd docs/progression/m16 && ls | grep -v -E "^(settings-layout|chapter-intro-dvorak|type-case-dvorak)\.png$" | xargs rm -f && ls && cd ../../.. && git status --short docs | head; ls src/content/layouts
  ```
- **Shell:** Final check and build

  ```bash
  npm run check 2>&1 | grep -E "passed|failed|error|problem"; npm run build 2>&1 | grep -iE "error|built in" | head -3
  ```
- **Shell:** Leave hand-over note in shared notes folder

  ```bash
  cat > "/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_4e99b989-7090-4515-9e6b-d1930a78bf7b/m16-layouts.md" <<'EOF'
  # M16 keyboard layouts (branch feat/m16-layouts, uncommitted)

  - Dvorak + Colemak added beside US QWERTY; layout stored per player in the save (SAVE_VERSION 8, migration 7→8 sets 'us-qwerty').
  - Layout data: src/content/layouts/{ansi,us-qwerty,dvorak,colemak,index}.ts. ansi.ts holds physical codes/fingers/home flags; each layout gives characters + Apprentice `lessons` (27 chapters on every layout).
  - Dvorak lesson 28th key is '.' (no non-letter on i
  … (677 more characters)
  ```

</details>

### 🤖 Claude

I've added Dvorak and Colemak alongside US QWERTY on branch `feat/m16-layouts`. Nothing is committed; your git stash is untouched. `npm run check` (331 tests) and `npm run build` pass.

**What players see**
- **Choosing a layout:** a new "Keyboard layout" choice in Settings, saved per player. That's save version 8; older saves migrate to US QWERTY. It's hidden while a page is in play, so the keys can't change mid-page.
- **The course and screens follow the layout:** the Apprentice course, Type Case keyboard, hands guide, chapter-card finger hints and "bump" keys, presets and "ready to learn" suggestions.
- **Course order:** the first chapter teaches F J on QWERTY, U H on Dvorak and T N on Colemak. Every layout has the same 27 chapters, so stars and progress stay valid when a player switches.
- **Switching keeps presets:** if a player's keys match a preset (e.g. Home row), they become the same preset on the new layout. Custom selections are left as they are.

**Behaviour changes to know about**
- **Dvorak's extra key:** its home row is all letters, so `.` takes the place QWERTY gives `;` to keep 27 chapters.
- **QWERTY suggestions:** "ready to learn" now follows the course order, so after the home row it suggests E I instead of R U.
- **Preset renamed:** "Home row + E I" became "Home row + {keys}" (R L on Dvorak, U L on Colemak).

**Bug fixed during the browser check:** on Dvorak, the chapter-1 card still taught F/J, because starting a notebook rebuilt the game state without the layout. I fixed it and added a test for it.

**Checked in the browser:**
- Switched to Dvorak and Colemak in Settings and saw the Type Case and presets change.
- Saw the chapter cards and chapter list on each layout.
- Typed drips with simulated key presses on Dvorak and Colemak.
- Reloaded and saw the layout stick.
- Added a second player, who started on QWERTY while Player 1 stayed on Colemak. That "Tester" player is still in the dev server's local storage.

**Gallery:** the snapshot tour now also captures a Dvorak Settings, Type Case and chapter-card shot. There's an M16 section in `docs/progression/README.md`, and `latest/` is refreshed. REQUIREMENTS §11, §13b and §14 are updated.

**Not done:**
- **AZERTY, QWERTZ and UK:** not added. These need dead keys and accented letters, and on AZERTY digits need Shift, which affects the 1/2/3 ability shortcuts.
- **Tip-card picture:** the "New on this page" card still shows a generic `f` drip on every layout.

I left a hand-over note in the shared notes folder (`m16-layouts.md`).

## 🧑 Prompt

> commit it and merge into main and then push all

<details><summary>4 tool calls</summary>

- **Shell:** Export the build transcript

  ```bash
  npm run transcript 2>&1 | tail -5; git status --short docs/transcripts | head
  ```
- **Shell:** Scan transcripts for private details

  ```bash
  f="docs/transcripts/2026-11-14-add-two-new-keyboard-layouts-491092a5.md docs/transcripts/2026-11-14-game-look-feel-and-mechanics-1bcd11e0.md docs/transcripts/README.md"; grep -nEio "[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|/Users/[a-z]+|sk-[a-z0-9]{10,}|ghp_[a-z0-9]+|token[=:][^ ]+|philip|pwbrown" $f | sort | uniq -c | head -20; git diff --stat docs/transcripts
  ```
- **Shell:** Scan transcripts for private details

  ```bash
  grep -nEio "[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|/Users/[a-z]+|sk-[a-z0-9]{10,}|ghp_[a-z0-9]+|philip|pwbrown|Application Support" docs/transcripts/2026-11-14-add-two-new-keyboard-layouts-491092a5.md docs/transcripts/2026-11-14-game-look-feel-and-mechanics-1bcd11e0.md docs/transcripts/README.md | sort | uniq -c | head -20
  ```
- **Shell:** Inspect flagged transcript lines

  ```bash
  sed -n '54p;61p;902p' docs/transcripts/2026-11-14-add-two-new-keyboard-layouts-491092a5.md | cut -c1-300; sed -n '1436,1455p' docs/transcripts/2026-11-14-game-look-feel-and-mechanics-1bcd11e0.md | cut -c1-300
  ```

</details>

### 🤖 Claude

Transcript scan is clean: home paths are already redacted, and the only `pwbrown` hits are the project's public GitHub URL. Committing.

<details><summary>3 tool calls</summary>

- **Shell:** Commit M16 on the feature branch

  ```bash
  git add -A src scripts docs && git status --short | grep -v "^[AM] \|^R " ; git commit -q -F - <<'EOF'
  M16: Dvorak and Colemak keyboard layouts

  - Layouts built from one table of ANSI keys and fingering; US QWERTY, Dvorak and Colemak each give their characters and Apprentice key order
  - Keyboard layout chosen per player in Settings and kept in the save (save version 8, older saves start on US QWERTY)
  - Apprentice course, Type Case, hands guide, finger hints, presets and key suggestions follow the player's layout
  - Switching layout carries a preset selection over to the same preset on the new l
  … (291 more characters)
  ```
- **Shell:** Fast-forward main and delete the branch

  ```bash
  git status --short | head -3; git switch main && git merge --ff-only feat/m16-layouts && git branch -d feat/m16-layouts && git log --oneline -3 && git status -sb | head -1
  ```
- **Shell:** Push main to origin

  ```bash
  git push origin main 2>&1 | tail -3 && git status -sb | head -1 && git stash list
  ```

</details>

### 🤖 Claude

M16 is committed as `f88d488` (Dvorak and Colemak keyboard layouts) and pushed. `origin/main` was still at `dc358f4`, so this push sent both M15 (`c34334c`) and M16.

- **Transcript:** I ran `npm run transcript` and checked it before committing. Home folder paths are already removed. The only username that appears is the project's public GitHub URL, and there are no emails or tokens.
- **Merge:** fast-forward only into `main`, then I deleted `feat/m16-layouts` with `git branch -d`.
- **Not pushed:** the custom-domain stash (inklingtyping.com) is still parked, since it's meant to wait until the DNS works.

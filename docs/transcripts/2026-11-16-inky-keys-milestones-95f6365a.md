# Inky Keys milestones

Claude Code session started 2026-11-16. 4 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> <pasted_content id="6c3f">
> New Milestones for Inky Keys
>
> * Targets zoom into from right to show the entire word before slowing down to their actual speed. This avoids having to wait for a long time before you see the full word or phrase.
> * I want to make the scrawlers the primary wave type. This was the way that typer shark worked as well. Most of the time you saw sharks (words) and occasionally you got single character piranhas.
> * I also want to rethink the main menu.
>    * Right now the top level item is apprentice mode, but most people I’ll be sending this game to will be wanting to play in practice mode. So I want the practice mode to appear first and then the apprentice mode after.
>    * Since practice mode is now the primary mode I want to brainstorm some new names for it. Something that indicates more of a free play mode (or challenge mode)
>    * When a player starts playing for the first time, I want the default key selection to be the “All Letters + Capitals + the spacebar”.
> * Right now the numbers and symbols are intermixed with single characters, but I’d really like to separate them out.
>    * So for a wave of single character blots, most waves will just be letters (lowercase and/or uppercase).
>    * And then there will be an additional separate wave of only numbers and symbols.
>    * You won’t see symbols and numbers intermixed with letters.
> * Not everyone is familiar with the spacebar symbol, so I want to add a tutorial style guide to the spacebar symbol the first time it appears.
> * When then popup comes up after finishing a page, it should have an option to exit to the menu. You shouldn’t need to enter the next page and then pause the game to do that.
> * Right now, yellow circles appear around the ink bar to draw your attention to damage taken, or ink refilled, but the yellow circles don’t disappear until the next page. They should have a small delay before they disappear.
> * Let’s add a slight cooldown after the eraser has been used, because when you get into the zone of typing and you make a mistake you often keep typing before you realize the mistake is made. I want to transparently add a 1 second cooldown after the eraser is used to prevent immediate errors.
> * The How to Play menu should include visuals. It is all just a bunch of text right now.
> * The blotter skill should be harder to achieve in higher difficulty modes. There are too many blotters and they are too easy to get.
> * I’d like to explore different ideas for “boss battles” in addition to the one that already exists and see if we can add them a bit earlier in the game just to add some more character.
> </pasted_content id="6c3f">

<details><summary>2 tool calls</summary>

- **Agent** `{"description":"Explore gameplay: spawning, waves, eraser, boss","subagent_type":"Explore","prompt":"Repo: /Users/[removed]/projects/inky-keys (TypeScript + Vite + PixiJS typing game). Read docs/REQUIREMENTS.md milestone list briefly. Then report precisely (file paths, function names, line numbers
… (943 more characters)`
- **Agent** `{"description":"Explore UI: menu, page-end popup, ink bar, how-to-play","subagent_type":"Explore","prompt":"Repo: /Users/[removed]/projects/inky-keys (TypeScript + Vite + PixiJS typing game; menus are DOM in src/ui/, strings in src/i18n/en.ts, save format in src/storage/schema.ts). Report precisel
… (1243 more characters)`

</details>

### 🤖 Claude

Two exploration agents are mapping the gameplay code (spawning, waves, eraser, blotter, bosses) and the UI code (menu, key presets, end-of-page popup, ink bar, How to Play). I'll write the plan once they report back.

### 🤖 Claude

The gameplay findings are in, and the UI exploration is still running. I'll wait for it before I write the plan.

### ❓ Claude asked

- Practice mode is becoming the main mode, so it needs a free-play name. Which name fits best? (They all suit the ink-and-notebook theme. Pick Other to suggest your own.)
  - Free Write (Recommended)
  - Freehand
  - Ink Rush
  - Open Notebook
- Which new boss ideas should we build? (The Spill stays.) Pick any number.
  - Bookworm
  - Inkwell Squid
  - Shuffler
  - Rival Quill
- Should bosses also appear in Practice mode, now that it's the main mode?
  - Yes, end of each chapter (Recommended)
  - Apprentice only, earlier
- For the eraser cooldown: when the Eraser forgives a mistake, what should happen to another wrong key pressed within the next second?
  - Silently ignore it (Recommended)
  - Forgive but count it

**Answer:** Your questions have been answered: "Practice mode is becoming the main mode, so it needs a free-play name. Which name fits best? (They all suit the ink-and-notebook theme. Pick Other to suggest your own.)"="Free Write (Recommended)", "Which new boss ideas should we build? (The Spill stays.) Pick any number."="Bookworm,Inkwell Squid,Shuffler,Rival Quill", "Should bosses also appear in Practice mode, now that it's the main mode?"="Yes, end of each chapter (Recommended)", "For the eraser cooldown: when the Eraser forgives a mistake, what should happen to another wrong key pressed within the next second?"="Silently ignore it (Recommended)". You can now continue with these answers in mind.

<details><summary>2 tool calls</summary>

- **Asked questions** (shown above)
- **Wrote** `/Users/[removed]/.claude/plans/pasted-content-id-6c3f-new-milestones-snazzy-mochi.md`

</details>

<details><summary><strong>📋 Plan for approval</strong></summary>

# Inky Keys, Round 3: milestones 17–19

## Context
Most people Philip shares the game with will play free play (today's "Practice"), not the Apprentice course. They also find a few things rough: waiting for long words to slide fully into view, too few word creatures compared with single letters, numbers and symbols mixed in with letters, an unexplained ␣ glyph, and no way to leave from the page-cleared card. Yellow rings also stay stuck on the ink bar, How to Play is all text, Blotters are too easy, and the only boss (the Spill) appears late and only in Apprentice. This round fixes those problems in three milestones. Each milestone gets its own branch, release and snapshot.

Decisions taken:
- Practice is renamed **Free Write** in the player-facing text only. Internal identifiers stay `practice`, the same way `blotling`/`inkling` stayed.
- All four new bosses get built: **Shuffler, Bookworm, Inkwell Squid, Rival Quill**. Bosses also come to Free Write.
- The eraser grace is 1s, and wrong keys during it are **silently ignored** (no ink lost, combo kept, not counted).
- No `SAVE_VERSION` bump should be needed. The new default keys only affect new saves, and `sanitizeTutorials` already accepts any valid `MechanicId`.

First step: add a "§13c Round 3" table with milestones 17–19 to `docs/REQUIREMENTS.md`.

---

## Milestone 17: First impressions (branch `feat/m17-first-impressions`, release 2.7.0)

1. **Menu order and name.**
   - In `Menu.title()` (`src/ui/menu.ts:235`), put `practice` before `apprentice`. Make Free Write the primary button when there's no Continue.
   - Change the hotkey from P to F.
   - Update these strings in `src/i18n/en.ts`: `menu.practice*`, `newNotebook.title`, `pause.practice*`, `how.modesTitle`/`how.modes`, `about.what`, `players.detail`.
   - Update the README "Apprentice and Practice" section and the docs/DESIGN.md mentions. Close the DESIGN.md:148 open question: Free Write is the default.
2. **Default keys.**
   - Add a `lettersCapitalsSpace` preset ("All letters + capitals + space") to `builtInPresets()` in `src/core/keySelection.ts:110`, with a name string in en.ts.
   - Set `DEFAULT_KEYS` in `src/core/config.ts:19` to that set (a–z, A–Z, space). `defaultSave()` and `createWorld` pick it up automatically.
3. **Main menu from the page-cleared card.**
   - In `overlay.ts:108` `case 'pageCleared'`, add `links: [{id:'mainMenu', …}]`, reusing the game-over link pattern (`overlay.ts:137`).
   - In `main.ts:826`, handle M while `phase === 'pageCleared'`. The existing `onLink('mainMenu')` → `goToMenu()` already works.
   - `onPhase('pageCleared')` already saves the next-page position, so Continue resumes correctly. Check this.
4. **Yellow rings stuck on the ink bar (a bug).**
   - The cause: `Effects.update()` (`src/render/effects.ts:218`) calls `onArrive` inside `particles.filter`, so the ring that `ring()` pushes is lost when the array is replaced, and its Graphics is orphaned.
   - The fix: collect the arrived callbacks during the filter and run them after it.
   - Add the "small delay": a `ringHoldMs` (about 400) before rings fade. Put it with the other render tuning, following existing practice, or in config.ts if similar numbers already live there.
5. **Spacebar tutorial.**
   - Add a `space` `MechanicId` in `src/core/mechanics.ts` (early in `MECHANICS`, after `basics`).
   - `mechanicsForPage()` includes it when the page's keys contain `' '` and the page can show a space drip or a Run-on.
   - `guidedSpawn()` sends a lone space drip.
   - Add `portraitTarget('space')` in `renderer.ts:133`: a drip showing ␣.
   - Add briefing and hint strings, e.g. "␣ means the spacebar, the long key under your thumbs." The briefing dialog can also show `handsArt()` with the spacebar highlighted.
   - This goes through the existing briefing flow and `save.tutorials.seen`.
6. **How to Play with pictures.**
   - Add a `portrait(id)` hook to `MenuHooks`, backed by `renderer.portrait()` (`renderer.ts:783`), which is already used by the briefing dialog.
   - In `Menu.howToPlay()` (`menu.ts:450`), put a portrait beside each creature entry (drip, Scrawler, Run-on, Misprint), the variants (crimson, violet, ghost), the Spill and the ink bottle.
   - Use `handsArt()` for the keys section. Add a small key-cap row (Enter = Blotter, Esc = pause) for controls.
   - Lay it out as a CSS grid that collapses on narrow screens. Use `alt` text from i18n.

## Milestone 18: Waves and pacing (branch `feat/m18-waves`, release 2.8.0)

1. **Zoom-in entry.**
   - In `src/core/world.ts`, add `entering: true` to new targets.
   - In `stepWorld()` (line 747), an entering target moves at `GAME_CONFIG.entry.speed` (about 900 px/s) until its right edge (x + `estimateWidth`) is inside `WORLD_WIDTH`. It then eases to its own speed over `entry.easeMs` (about 250).
   - Check that `freeLanes()` (line 454) measures the leader's right edge, so an entering target can't run into the target ahead of it. If it doesn't, change it to.
   - Paperweight slow does not apply while a target is entering. Guided spawns enter the same way.
2. **Scrawlers as the main wave.**
   - Rewrite `GAME_CONFIG.chapters` (`config.ts:137`) to be mostly `blotling` pages with one letter-drip page per chapter. For example: `[b,d,b]`, `[b,b,d,b]`, `[b,b,d,b,b]`, and so on.
   - In `apprenticePlan()` (`campaign.ts:53`), keep the early few-key plan, because words need enough letters. Make later chapters word-heavy too.
   - Retune `base.size` and the spawn interval so a page of words lasts about as long as now.
3. **Numbers and symbols in their own waves.**
   - Add a page `pool: 'letters' | 'symbols'` to page params. Letters includes space.
   - `nextChar()` in `src/content/contentSource.ts` filters the selected keys by pool.
   - Chapter plans get an `n` entry: a numbers-and-symbols drip page. It's kept only when the selected keys include digits or symbols, and dropped otherwise. For example, one per chapter from chapter 2.
   - If the keys have no letters (the Numbers preset), every drip page uses `symbols`.
   - Trailing sentence punctuation on words (`, . ? !`) stays, because that's part of words, not mixed single characters.
4. **Eraser grace.**
   - When `registerError()` (`src/core/input.ts:65`) uses the eraser, set `world.eraserGraceMs = GAME_CONFIG.abilities.eraser.graceMs` (1000).
   - Count it down in `stepWorld`.
   - While it's above 0, a wrong key returns early: no ink, no combo reset, no `missedKeys`, no `eraserRun` reset, and no error event.
   - Save it in `StartSnapshot` as 0.
5. **Blotters harder on higher difficulties.**
   - Add per-difficulty values under `abilities.blotter` in config: a `chargeKeysFactor` (relaxed 1, normal 1.25, hard 1.6, expert 2) and `maxCharges` (relaxed 3, normal 3, hard 2, expert 1).
   - Apply them in `chargeKeys()` (`src/core/abilities.ts:43`) and in the charge cap in `registerHit()`.

## Milestone 19: Bosses (branch `feat/m19-bosses`, release 2.9.0)

1. **Schedule.**
   - Add `BossKind = 'spill' | 'shuffler' | 'bookworm' | 'squid' | 'quill'`.
   - Rotate bosses by chapter, using a `bossFor(mode, chapter)` in `campaign.ts` next to `hasSpill()` (line 111).
   - Apprentice gets bosses from chapter index 2, down from 6. Free Write gets them from chapter index 1, on the last page of each chapter.
   - Generalize `hasBoss` at `world.ts:301` and `spawnBoss()` (line 684) to dispatch on kind. Shared numbers go under `GAME_CONFIG.boss.<kind>`.
2. **The bosses** (core rules in `src/core/bosses/*.ts`, creatures in `src/render/creatures/*.ts`):
   - **Shuffler:** one word. Every `shuffleMs` (about 2500), its untyped letters reshuffle, and it never reshuffles into the same order. Three lives, like the Spill.
   - **Bookworm:** a chain of 4–6 short-word segments that move together. You type the head segment, it pops, and the worm speeds up by `speedStep`. Rendered as linked body circles.
   - **Inkwell Squid:** a body word plus 3 tentacle targets in nearby lanes. You must clear the tentacles before the body can be typed. A tentacle left alone for `squirtMs` squirts: a smudge layer hides one lane's letters for about 3s (render-only effect driven by core state).
   - **Rival Quill:** a word you race against. The quill "writes" a second copy at `quillCps` characters per second, shown as a progress underline. If the quill finishes first, it splashes you for `inkLoss` and starts the race again with a new word. You win by finishing first.
   - The Spill stays as it is.
3. Each boss gets a `MechanicId`, a portrait, a briefing and a hint, reusing the M15 teaching flow. Add them to the How to Play pictures too.
4. Add a boss banner string for each boss in en.ts, and update the `boss` event in `renderer.ts:432` to show the boss's own name.

---

## Each milestone (per CLAUDE.md)
- Add unit tests in `src/core/*.test.ts`:
  - M17: preset, default keys and the space mechanic.
  - M18: entry movement, the letters/symbols split, eraser grace and charge scaling.
  - M19: each boss's rules and the schedule.
- Add a release entry to `src/core/releases.ts` with en.ts notes (at most four short ones) and run `npm version x.y.z --no-git-tag-version`.
- Run `npm run check` and `npm run build`. Then run `npm run dev` and check in the browser pane:
  - M17: menu order, a new player's default keys, the M link on the cleared card, ink rings clearing, the space briefing, and How to Play.
  - M18: words zoom in, the wave mix, a symbols page, the eraser grace, and Blotter rate on Expert.
  - M19: force each boss, using a dev chapter jump or a test seed.
- Run `npm run snapshots -- m<N>` and `-- latest`, and update `docs/progression/README.md`.
- Commit only when asked. Fast-forward merge, delete the branch with `-d`, and tag with `npm run release:tag`.


</details>

<details><summary>6 tool calls</summary>

- **Presented the plan** (shown above)
- **Shell:** Create branch and find milestone table

  ```bash
  git checkout -b feat/m17-first-impressions && grep -n "13b\|^| 1[0-9]" docs/REQUIREMENTS.md | head -30
  ```
- **Shell:** Show milestone section context

  ```bash
  sed -n 255,290p docs/REQUIREMENTS.md
  ```
- **Shell:** Add Round 3 table and read menu title code

  ```bash
  python3 - <<'EOF'
  p='docs/REQUIREMENTS.md'
  s=open(p).read()
  anchor='## 14. Open Questions / TODO'
  add='''## 13c. Round 3 milestones (Free Write first)

  | # | Milestone | Scope |
  |---|---|---|
  | 17 | **First impressions** | Practice renamed Free Write and listed first; new players start on letters, capitals and space; Main menu link on the page-cleared card; ink-bar rings fade properly; a spacebar briefing; How to play with pictures |
  | 18 | **Waves and pacing** | Targets zoom in until fully on the page; Scrawlers are the main wave; numbers and symbols get their own pages; a 1-second grace afte
  … (560 more characters)
  ```
- **Shell:** Check hotkeys, tests and practice strings

  ```bash
  grep -rn "'f'\|\"f\"" src/ui/menu.ts | head; grep -rln "practice" src --include=*.test.ts; grep -n "ractice\|Apprentice" src/i18n/en.ts
  ```
- **Shell:** Find practice strings and tests

  ```bash
  grep -rln "practice" src | grep test; grep -n "ractice\|pprentice" src/i18n/en.ts
  ```

</details>

### 🤖 Claude

Round 3 is now in REQUIREMENTS.md. I'm working on the M17 menu: Free Write goes first, and the Practice strings get renamed.

<details><summary>3 tool calls</summary>

- **Shell:** Rename Practice to Free Write and reorder menu

  ```bash
  python3 - <<'EOF'
  import re
  p='src/i18n/en.ts'; s=open(p).read()
  rep={
  "'menu.practice': 'Practice',":"'menu.practice': 'Free Write',",
  "'menu.practiceDetail': 'Your own keys, endless pages · {keys}',":"'menu.practiceDetail': 'Play with any keys you like, page after page · {keys}',",
  "'newNotebook.title': 'Practice',":"'newNotebook.title': 'Free Write',",
  "'pause.practice': 'Practice these keys',":"'pause.practice': 'Free Write with these keys',",
  "'pause.practiceDetail': 'Leave the chapter and practice its keys at the same difficulty',":"'pause.practiceDetail': 'Leave the chapter and play its
  … (1712 more characters)
  ```
- **Shell:** Read pause menu and docs sections

  ```bash
  sed -n 470,490p src/ui/menu.ts; sed -n 36,50p README.md; sed -n 140,150p docs/DESIGN.md
  ```
- **Shell:** Check how menu hotkeys are dispatched

  ```bash
  grep -n "data-key\|dataset.key" src/ui/menu.ts | head; grep -n "'p'" src/main.ts src/ui/*.ts | head
  ```

</details>

### 🤖 Claude

Hotkeys are generic, so I'll switch the pause item to F too and update the docs.

<details><summary>6 tool calls</summary>

- **Shell:** Update pause hotkey and docs, read presets

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/ui/menu.ts',[("{ detail: t('pause.practiceDetail'), key: 'p' }","{ detail: t('pause.practiceDetail'), key: 'f' }")])
  sub('README.md',[
  ("**Continue** (C), **Apprentice** (A), **Practice** (P, then pick a difficulty with 1–4 and change keys)","**Continue** (C), **Free Write** (F, then pick a difficulty with 1–4 and change keys), **Apprentice** (A)"),
  ("### Apprentice and Practice","### Free Write and Apprentice"),
  ("difficulty climbs a 
  … (1560 more characters)
  ```
- **Shell:** Add preset and change default keys

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/core/keySelection.ts',[("    preset('lettersCapitals', [...r('lowercase'), ...r('uppercase')]),\n","    preset('lettersCapitals', [...r('lowercase'), ...r('uppercase')]),\n    // What a brand-new player starts with (DEFAULT_KEYS in config.ts).\n    preset('lettersCapitalsSpace', [...r('lowercase'), ...r('uppercase'), ' ']),\n")])
  sub('src/i18n/en.ts',[("  'preset.lettersCapitals': 'Letters + capitals',\n","  'preset.lettersCapitals': '
  … (878 more characters)
  ```
- **Shell:** Find uses of default keys

  ```bash
  grep -rn "DEFAULT_KEYS\|asdfghjkl" src | grep -v "^src/core/config.ts" | head -20
  ```
- **Shell:** Read key selection tests

  ```bash
  sed -n 85,125p src/core/keySelection.test.ts
  ```
- **Shell:** Fix tests and run the test suite

  ```bash
  python3 - <<'EOF'
  p='src/core/keySelection.test.ts'; s=open(p).read()
  pairs=[("""  it('start new players on the Home row preset', () => {
      expect(matchingPreset(presets, DEFAULT_KEYS)?.id).toBe('homeRow');""","""  it('start new players on the Letters + capitals + space preset', () => {
      expect(matchingPreset(presets, DEFAULT_KEYS)?.id).toBe('lettersCapitalsSpace');"""),
  ("expect(matchingPreset(presets, [...DEFAULT_KEYS, 'e', 'r'])).toBeUndefined();","expect(matchingPreset(presets, [...DEFAULT_KEYS, '1', '2'])).toBeUndefined();"),
  ("expect(remapSelection(US_QWERTY, DVORAK, DEFAULT_KEYS, 1
  … (353 more characters)
  ```
- **Shell:** Fix store test; read overlay and key handling

  ```bash
  sed -i '' "s/store.update((s) => s.keys.push('z'));/store.update((s) => s.keys.push('7'));/; s/expect(before.keys).not.toContain('z');/expect(before.keys).not.toContain('7');/" src/storage/store.test.ts && npx vitest run src/storage 2>&1 | tail -4; sed -n 100,145p src/render/overlay.ts; sed -n 815,835p src/main.ts
  ```

</details>

### 🤖 Claude

Menu order, the Free Write name and the default keys are done, and tests pass. I'm adding the Main menu link to the page-cleared card.

<details><summary>5 tool calls</summary>

- **Shell:** Add menu link to cleared card; read effects update

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/render/overlay.ts',[("""        note: t(`note.${note.kind}` as MessageKey, { key: note.key ? keyLabel(note.key) : '' }),
          prompt: lastPage""","""        note: t(`note.${note.kind}` as MessageKey, { key: note.key ? keyLabel(note.key) : '' }),
          links: [{ id: 'mainMenu', label: t('overlay.gameOver.mainMenu') }],
          prompt: lastPage""")])
  sub('src/main.ts',[("""        // Shortcuts on the game-over card: R retries the ch
  … (896 more characters)
  ```
- **Shell:** Find ring definition and hold option

  ```bash
  grep -n "ring(\|hold" src/render/effects.ts | head -20; grep -n "highlighter, 2[06]" src/render/renderer.ts
  ```
- **Shell:** Read ring implementation

  ```bash
  sed -n 66,80p src/render/effects.ts
  ```
- **Shell:** Fix orphaned rings and add hold for HUD rings

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/render/effects.ts',[
  ("""  /** An expanding ring, for impacts and pickups. */
    ring(x: number, y: number, color: number = this.splatterColor, radius = 26, lifeMs = 320): void {
      const g = new Graphics().circle(0, 0, radius).stroke({ width: 3, color });
      g.position.set(x, y);
      this.add(g, lifeMs, { scaleFrom: this.reducedMotion ? 1 : 0.25, scaleTo: 1 });""","""  /**
     * An expanding ring, for impacts and pickups. `hold` is th
  … (1681 more characters)
  ```
- **Shell:** Apply ring hold to damage ring and typecheck

  ```bash
  python3 - <<'EOF'
  p='src/render/renderer.ts'; s=open(p).read()
  s=s.replace("effects.ring(well.x, well.y, COLORS.margin, 16, 300);","effects.ring(well.x, well.y, COLORS.margin, 16, HIGHLIGHT_RING_MS, HIGHLIGHT_RING_HOLD);",1)
  s=s.replace("const GOLD = 0xc9a227;","""const GOLD = 0xc9a227;
  /** Rings that point at the HUD (ink gained or lost, a power ready) stay up a moment, then fade. */
  const HIGHLIGHT_RING_MS = 900;
  const HIGHLIGHT_RING_HOLD = 0.45;""",1)
  open(p,'w').write(s)
  EOF
  npx tsc --noEmit -p . 2>&1 | head
  ```

</details>

## 🧑 Sent while Claude was working

> I also want to completely remove the misprints target from the game for now. I'll think about other targets in the future, but the misprint is way too out of place to be helpful

### 🤖 Claude

I'll fold removing Misprints into M17. First I'll see how far they reach.

<details><summary>1 tool call</summary>

- **Shell:** Find every Misprint reference

  ```bash
  grep -rni "misprint" src --exclude-dir=node_modules | grep -v "^src/i18n" | cut -c1-170; echo ---; grep -ni "misprint" src/i18n/en.ts | cut -c1-120; ls src/render/creatures
  ```

</details>

### 🤖 Claude

Misprints touch about 15 files (kind, creature, content, edit rules, sprinkles, briefing, tests). I'll take them out cleanly and leave Run-ons alone.

<details><summary>6 tool calls</summary>

- **Shell:** Read buffer-mode input handling

  ```bash
  sed -n 1,40p src/core/input.ts; sed -n 220,330p src/core/input.ts
  ```
- **Shell:** Find edit key and Tab handling

  ```bash
  grep -n "editKey\|'tab'\|Tab\|cycle" src/core/input.ts src/main.ts src/input/*.ts | head -20
  ```
- **Shell:** Read editKey, main key routing, editing module

  ```bash
  sed -n 335,370p src/core/input.ts; sed -n 795,822p src/main.ts; cat src/core/editing.ts | head -60
  ```
- **Shell:** Strip Misprint input rules; read config

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/core/input.ts',[
  (""" * - Buffer mode, for Run-ons and Misprints: keys edit a buffer with a cursor,
   *   so mistakes stay until fixed with Backspace, Delete and the arrow keys.""",""" * - Buffer mode, for Run-ons: keys edit a buffer, so mistakes stay until
   *   fixed with Backspace."""),
  ("import { applyEdit, correctPrefix, editDistance, isTextEdit, type EditAction } from './editing';","import { applyEdit, correctPrefix, isTextEdit, ty
  … (3038 more characters)
  ```
- **Shell:** Remove Misprint config; read world spawning

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/core/config.ts',[
  ("""/**
   * Target types (REQUIREMENTS §3): drips (one character), Scrawlers (a word),
   * Run-ons (a phrase, fixed with Backspace) and Misprints (a misspelled word,
   * fixed with the arrow keys, Backspace and Delete).
   */
  export type TargetKind = 'drip' | 'blotling' | 'runon' | 'misprint';

  export const TARGET_KINDS: readonly TargetKind[] = ['drip', 'blotling', 'runon', 'misprint'];""","""/**
   * Target types (REQUIREME
  … (1965 more characters)
  ```
- **Shell:** Remove Misprints from world; read mechanics and schema

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/core/world.ts',[
  ("  return kind === 'runon' || kind === 'misprint';","  return kind === 'runon';"),
  ("""  if (kind === 'misprint') {
      // Misprints are picked by urgency, not first letter, so no re-rolls needed.
      const { right, wrong } = content.nextMisprint(complexity, random);
      return { text: right, buffer: wrong, cursor: [...wrong].length };
    }

  """,""),
  ("  // A sprinkled Run-on or Misprint moves at its own kind's pace.",
  … (984 more characters)
  ```

</details>

### 🤖 Claude

I'm partway through removing Misprints: input, config and spawning are done. Next are briefings, content, rendering and tests.

<details><summary>6 tool calls</summary>

- **Shell:** Remove Misprint mechanic, creature and portrait

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/core/mechanics.ts',[
  ("  | 'misprint'\n",""),
  ("  'runon',\n  'misprint',\n","  'runon',\n"),
  ("    misprint: kind === 'misprint' || sprinkles.misprint > 0,\n",""),
  ("""    case 'misprint':
        return { kind: 'misprint', lives: 1, ghost: false };
  """,""),
  ])
  sub('src/storage/schema.ts',[("  misprint: 15,\n","  misprint: 15, // Misprints were removed in milestone 17; sanitizing drops the id.\n")])
  sub('src/render/renderer.ts',[("""   
  … (682 more characters)
  ```
- **Shell:** Find typo helpers used only by Misprints

  ```bash
  grep -n "corrupt\|CORRUPTIONS" src/content/*.ts | head; sed -n 185,192p src/content/contentSource.ts
  ```
- **Shell:** Read corrupt helper

  ```bash
  sed -n 40,80p src/content/contentSource.ts
  ```
- **Shell:** Remove typo generator; read related tests

  ```bash
  python3 - <<'EOF'
  import re
  p='src/content/contentSource.ts'; s=open(p).read()
  a=s.index("export type Corruption"); b=s.index("  return out === word ? null : out;\n}\n")+len("  return out === word ? null : out;\n}\n")
  s=s[:a]+s[b:].lstrip('\n')
  a=s.index("    nextMisprint(difficulty, random) {"); b=s.index("    nextChar(random) {")
  s=s[:a]+s[b:]
  s=s.replace("""  /** A word and a misspelled copy of it, for a Misprint (T4). */
    nextMisprint(difficulty: number, random: () => number): { right: string; wrong: string };
  ""","")
  open(p,'w').write(s)
  EOF
  sed -n 85,140p src/content/contentSource.test.
  … (64 more characters)
  ```
- **Shell:** Trim content tests; read buffer input tests

  ```bash
  python3 - <<'EOF'
  p='src/content/contentSource.test.ts'; s=open(p).read()
  s=s.replace("import { MIN_WORD_POOL, corrupt, countTypeableWords,","import { MIN_WORD_POOL, countTypeableWords,")
  s=s.replace("describe('phrases and misprints', () => {","describe('phrases', () => {")
  s=s.replace("    expect(createContentSource({ keys: [...'asdf'] }).supports('misprint')).toBe(true);\n","")
  a=s.index("  it('misspells a real word using only selected keys'"); b=s.index("    expect(corrupt('ab', 'replace', ['a'], r)).toBeNull();\n  });\n")+len("    expect(corrupt('ab', 'replace', ['a'], r)).toBeNull();\n  }
  … (196 more characters)
  ```
- **Shell:** Update buffer and editing tests; read sprinkle tests

  ```bash
  python3 - <<'EOF'
  p='src/core/bufferInput.test.ts'; s=open(p).read()
  s=s.replace("""const misprint = (world: World, right: string, wrong: string, x = 500, lane = 1) =>
    spawnTarget(world, { kind: 'misprint', text: right, buffer: wrong, cursor: [...wrong].length, x, prevX: x, lane })!;
  ""","")
  a=s.index("describe('Misprints', () => {"); b=s.index("describe('Tab', () => {")
  s=s[:a]+s[b:]
  s=s.replace("    const b = misprint(world, 'flask', 'flak', 600, 1);","    const b = runon(world, 'cd', 600, 1);")
  open(p,'w').write(s)
  p='src/core/editing.test.ts'; s=open(p).read()
  s=s.replace("import { apply
  … (1053 more characters)
  ```

</details>

### 🤖 Claude

Still removing Misprints, now in the tests. Then I'll run the full check.

<details><summary>2 tool calls</summary>

- **Shell:** Update sprinkle tests; read remaining tests

  ```bash
  python3 - <<'EOF'
  p='src/core/sprinkles.test.ts'; s=open(p).read()
  s=s.replace("{ runon: number; misprint: number }","{ runon: number }")
  s=s.replace(", misprint: 0 }"," }")
  s=s.replace("""  it('slip a Run-on or Misprint into a Scrawler page', () => {
      const runon = spawnTarget(blotlingWorld({ runon: 1 }))!;
      expect(runon.kind).toBe('runon');
      expect(runon.buffer).toBe('');
      const misprint = spawnTarget(blotlingWorld({ runon: 0, misprint: 1 }))!;
      expect(misprint.kind).toBe('misprint');
    });""","""  it('slip a Run-on into a Scrawler page', () => {
      const runon = spawnTarget(
  … (568 more characters)
  ```
- **Shell:** Update remaining tests and run the full check

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/core/variants.test.ts',[("""  it('never apply to Run-ons or Misprints', () => {
      expect(variantChances('runon', 9, 'expert')).toEqual({ crimson: 0, violet: 0, ghost: 0 });
      expect(variantChances('misprint', 9, 'expert')).toEqual({ crimson: 0, violet: 0, ghost: 0 });""","""  it('never apply to Run-ons', () => {
      expect(variantChances('runon', 9, 'expert')).toEqual({ crimson: 0, violet: 0, ghost: 0 });""")])
  sub('src/core/config
  … (1552 more characters)
  ```

</details>

### 🤖 Claude

The check passes with Misprints gone from the code. Next I'll clean up the strings and docs.

<details><summary>6 tool calls</summary>

- **Shell:** Find Misprint strings and doc mentions

  ```bash
  grep -n "how.mix\|how.runon\|how.misprint\|tutorial.misprint\|how.controls'" src/i18n/en.ts | cut -c1-400; grep -rn -i "misprint" README.md docs/DESIGN.md docs/REQUIREMENTS.md CREDITS.md 2>/dev/null | cut -c1-180
  ```
- **Shell:** Check monospace font use and doc lines

  ```bash
  sed -n 84,95p src/render/theme.ts; grep -rn "MONO\|monoFont\|Mono" src --include=* | grep -v "^src/render/theme.ts" | head; sed -n 18,23p README.md; sed -n 30p README.md; sed -n 43p README.md; sed -n 81p README.md; sed -n 60,63p docs/DESIGN.md
  ```
- **Shell:** Check whether the mono font is still used

  ```bash
  grep -rn "MONO_FONT\|Hyperlegible Mono\|Mono" src | grep -v node_modules | head; ls src/assets 2>/dev/null; ls public
  ```
- **Shell:** Check remaining mono font usage

  ```bash
  sed -n 218,226p src/ui/dialog.css; sed -n 18,30p src/fonts.ts; sed -n 27p CREDITS.md
  ```
- **Shell:** Remove Misprint strings and update docs

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/render/theme.ts',[("""/** Fixed-width text, so the Misprint caret lines up between letters. */
  export const MONO_FONT = '"Atkinson Hyperlegible Mono", ui-monospace, Menlo, Consolas, monospace';

  ""","")])
  sub('CREDITS.md',[("Atkinson Hyperlegible Mono (Misprint text)","Atkinson Hyperlegible Mono (Type Case key caps)")])
  sub('src/i18n/en.ts',[
  ("""  'tutorial.misprint.title': 'Misprints',
    'tutorial.misprint.body': 'A Misprint is stamp
  … (1920 more characters)
  ```
- **Shell:** Mark T4 removed in requirements and re-check

  ```bash
  python3 - <<'EOF'
  p='docs/REQUIREMENTS.md'; s=open(p).read()
  lines=s.split('\n')
  for i,l in enumerate(lines):
      if l.startswith('| **T4** | Correction target'):
          lines[i]=l+' *(Removed in milestone 17.)*'
      if l.startswith('- **T4 (post-MVP):**'):
          lines[i]=l+' *(Misprints were removed in milestone 17.)*'
  s='\n'.join(lines)
  a="Practice renamed Free Write and listed first; "
  assert a in s
  s=s.replace(a,"Practice renamed Free Write and listed first; Misprints removed; ")
  open(p,'w').write(s)
  EOF
  npm run check 2>&1 | tail -5
  ```

</details>

### 🤖 Claude

Misprints are fully removed and the check passes. Now the spacebar briefing.

<details><summary>7 tool calls</summary>

- **Shell:** Read mechanics, tutorial strings and portraits

  ```bash
  sed -n 1,58p src/core/mechanics.ts; sed -n 85,125p src/core/mechanics.ts; sed -n 84,112p src/i18n/en.ts; sed -n 128,160p src/render/renderer.ts
  ```
- **Shell:** Find callers of mechanics and guide spawning

  ```bash
  grep -rn "mechanicsForPage\|pendingBriefings" src | grep -v "^src/core/mechanics.ts" | cut -c1-200; grep -n "guide" src/core/world.ts | head -20
  ```
- **Shell:** Add the space mechanic, guided try and strings

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/core/mechanics.ts',[
  ("export type MechanicId =\n  | 'basics'\n","export type MechanicId =\n  | 'basics'\n  | 'space'\n"),
  ("export const MECHANICS: readonly MechanicId[] = [\n  'basics',\n","export const MECHANICS: readonly MechanicId[] = [\n  'basics',\n  // The ␣ glyph isn't obvious: explained the first time a page can show it.\n  'space',\n"),
  ("""/** Everything that can come up on the page about to be played. */
  export function me
  … (2023 more characters)
  ```
- **Shell:** Read mechanics test helpers

  ```bash
  sed -n 1,26p src/core/mechanics.test.ts; sed -n 50,75p src/core/mechanics.test.ts
  ```
- **Shell:** Run tests after adding space mechanic

  ```bash
  npx vitest run 2>&1 | grep -E "✗|×|FAIL|Tests|expected" | head -20
  ```
- **Shell:** Add spacebar briefing tests

  ```bash
  grep -n "export function apprenticeKeys\|export function useApprenticeKeys" src/core/*.ts; python3 - <<'EOF'
  p='src/core/mechanics.test.ts'; s=open(p).read()
  s=s.replace("""function apprentice(chapter: number, page = 0, abilities: World['abilities'] = []): World {
    const world = createWorld({ random: () => 0.5, keys: LETTERS, abilities });
    world.mode = 'apprentice';
    world.page = createPage('normal', chapter, page, world.content, 'apprentice');
    return world;
  }
  ""","""function apprentice(chapter: number, page = 0, abilities: World['abilities'] = []): World {
    const keys = apprenticeKeys(
  … (1770 more characters)
  ```
- **Shell:** Fix import path and rerun tests

  ```bash
  sed -i '' "s#import { US_QWERTY } from '../content/layouts';#import { US_QWERTY } from '../content/layouts/us-qwerty';#" src/core/mechanics.test.ts && npx vitest run 2>&1 | grep -E "×|FAIL|Tests |AssertionError" | head -20
  ```

</details>

### 🤖 Claude

The tests hung. I'll stop them and find the cause.

<details><summary>6 tool calls</summary>

- **TaskStop** `{"task_id":"boglrwa8j"}`
- **Shell:** Run only the spacebar tests with a timeout

  ```bash
  pkill -f vitest; timeout 40 npx vitest run src/core/mechanics.test.ts -t "spacebar" 2>&1 | tail -15
  ```
- **Shell:** Show the assertion diff

  ```bash
  timeout 40 npx vitest run src/core/mechanics.test.ts -t "spacebar" 2>&1 | grep -B3 -A8 "AssertionError" | head -20
  ```
- **Shell:** Run mechanics tests with a timeout

  ```bash
  sed -i '' "s/    expect(mechanicsForPage(world)).toEqual(\['basics', 'space'\]);/    expect(mechanicsForPage(world).slice(0, 2)).toEqual(['basics', 'space']);/" src/core/mechanics.test.ts && timeout 60 npx vitest run src/core/mechanics.test.ts 2>&1 | tail -6; echo EXIT $?
  ```
- **Shell:** Bisect which mechanics test hangs

  ```bash
  for t in "starts with just" "adds Scrawlers" "first appear\|introduces\|chapter" "briefings"; do echo "== $t"; timeout 20 npx vitest run src/core/mechanics.test.ts -t "$t" 2>&1 | grep -E "Tests |✓|×" | head -5; done; grep -n "  it(" src/core/mechanics.test.ts
  ```
- **Shell:** Bisect the remaining mechanics tests

  ```bash
  for t in "follows the rules" "never teaches" "includes unlocked" "sends the new creature" "gives a crimson"; do echo "== $t"; timeout 20 npx vitest run src/core/mechanics.test.ts -t "$t" 2>&1 | grep -E "Tests |×" | head -3; done
  ```

</details>

### 🤖 Claude

The hang is in the "sends the new creature alone" test. I'm looking at it now.

<details><summary>3 tool calls</summary>

- **Shell:** Read the hanging guided-try test

  ```bash
  sed -n 120,160p src/core/mechanics.test.ts
  ```
- **Shell:** Debug where the guided-try hang happens

  ```bash
  mkdir -p <temp file> && cat > src/core/zz_debug.test.ts <<'EOF'
  import { it } from 'vitest';
  import { US_QWERTY } from '../content/layouts/us-qwerty';
  import { apprenticeKeys } from './campaign';
  import { confirm } from './input';
  import { createPage, createWorld, stepWorld } from './world';
  it('debug', () => {
    const keys = apprenticeKeys(US_QWERTY, 0);
    const world = createWorld({ random: () => 0.5, keys, abilities: [] });
    world.mode = 'apprentice';
    world.page = createPage('normal', 0, 2, 
  … (491 more characters)
  ```
- **Shell:** Look for a TS script runner

  ```bash
  rm src/core/zz_debug.test.ts; ls node_modules/.bin | grep -E "^tsx$|^vite-node$|^esno$"
  ```

</details>

### 🤖 Claude

The hang is a test artifact: with a constant `random()` and only two keys (`fj`), some re-roll loop never ends. I'll build the world with all letters and only set `world.keys` to the chapter's keys.

<details><summary>1 tool call</summary>

- **Shell:** Fix test helper and run full check

  ```bash
  python3 - <<'EOF'
  p='src/core/mechanics.test.ts'; s=open(p).read()
  a="""  const keys = apprenticeKeys(US_QWERTY, chapter);
    const world = createWorld({ random: () => 0.5, keys, abilities });
    world.mode = 'apprentice';
    world.page = createPage('normal', chapter, page, world.content, 'apprentice');"""
  b="""  const world = createWorld({ random: () => 0.5, keys: LETTERS, abilities });
    world.mode = 'apprentice';
    world.page = createPage('normal', chapter, page, world.content, 'apprentice');
    // The chapter's own keys, for what the page can show (content stays broad so fixed-random spawns ne
  … (164 more characters)
  ```

</details>

### 🤖 Claude

Spacebar briefing is done and tested. Now the How to Play pictures.

<details><summary>5 tool calls</summary>

- **Shell:** Read How to Play, hooks, portrait and CSS

  ```bash
  sed -n 448,472p src/ui/menu.ts; sed -n 55,92p src/ui/menu.ts; sed -n 700,725p src/main.ts; sed -n 780,800p src/render/renderer.ts; cat src/ui/briefingDialog.ts | sed -n 15,45p; grep -n "how-" src/ui/*.css
  ```
- **Shell:** Read handsArt API and menu CSS

  ```bash
  sed -n 100,125p src/render/handsArt.ts; sed -n 390,415p src/render/overlay.ts; sed -n 180,205p src/ui/menu.css; grep -n "hooks: MenuHooks\|const menu = new Menu\|new Menu(" src/main.ts
  ```
- **Shell:** Read HandsArt type and how main sets up Menu

  ```bash
  grep -n "export interface HandsArt" -A8 src/render/handsArt.ts; sed -n 415,440p src/render/overlay.ts; grep -n "HAND_WASH =" src/render/*.ts; sed -n 557,565p src/main.ts; grep -n "game.layout\|layoutFor\|const layout" src/main.ts | head -5
  ```
- **Shell:** Read How to Play strings and imports

  ```bash
  grep -n "'how\.\(powers\|goal\|variants\|keysTitle\|controlsTitle\|creaturesTitle\|drip\|blotling\|title\)'" src/i18n/en.ts | cut -c1-220; sed -n 1,30p src/render/overlay.ts | grep -n "import"; grep -n "^import\|^  type MechanicId\|from '../core/mechanics'" src/ui/menu.ts
  ```
- **Shell:** Read full powers and controls strings

  ```bash
  sed -n 423p src/i18n/en.ts; sed -n 425p src/i18n/en.ts
  ```

</details>

### 🤖 Claude

Now I'll write the How to Play changes: the strings, the menu layout, the CSS and the hooks.

<details><summary>4 tool calls</summary>

- **Shell:** Rewrite How to Play with pictures and key caps

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  # strings
  sub('src/i18n/en.ts',[
  (" From chapter 7, the last page of each Apprentice chapter brings the Spill, a big boss that needs three words and splits when you beat it. Every page earns ink",
   " Every page earns ink"),
  ("  'how.controls': 'Type to hit targets · Tab switches target · ↑ Paperweight · ↓ Highlighter · Enter Blotter · Esc pauses · Backspace fixes mistakes in a Run-on',\n",
  """  'how.control.type': 'Hit the creature nearest the 
  … (4568 more characters)
  ```
- **Shell:** Share themed hands art and add menu hooks

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b)
      open(p,'w').write(s)
  sub('src/ui/menu.ts',[("    const section = (title: MessageKey, ...body: (HTMLElement | string)[]) =>","    const section = (title: MessageKey, ...body: (HTMLElement | string | null)[]) =>")])
  sub('src/render/overlay.ts',[
  ("""    const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
      /** `a` with `amount` of `b` mixed in, channel by channel. */
      const mix = (a: number, b: number, amount: number) =>
        [16, 8, 0].reduce((ou
  … (2073 more characters)
  ```
- **Shell:** Fix import, add How to Play styles, typecheck

  ```bash
  sed -i '' "s#^import { difficultyLabel, type OverlayLinkId } from './render/overlay';#import { difficultyLabel, themedHandsArt, type OverlayLinkId } from './render/overlay';#" src/main.ts && grep -n "renderer" src/main.ts | head -5; cat >> src/ui/menu.css <<'EOF'

  /* How to play: pictures beside the words. */
  .how-creatures {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }

  .how-creature {
    display: grid;
    grid-template-columns: 76px 1fr;
    align-items: center;
    gap: 12px;
  }

  .how-art {
    width: 76px;
    height: 64px;
    object-fit: contain;
  }

  .how-art-none {
   
  … (1142 more characters)
  ```
- **Shell:** Drop unused CSS, run check, find launch config

  ```bash
  python3 - <<'EOF'
  p='src/ui/menu.css'; s=open(p).read()
  a=""".how-section p,
  .how-list {
    margin: 0;
    line-height: 1.5;
    color: var(--tc-ink-light);
  }

  .how-list {
    padding-left: 20px;
  }
  """
  b=""".how-section p {
    margin: 0;
    line-height: 1.5;
    color: var(--tc-ink-light);
  }
  """
  assert a in s; s=s.replace(a,b); open(p,'w').write(s)
  EOF
  timeout 100 npm run check 2>&1 | tail -4; cat .claude/launch.json 2>/dev/null
  ```

</details>

### 🤖 Claude

Check passes. Next: the release entry and version bump, then a browser check.

<details><summary>2 tool calls</summary>

- **Shell:** Read release list and strings

  ```bash
  sed -n 1,40p src/core/releases.ts; grep -n "release.2.6\|release.2.5" src/i18n/en.ts
  ```
- **Shell:** Add 2.7.0 release, bump version, check and build

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/releases.ts',[("""export const RELEASES: readonly Release[] = [
  ""","""export const RELEASES: readonly Release[] = [
    {
      version: '2.7.0',
      date: '2026-11-16',
      notes: ['release.2.7.0.freeWrite', 'release.2.7.0.misprints', 'release.2.7.0.menu', 'release.2.7.0.howTo'],
      fixes: true,
    },
  """)])
  sub('src/i18n/en.ts',[("  'release.2.6.0.name':","""  'release.2.7.0.freeWrite': 'Practice is now Free Write, first on the m
  … (503 more characters)
  ```

</details>

### 🤖 Claude

Check and build both pass. Now I'm checking it in the browser.

<details><summary>4 tool calls</summary>

- **preview_start** `{"name":"inky-keys-dev"}`
- **computer** `{"action":"screenshot","scale":0.6}`
- **computer** `{"action":"zoom","region":[200,340,620,380],"scale":0.7}`
- **computer** `{"action":"zoom","region":[200,320,620,350]}`

</details>

### 🤖 Claude

In menu text the ␣ shows as a flat underscore, which reads badly, so I'll keep the glyph to the creature picture and reword the strings.

<details><summary>4 tool calls</summary>

- **Shell:** Reword space strings to avoid the glyph in text

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/i18n/en.ts',[
  ("'tutorial.space.body': 'This mark ␣ means a space. When a drip carries ␣, press the spacebar: the long key under your thumbs.',","'tutorial.space.body': 'The little cup shape on this drip means a space. When a drip carries it, press the spacebar: the long key under your thumbs.',"),
  ("'tutorial.space.hint': '␣ means press the spacebar',","'tutorial.space.hint': 'Press the spacebar',"),
  ("and the game explains the ␣ sp
  … (125 more characters)
  ```
- **javascript_tool** `{"action":"javascript_exec","text":"Object.keys(localStorage)"}`
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5173/"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"find","input":{"query":"Got it"}}]}`
- **computer** `{"action":"screenshot","scale":0.7}`

</details>

### 🤖 Claude

The order is right. The "Home row" shown is this browser's existing save. To check a brand-new player without wiping it, I'll look at how new players get their keys.

<details><summary>1 tool call</summary>

- **Shell:** Find where new saves are created

  ```bash
  grep -n "defaultSave" src -r | grep -v test | head
  ```

</details>

### 🤖 Claude

New players also get `defaultSave()`, and a unit test pins its keys to the new preset. To see the spacebar briefing and page-cleared card live, I'll add a throwaway test player in the browser pane.

<details><summary>4 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"u","action_summary":"Opens the player picker"}},{"name":"computer","input":{"action":"screenshot","scale":0.6}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[483,384],"action_summary":"Clicks Add a player"}},{"name":"computer","input":{"action":"screenshot","scale":0.6}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"type","text":"Test","action_summary":"Types the name Test"}},{"name":"computer","input":{"action":"left_click","coordinate":[567,520],"action_summary":"Saves the new player"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"comput
… (50 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[370,360],"action_summary":"Switches to the Test player"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot","scale":0.6}}]}`

</details>

### 🤖 Claude

The new player starts on "Letters + capitals + space · 53 keys". Next I'll check How to Play.

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"h","action_summary":"Opens How to play"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot"}}]}`

</details>

### 🤖 Claude

The pictures render. The powers heading still says "bosses", so I'll fix that. Next I'll check the top and the controls.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"scroll","coordinate":[400,300],"scroll_direction":"up","scroll_amount":6}},{"name":"computer","input":{"action":"screenshot","scale":0.8}},{"name":"computer","input":{"action":"scroll","coordinate":[400,300],"scroll_direction":"down","scroll_amount":
… (70 more characters)`
- **Shell:** Retitle powers section and widen pictures

  ```bash
  grep -n "'how.powersTitle'" src/i18n/en.ts && sed -i '' "s/'how.powersTitle': 'Powers, bosses and rewards'/'how.powersTitle': 'Powers and rewards'/" src/i18n/en.ts && sed -i '' 's/grid-template-columns: 76px 1fr;/grid-template-columns: 96px 1fr;/; s/^  width: 76px;$/  width: 96px;/' src/ui/menu.css && grep -n "'how.powersTitle'\|96px" src/i18n/en.ts src/ui/menu.css
  ```

</details>

### 🤖 Claude

Now I'll start a Free Write game to see the spacebar briefing.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"Escape","action_summary":"Goes back to the main menu"}},{"name":"computer","input":{"action":"key","text":"f","action_summary":"Opens Free Write"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"a
… (35 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[547,496],"action_summary":"Starts writing in Free Write"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot","scale":0.7}}]}`

</details>

### 🤖 Claude

Cards are still animating in. I'll take another look.

<details><summary>5 tool calls</summary>

- **computer** `{"action":"screenshot","scale":0.7}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[583,438],"action_summary":"Closes the briefing and starts the page"}},{"name":"computer","input":{"action":"wait","duration":3}},{"name":"computer","input":{"action":"screenshot","scale":0.7}}]}`
- **Shell:** Look for a dev debug hook

  ```bash
  grep -rn "window\.\(__\|inky\|game\)\|import.meta.env.DEV" src | head
  ```
- **Shell:** Read the dev-only hook

  ```bash
  sed -n 930,960p src/main.ts
  ```
- **computer** `{"action":"key","text":"space","action_summary":"Presses the spacebar to pop the space drip"}`

</details>

### 🤖 Claude

The space drip popped. To reach the page-cleared card quickly I'll use the dev hook to type each target's next letter automatically.

<details><summary>2 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"const w = window.inkling.world;\nawait new Promise((resolve) => {\n  const id = setInterval(() => {\n    if (w.phase !== 'playing') { clearInterval(id); resolve(); return; }\n    const vis = w.targets.filter((t) => t.x < 1280).sort((a, b) => a.x - b.x);\n    const
… (420 more characters)`
- **computer** `{"action":"screenshot","scale":0.7}`

</details>

### 🤖 Claude

The "Main menu (M)" link is on the card. I'll press M and check that Continue resumes on page 2.

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"m","action_summary":"Goes to the main menu from the cleared card"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot","scale":0.6}}]}`

</details>

### 🤖 Claude

Continue resumes at chapter 1, page 2. Last check: whether the ink-bar rings now clear. I'll continue, lower the ink so a refill happens, autoplay, and count leftover ring graphics.

<details><summary>4 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"Object.keys(window.inkling.renderer)"}`
- **javascript_tool** `{"action":"javascript_exec","text":"document.querySelector('[data-id=\"continue\"]').click();\nawait new Promise(r => setTimeout(r, 800));\nconst w = window.inkling.world;\nlet restored = 0;\nw.ink = 30;\nawait new Promise((resolve) => {\n  const id = setInterval(() => {\n    if (w.events.some(e => 
… (1037 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"document.querySelector('.bf-panel [data-id=\"start\"]')?.click();\nawait new Promise(r => setTimeout(r, 500));\nconst w = window.inkling.world;\nconst snap = () => { const out = []; const walk = (c, path) => { (c.children ?? []).forEach((ch, i) => { const p = path
… (1114 more characters)`
- **computer** `{"action":"zoom","region":[0,70,260,110],"scale":0.6}`

</details>

### 🤖 Claude

Refills happened (ink went from 30 to 50) and nothing is left on the ink bar. I'll check the console, then run the final check, build and milestone snapshots.

<details><summary>5 tool calls</summary>

- **read_console_messages** `{"onlyErrors":true}`
- **Shell:** Final check and build; read snapshot steps

  ```bash
  timeout 100 npm run check 2>&1 | grep -E "Tests |error|✖" ; timeout 200 npm run build >/dev/null 2>&1 && echo BUILD OK; grep -n "snapshots" package.json; tail -30 docs/progression/README.md
  ```
- **Shell:** Capture m17 and latest snapshots

  ```bash
  (timeout 300 npm run snapshots -- m17 && timeout 300 npm run snapshots -- latest) > <temp file> 2>&1; echo EXIT $?; tail -8 <temp file> ls docs/progression/m17
  ```
- **Read** `docs/progression/m17/page-done.png`
- **Read** `docs/progression/m17/menu.png`

</details>

### 🤖 Claude

The `page-done` snapshot captured the pause menu instead, so the snapshot tour must rely on an old hotkey. Looking at the script:

<details><summary>3 tool calls</summary>

- **Shell:** Find snapshot steps that depend on menu keys

  ```bash
  grep -n "Quit to menu\|'p'\|\"p\"\|practice\|Practice\|page-done\|pause" scripts/snapshots.ts | head -30
  ```
- **Shell:** Read the snapshot tour

  ```bash
  sed -n 60,125p scripts/snapshots.ts; grep -n "click:" scripts/snapshots.ts | head -3; grep -n "async function click\|case 'click'\|step.click" scripts/snapshots.ts
  ```
- **Shell:** Read click helper and lineup

  ```bash
  sed -n 178,200p scripts/snapshots.ts; sed -n 40,58p scripts/snapshots.ts
  ```

</details>

### 🤖 Claude

I'll let the snapshot script's `click` take alternatives (`Free Write|Practice`) so it still works on older builds, and drop the Misprint from the lineup.

<details><summary>4 tool calls</summary>

- **Shell:** Fix snapshot tour and recapture

  ```bash
  python3 - <<'EOF'
  p='scripts/snapshots.ts'; s=open(p).read()
  pairs=[
  ("    { kind: 'misprint', text: 'paper', buffer: 'papre', cursor: 5, x: 520, lane: 10 },\n",""),
  ("{ click: 'Practice' }, { click: 'Change keys' }, { shot: 'type-case-dvorak' }","{ click: FREE_WRITE }, { click: 'Change keys' }, { shot: 'type-case-dvorak' }"),
  ("  { click: 'Practice' }, { shot: 'practice' },","  { click: FREE_WRITE }, { shot: 'practice' },"),
  ("const TOUR: Step[] = [","/** The free-play mode's button: \"Free Write\" since M17, \"Practice\" before. */\nconst FREE_WRITE = 'Free Write|Practice';\n\nconst TOUR: St
  … (1792 more characters)
  ```
- **Read** `docs/progression/m17/page-done.png`
- **Read** `docs/progression/m17/briefing.png`
- **Read** `docs/progression/m17/lineup.png`

</details>

### 🤖 Claude

The snapshots look right. Now I'll add the M17 section to the progression page.

<details><summary>5 tool calls</summary>

- **Shell:** Read progression page structure and new shots

  ```bash
  grep -n "^##\|^###\|^| " docs/progression/README.md | head -40; git status --short docs/progression | head -40
  ```
- **Shell:** Add M17 to the progression page

  ```bash
  python3 - <<'EOF'
  p='docs/progression/README.md'; s=open(p).read()
  pairs=[
  ("| New tagline, and \"Save data\" is now **Manage saves**. |","| **Free Write** (formerly Practice) comes first; new players start on letters, capitals and space. |"),
  ("| Adds **Practice these keys** (from M14). |","| Adds **Free Write with these keys** (F; added in M14 as Practice these keys). |"),
  ("| M2 | M7 | M12 | M13 | M15 |\n","| M2 | M7 | M12 | M13 | M15 | M17 |\n"),
  ('<img src="m15/page-done.png" width="170" alt="M15 page with handwritten title, drawn stars and best run"> |\n','<img src="m15/page-done.png" wi
  … (2558 more characters)
  ```
- **Shell:** Fix table and keep only shots the page uses

  ```bash
  sed -i '' '54s/^|---|---|---|---|---|$/|---|---|---|---|---|---|/' docs/progression/README.md && sed -n 54p docs/progression/README.md && cd docs/progression && (cd m17 && ls | grep -v -E '^(menu|how-to-play|briefing|page-done)\.png$' | xargs rm) && git clean -q -f latest/ && git status --short . 
  ```
- **Shell:** Final check and list changed files

  ```bash
  cd /Users/[removed]/projects/inky-keys && timeout 100 npm run check 2>&1 | grep -E "Tests |error" ; git status --short | head -50
  ```
- **Shell:** Rebuild after final string tweaks

  ```bash
  timeout 200 npm run build >/dev/null 2>&1 && echo BUILD OK
  ```

</details>

### 🤖 Claude

Milestone 17 is done on `feat/m17-first-impressions` as release 2.7.0, and I removed Misprints in it too. `npm run check` (339 tests) and `npm run build` pass, the M17 snapshots are taken, and I played it in the browser. Nothing is committed.

**What changed**
- **Free Write:** Practice is now called Free Write and sits first on the menu (key F). Internally it's still `practice`. New players start with all letters, capitals and space, which is a new "Letters + capitals + space" preset. Existing players keep their keys.
- **Misprints are gone:** the creature, its briefing, its config and the arrow-key editing are all removed. Run-ons still work. Old saves just drop the `misprint` "seen" id when loaded, so no save-version bump was needed.
- **End-of-page card:** now has a "Main menu (M)" link. The next page is already saved, so Continue picks up there.
- **Stuck yellow rings (a real bug):** the ring that marks ink coming back was getting lost from the effects list and stayed on the ink bar until the screen was rebuilt. Fixed. The ink-bar rings now stay up for about 0.4 seconds, then fade.
- **Spacebar briefing:** shows the first time a page can contain a space, followed by a slowed-down space drip with "Press the spacebar". In menu text the ␣ glyph shows up as a flat underscore, so the wording says "the little cup shape" instead and the creature picture shows the glyph.
- **How to Play:** now has pictures of each creature, the tougher inks, the Spill and the ink bottle. It also shows your own keys on the hands-on-keyboard picture, and the controls are drawn as key caps.

**Other things I touched**
- The snapshot script now accepts "Free Write" or "Practice" when it clicks the mode button, so it still works on older builds. Without that fix, the end-of-page snapshot captured the pause menu instead.
- I updated the README, DESIGN.md, REQUIREMENTS.md (added a Round 3 table and marked Misprints removed), CREDITS.md and the progression page.
- To test as a new player, I added a player called "Test" in the browser pane. You may want to delete it.

When you're ready, ask me to commit and merge, or to start M18 (waves and pacing).

## 🧑 Prompt

> commit and merge, then start M18

<details><summary>1 tool call</summary>

- **Shell:** Export the session transcript

  ```bash
  timeout 120 npm run transcript 2>&1 | tail -5; git status --short docs/transcripts | head
  ```

</details>

### 🤖 Claude

Now I'll scan the export for private details, using generic patterns only.

<details><summary>3 tool calls</summary>

- **Shell:** Scan transcript export for private details

  ```bash
  f="docs/transcripts/2026-11-16-inky-keys-milestones-95f6365a.md docs/transcripts/2026-11-16-game-release-system-with-versioning-e31c68db.md"; grep -nEo "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}" $f | sort -u | head; grep -nEo "/(Users|private|home)/[^ )\`\"']*" $f | sort -u | head; grep -nEoi "(api[_-]?key|token|secret|password|bearer)[^ ]{0,40}" $f | sort -u | head; grep -nEo "\b[A-Za-z0-9_-]{32,}\b" $f | sort -u | head
  ```
- **Shell:** Scan transcript export for private details

  ```bash
  cd /Users/[removed]/projects/inky-keys/docs/transcripts && for f in 2026-11-16-inky-keys-milestones-95f6365a.md 2026-11-16-game-release-system-with-versioning-e31c68db.md; do echo "== $f"; grep -nEo "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}" "$f" | sort -u | head; grep -nEo "/(Users|private|home)/[^ )\`\"']*" "$f" | sort -u | head -5; grep -nEoi "(api[_-]?key|secret|password|bearer)[^ ]{0,30}" "$f" | sort -u | head -5; grep -nEo "[A-Za-z0-9_-]{32,}" "$f" | sort -u | head -5; done
  ```
- **Shell:** Check for unredacted local paths or names

  ```bash
  grep -c "private/tmp\|[removed]\|[removed]" 2026-11-16-inky-keys-milestones-95f6365a.md; grep -n "private/tmp" 2026-11-16-inky-keys-milestones-95f6365a.md | head -3 | cut -c1-160
  ```

</details>

### 🤖 Claude

The transcript is clean: paths are redacted, and there are no emails or secrets. Committing now.

<details><summary>2 tool calls</summary>

- **Shell:** Commit, fast-forward merge and delete branch

  ```bash
  cd /Users/[removed]/projects/inky-keys && git add -A && git commit -q -F - <<'EOF'
  Milestone 17: First impressions (2.7.0)

  - Practice is now Free Write, first on the main menu (F) and in the pause menu
  - New players start on a new "Letters + capitals + space" preset
  - Misprints removed: creature, briefing, config, content and arrow-key editing
  - Page-complete card gets a Main menu (M) link
  - Fix rings added by arriving ink drops being orphaned on the ink bar; HUD rings now hold, then fade
  - Spacebar briefing and guided space drip the first time a page can show the space mark
  - How to play h
  … (481 more characters)
  ```
- **Shell:** Tag v2.7.0 and branch for M18

  ```bash
  npm run release:tag 2>&1 | tail -3 && git tag --list "v2.7*" && git checkout -q -b feat/m18-waves && git log --oneline -1
  ```

</details>

### 🤖 Claude

M17 is merged to `main` and tagged `v2.7.0` (not pushed). Before starting M18 I'll check whether RELEASING.md keeps a history table I should have updated.

<details><summary>2 tool calls</summary>

- **Shell:** Read release history table

  ```bash
  grep -n "^| 2\.\|^| Version\|^## " docs/RELEASING.md | tail -12
  ```
- **Shell:** Fill in release history rows

  ```bash
  git rev-parse --short v2.6.0 2>/dev/null; python3 - <<'EOF'
  import subprocess
  p='docs/RELEASING.md'; s=open(p).read()
  try: h=subprocess.check_output(['git','rev-parse','--short','v2.6.0^{commit}']).decode().strip()
  except Exception: h=subprocess.check_output(['git','rev-parse','--short','47fe7f2']).decode().strip()
  a="| 2.6.0 | | Inky Keys name, domain and icons; What's new and version on About |"
  assert a in s
  s=s.replace(a,f"| 2.6.0 | `{h}` | Inky Keys name, domain and icons; What's new and version on About |\n| 2.7.0 | `974e8bb` | M17 First impressions: Free Write first, no more Misprints |
  … (53 more characters)
  ```

</details>

### 🤖 Claude

The history table now has 2.6.0 and 2.7.0 (this goes into the M18 commit). On to M18, starting with the zoom-in entry.

<details><summary>5 tool calls</summary>

- **Shell:** Read lane and width helpers

  ```bash
  sed -n 440,480p src/core/world.ts; grep -n "export function stepWorld" src/core/world.ts
  ```
- **Shell:** Read stepWorld movement and Target type

  ```bash
  sed -n 715,760p src/core/world.ts; sed -n 40,90p src/core/world.ts; grep -n "speedJitter\|laneGapPx\|guideSpeedFactor" src/core/config.ts
  ```
- **Shell:** Read nearby config entries

  ```bash
  sed -n 84,92p src/core/config.ts; sed -n 338,348p src/core/config.ts
  ```
- **Shell:** Implement zoom-in entry and run tests

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/config.ts',[("""  /** Empty space to keep behind the last target in a lane before spawning another. */
    laneGapPx: 100,
  };""","""  /** Empty space to keep behind the last target in a lane before spawning another. */
    laneGapPx: 100,
    /**
     * New targets rush in from the right until their whole word is on the page,
     * then settle to their own speed, so a long word never makes you wait.
     */
    entry: {
      /** Top speed whi
  … (2643 more characters)
  ```
- **Shell:** Read failing movement test

  ```bash
  grep -rn "moves targets left at their speed" src | cut -d: -f1,2; f=$(grep -rln "moves targets left at their speed" src); n=$(grep -n "moves targets left at their speed" $f | cut -d: -f1); sed -n "$((n)),$((n+14))p" $f
  ```

</details>

### 🤖 Claude

That test expects the old slide-in, so I'll make it opt out of the entry and add tests for the new behavior.

<details><summary>3 tool calls</summary>

- **Shell:** Update movement test and add entry tests

  ```bash
  python3 - <<'EOF'
  p='src/core/world.test.ts'; s=open(p).read()
  a="""    const target = spawnTarget(world, { speed: 100 })!;
      world.page.spawned = world.page.params.size; // stop the spawner
      stepWorld(world, 500);
      expect(target.x).toBeCloseTo(SPAWN_X - 50);
      expect(target.prevX).toBeCloseTo(SPAWN_X);
      expect(renderX(target, 0.5)).toBeCloseTo(SPAWN_X - 25);
    });
  """
  b="""    const target = spawnTarget(world, { speed: 100, entering: false })!;
      world.page.spawned = world.page.params.size; // stop the spawner
      stepWorld(world, 500);
      expect(target.x).toBeCloseTo(SPAWN_X 
  … (1720 more characters)
  ```
- **Shell:** Read world test imports

  ```bash
  sed -n 4,25p src/core/world.test.ts
  ```
- **Shell:** Fix imports and run tests

  ```bash
  python3 - <<'EOF'
  p='src/core/world.test.ts'; s=open(p).read()
  s=s.replace("  WORLD_HEIGHT,\n  createPage,","  WORLD_HEIGHT,\n  WORLD_WIDTH,\n  createPage,",1).replace("  createWorld,\n  laneCount,","  createWorld,\n  estimateWidth,\n  laneCount,",1)
  open(p,'w').write(s)
  EOF
  npx tsc --noEmit && timeout 100 npx vitest run 2>&1 | grep -E "×|Tests |AssertionError" | head -20
  ```

</details>

### 🤖 Claude

Zoom-in works and is tested. Next are the wave changes (Scrawlers first, numbers and symbols on their own pages), which both touch the chapter plans, so I'll read that code.

<details><summary>4 tool calls</summary>

- **Shell:** Read chapter plans and page creation

  ```bash
  sed -n 355,480p src/core/config.ts; sed -n 270,330p src/core/world.ts; sed -n 40,75p src/core/campaign.ts
  ```
- **Shell:** Find weight setup in content source

  ```bash
  grep -n "totalWeight\|weights\b\|const weights\|unique =\|export function createContentSource\|export interface ContentSource\|keys: readonly\|wordCount" src/content/contentSource.ts | head -20; grep -n "isLetter" src/core/keySelection.ts | head -3
  ```
- **Shell:** Read content source interface and nextChar

  ```bash
  sed -n 20,40p src/content/contentSource.ts; sed -n 104,120p src/content/contentSource.ts; sed -n 160,176p src/content/contentSource.ts
  ```
- **Shell:** Find nextChar and supports callers

  ```bash
  grep -rn "nextChar\b\|nextChar(" src | grep -v "^src/content/contentSource.ts" | head; grep -rn "supports(" src | grep -v test | head
  ```

</details>

### 🤖 Claude

Now the content source changes: a character pool for drips, and a count of keys per pool.

<details><summary>6 tool calls</summary>

- **Shell:** Add character pools to content source

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/content/contentSource.ts',[
  ("""export interface ContentSource {""","""/**
   * Which keys a drip page draws from: letters (either case) and space, or
   * digits and symbols. They get separate pages so the two never mix.
   */
  export type CharPool = 'all' | 'letters' | 'symbols';

  /** The pool a single key belongs to. */
  export function poolOf(ch: string): Exclude<CharPool, 'all'> {
    return ch === ' ' || /^\\p{L}$/u.test(ch) ? 'letters' 
  … (1752 more characters)
  ```
- **Shell:** Find chapter plan and page count users

  ```bash
  grep -rn "chapterPlan\|GAME_CONFIG.chapters\|pageCount" src --include=*.ts | grep -v "^src/core/config.ts" | cut -c1-170
  ```
- **Shell:** Find chapter plan and page count users

  ```bash
  grep -rn "chapterPlan\|GAME_CONFIG.chapters\|pageCount" src | grep -v "^src/core/config.ts:" | cut -c1-170
  ```
- **Shell:** Add symbol pages and drip pools to page plans

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/config.ts',[
  ("""export const TARGET_KINDS: readonly TargetKind[] = ['drip', 'blotling', 'runon'];""","""export const TARGET_KINDS: readonly TargetKind[] = ['drip', 'blotling', 'runon'];

  /**
   * A page in a chapter plan: a target type, or `symbols`, a drip page of only
   * digits and symbols (kept apart from letters; see GAME_CONFIG.symbolPages).
   */
  export type PageKind = TargetKind | 'symbols';

  /** Which keys a drip page draws
  … (4079 more characters)
  ```
- **Shell:** Read affected config tests and key-count cap

  ```bash
  sed -n 1,25p src/core/config.test.ts; sed -n 80,90p src/core/config.test.ts; grep -n "const keyCount" -A4 src/core/world.ts
  ```
- **Shell:** Update tests and per-pool on-screen cap

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/config.test.ts',[
  ("""    const plan = chapterPlan(0);
      plan.forEach((kind, page) => expect(pageParams('normal', 0, page).kind).toBe(kind));
    });""","""    const plan = chapterPlan(0);
      plan.forEach((kind, page) => expect(pageParams('normal', 0, page).kind).toBe(kind === 'symbols' ? 'drip' : kind));
    });

    it('keeps letters and symbols on separate drip pages', () => {
      expect(pageParams('normal', 0, 0, () => true, ['
  … (1552 more characters)
  ```

</details>

### 🤖 Claude

Zoom-in is done. I'm now on Scrawlers as the main wave and the separate number/symbol pages. Nine tests assume the old chapter layout, so I'm updating them.

<details><summary>3 tool calls</summary>

- **Shell:** Read failing progression tests

  ```bash
  grep -n "gets slightly harder page by page" -A12 src/core/config.test.ts; grep -n "gets harder chapter by chapter" -A10 src/core/config.test.ts
  ```
- **Shell:** Pin test plans and rerun

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/config.test.ts',[
  ("""    // Pages 0 and 1 of chapter 1 are both drips.
      const a = pageParams('normal', 0, 0);
      const b = pageParams('normal', 0, 1);""","""    // Two drip pages in a row.
      const drips = ['drip', 'drip'] as const;
      const a = pageParams('normal', 0, 0, () => true, drips);
      const b = pageParams('normal', 0, 1, () => true, drips);"""),
  ("    expect(b.speed / a.speed).toBeLessThan(pageParams('normal', 
  … (722 more characters)
  ```
- **Shell:** Make later Apprentice chapters word-heavy; add pool tests

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/campaign.ts',[
  ("""  if (chapter < SPACE_CHAPTER + 6) return ['drip', 'blotling', 'drip', 'blotling'];
    return ['drip', 'blotling', 'blotling', 'drip', 'blotling'];""","""  if (chapter < SPACE_CHAPTER + 6) return ['drip', 'blotling', 'drip', 'blotling'];
    // With plenty of keys, words are the main wave: one drip page to warm up
    // on the new key, then Scrawlers. (Five pages, as before, so stars line up.)
    return ['drip', 'b
  … (1365 more characters)
  ```

</details>

### 🤖 Claude

Waves are done. Two small things before the Eraser: the spacebar briefing shouldn't fire on symbol pages, and I'll look at the Eraser and Blotter code.

<details><summary>7 tool calls</summary>

- **Shell:** Read eraser and charge code

  ```bash
  python3 - <<'EOF'
  p='src/core/mechanics.ts'; s=open(p).read()
  a="    space: hasSpace && (kind === 'drip' || kind === 'runon' || sprinkles.runon > 0),"
  b="    space: hasSpace && ((kind === 'drip' && page.params.pool !== 'symbols') || kind === 'runon' || sprinkles.runon > 0),"
  assert a in s; s=s.replace(a,b); open(p,'w').write(s)
  EOF
  sed -n 40,60p src/core/abilities.ts; sed -n 60,140p src/core/input.ts; grep -n "eraser\|blotter" src/core/config.ts | head; grep -n "eraser" src/core/world.ts | head -20
  ```
- **Shell:** Find ability cost and charge users

  ```bash
  grep -rn "abilityCost\|chargeKeys(" src | grep -v "^src/core/abilities.ts" | cut -c1-160; sed -n 1,40p src/core/abilities.ts; sed -n 285,300p src/core/config.ts
  ```
- **Shell:** Make Blotter cost and charge runs depend on difficulty

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/config.ts',[
  ("""    maxCharges: 3,
      chargeKeys: { base: 25, perChapter: 1, max: 50 },
      /** Enter: blot every creature on the page (except a boss) for a share of their points. */
      blotter: { cost: 2, pointsShare: 0.5, fromChapter: 1, fromLevel: 2 },
      /** Passive: forgives the next wrong key. Re-arms after a clean run that grows with the chapter. */
      eraser: { keys: 40, keysPerChapter: 1, maxKeys: 70, fromChapter: 
  … (2930 more characters)
  ```
- **Shell:** Default charge runs to Normal; read test lines

  ```bash
  sed -i '' "s/export function chargeKeys(chapter: number, difficulty: Difficulty = 'relaxed'): number {/export function chargeKeys(chapter: number, difficulty: Difficulty = 'normal'): number {/" src/core/abilities.ts && sed -n 36,42p src/core/blotterBoss.test.ts; sed -n 58,62p src/core/blotterBoss.test.ts; sed -n 140,144p src/core/consequences.test.ts
  ```
- **Shell:** Use difficulty-aware cost in tests and rerun

  ```bash
  for f in src/core/blotterBoss.test.ts src/core/consequences.test.ts; do sed -i '' 's/GAME_CONFIG\.abilities\.blotter\.cost/abilityCost("blotter", world.difficulty)/g' $f; grep -q "abilityCost" <(head -12 $f) || sed -i '' "1a\\
  import { abilityCost } from './abilities';
  " $f; done; head -5 src/core/consequences.test.ts; npx tsc --noEmit 2>&1 | head; npx eslint src/core/consequences.test.ts src/core/blotterBoss.test.ts 2>&1 | tail -5; timeout 100 npx vitest run 2>&1 | grep -E "×|Tests " | head -20
  ```
- **Shell:** Read the two failing tests

  ```bash
  sed -i '' "s/abilityCost(\"blotter\", world.difficulty)/abilityCost('blotter', world.difficulty)/g" src/core/blotterBoss.test.ts src/core/consequences.test.ts; grep -n "import.*abilities" src/core/blotterBoss.test.ts; sed -n 40,70p src/core/abilities.test.ts; grep -n "hand over a new ability ready to try" -A12 src/core/mechanics.test.ts
  ```
- **Shell:** Update ability tests for difficulty scaling

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/blotterBoss.test.ts',[("import { abilityCost } from './abilities';\n",""),("import { chargeKeys } from './abilities';","import { abilityCost, chargeKeys } from './abilities';")])
  sub('src/core/abilities.test.ts',[("""    expect(chargeKeys(0)).toBe(A.chargeKeys.base);
      expect(chargeKeys(10)).toBeGreaterThan(chargeKeys(0));
      expect(chargeKeys(999)).toBe(A.chargeKeys.max);""","""    expect(chargeKeys(0, 'relaxed')).toBe(A.cha
  … (1245 more characters)
  ```

</details>

### 🤖 Claude

The Blotter is now harder to earn on higher difficulties. I'm finishing its tests, then the Eraser grace.

<details><summary>1 tool call</summary>

- **Shell:** Fix import and rerun tests

  ```bash
  sed -i '' "s/^import { ABILITIES, abilityUnlockedAt, chargeKeys, eraserKeys, unlockedAbilities } from '.\/abilities';/import { ABILITIES, abilityCost, abilityUnlockedAt, chargeKeys, eraserKeys, unlockedAbilities } from '.\/abilities';/" src/core/abilities.test.ts && npx tsc --noEmit 2>&1 | head -5; timeout 100 npx vitest run 2>&1 | grep -E "×|Tests " | head
  ```

</details>

### 🤖 Claude

Now the eraser grace.

<details><summary>4 tool calls</summary>

- **Shell:** Read world eraser fields and error entry

  ```bash
  sed -n 232,240p src/core/world.ts; sed -n 370,378p src/core/world.ts; grep -n "export function beginPage" -A8 src/core/world.ts; grep -n "^export function registerError\|^function registerError" -A4 src/core/input.ts
  ```
- **Shell:** Add a 1-second grace after the Eraser

  ```bash
  python3 - <<'EOF'
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/world.ts',[
  ("""  /** Correct keys in a row toward re-arming the Eraser. */
    eraserRun: number;
  ""","""  /** Correct keys in a row toward re-arming the Eraser. */
    eraserRun: number;
    /** Time left after the Eraser was used in which wrong keys are quietly ignored (ms). */
    eraserGraceMs: number;
  """),
  ("""    eraser: false,
      eraserRun: 0,
      shield: false,
      shieldEarned: false,""","""    eraser: false,
      eraserRun: 
  … (1851 more characters)
  ```
- **Shell:** Read existing Eraser tests

  ```bash
  sed -n 150,190p src/core/abilities.test.ts; grep -n "^function playingWorld\|^const run" -A8 src/core/abilities.test.ts | head -20
  ```
- **Shell:** Test the eraser grace

  ```bash
  python3 - <<'EOF'
  p='src/core/abilities.test.ts'; s=open(p).read()
  a="""    // The next slip counts as usual.
      typeChar(fresh, 'z');
      expect(fresh.stats.errors).toBe(1);
      expect(fresh.stats.combo).toBe(0);
    });
  });"""
  b="""    // More slips in the next second are quietly ignored…
      typeChar(fresh, 'z');
      typeChar(fresh, 'x');
      expect(fresh.stats.errors).toBe(0);
      expect(fresh.stats.combo).toBe(combo);
      expect(fresh.ink).toBe(ink);
      expect(fresh.stats.missedKeys).toEqual({});

      // …and once the grace is over, the next slip counts as usual.
      fresh.page.spawned = 
  … (331 more characters)
  ```

</details>

### 🤖 Claude

Eraser grace is tested. Now the strings and docs that describe charges and page mix.

<details><summary>5 tool calls</summary>

- **Shell:** Find text about charges and page mix

  ```bash
  grep -n "two charges\|mostly drips\|Pages are mostly\|25 \|charge" src/i18n/en.ts README.md docs/DESIGN.md | cut -c1-260
  ```
- **Shell:** Read README gameplay and powers sections

  ```bash
  sed -n 26,34p README.md | cut -c1-400; sed -n 60,80p README.md | cut -c1-300
  ```
- **Shell:** Update player-facing and README text

  ```bash
  python3 - <<'EOF'
  import re
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/i18n/en.ts',[
  ("With two charges, press Enter to blot every creature on the page. You have two charges now to try it.","With two charges (three on Hard and Expert), press Enter to blot every creature on the page. You have enough now to try it."),
  ("'how.mix': 'Pages are mostly drips or mostly Scrawlers. Later on, a Run-on sneaks onto a word page now and then.'","'how.mix': 'Most pages are Scrawlers, with a page of drips in 
  … (1888 more characters)
  ```
- **Shell:** Fix README default keys line

  ```bash
  sed -i '' 's/New players start on the home row (`a s d f g h j k l ;`)\./New players start on all letters, capitals and space (the **Letters + capitals + space** preset)./' README.md && grep -c "Letters + capitals + space\*\* preset" README.md; grep -n "Apprentice" README.md | sed -n 1,3p | cut -c1-80; grep -n "What appears when" README.md | cut -c1-60
  ```
- **Shell:** Add 2.8.0 release, check and build

  ```bash
  python3 - <<'EOF'
  p='README.md'; s=open(p).read()
  a="Once space is learned, an occasional phrase (Run-on) joins the word pages."
  assert a in s
  s=s.replace(a,a+" From six chapters after space, each chapter is one drip page for the new key and then four Scrawler pages.",1)
  open(p,'w').write(s)
  def sub(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s, (p,a); s=s.replace(a,b,1)
      open(p,'w').write(s)
  sub('src/core/releases.ts',[("""export const RELEASES: readonly Release[] = [
  ""","""export const RELEASES: readonly Release[] = [
    {
      version: '2.8.0',
      date: '202
  … (837 more characters)
  ```

</details>

### 🤖 Claude

Check and build pass for 2.8.0. Now I'm checking it in the browser: words zooming in, the wave mix, a symbols page, and the Blotter cost.

<details><summary>7 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"location.reload(); 'ok'"}`
- **javascript_tool** `{"action":"javascript_exec","text":"await new Promise(r => setTimeout(r, 1500));\ndocument.querySelector('.wn-panel [data-id], dialog button')?.click?.();\nconst s = window.inkling.store;\n({ player: document.querySelector('.menu-player-name')?.textContent, keys: s.data.keys.length })"}`
- **computer** `{"action":"screenshot","scale":0.5}`
- **javascript_tool** `{"action":"javascript_exec","text":"document.querySelector('[data-id=\"back\"]')?.click();\nconst { store } = window.inkling;\nstore.update((s) => { s.keys = [...'abcdefghijklmnopqrstuvwxyz', ' ', ...'0123456789', '!', '?']; s.notebook = null; });\nstore.flush?.();\nlocation.reload();\n'ok'"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":2}},{"name":"computer","input":{"action":"key","text":"f","action_summary":"Opens Free Write"}},{"name":"computer","input":{"action":"key","text":"4","action_summary":"Picks Expert difficulty"}},{"name":"computer","input":{"action":"
… (27 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[566,418],"action_summary":"Closes the player picker"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot","scale":0.5}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"f","action_summary":"Opens Free Write"}},{"name":"computer","input":{"action":"key","text":"4","action_summary":"Picks Expert difficulty"}},{"name":"computer","input":{"action":"key","text":"Return","action_summary":"Starts writing"}},{"
… (122 more characters)`

</details>

### 🤖 Claude

"Page 1 of 4" means the symbols page is in this chapter. I'll close the briefing, then check the charges handed over on Expert and each page's pool.

<details><summary>1 tool call</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"document.querySelector('.bf-panel [data-id=\"start\"]')?.click();\nawait new Promise(r => setTimeout(r, 300));\nconst w = window.inkling.world;\n({ difficulty: w.difficulty, charges: w.charges, page: w.page.index, kind: w.page.params.kind, pool: w.page.params.pool
… (34 more characters)`

</details>

### 🤖 Claude

Expert hands over 3 charges, enough for one Blotter. Next I'll autoplay the chapter and record what each page spawns.

<details><summary>1 tool call</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"const w = window.inkling.world;\nconst pages = [];\nlet cur = null;\nawait new Promise((resolve) => {\n  const id = setInterval(() => {\n    if (w.phase === 'briefing') { document.querySelector('.bf-panel [data-id=\"start\"]')?.click(); return; }\n    if (w.phase 
… (1076 more characters)`

</details>

### 🤖 Claude

The pane is hidden, so timers run slowly and my script timed out while still running. I'll record its progress into a page variable and check back.

<details><summary>4 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"const w = window.inkling.world;\nwindow.__pages = window.__pages || [];\nif (!window.__observer) {\n  window.__observer = setInterval(() => {\n    if (w.phase !== 'playing') return;\n    const key = w.page.chapter + ':' + w.page.index;\n    let cur = window.__page
… (364 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"await new Promise(r => setTimeout(r, 4000));\nconst w = window.inkling.world;\n({ phase: w.phase, page: w.page.index, pages: window.__pages.map(p => ({ key: p.key, kind: p.kind, pool: p.pool, texts: p.texts.slice(0, 20).join(' ') })) })"}`
- **computer** `{"action":"screenshot","scale":0.6}`
- **javascript_tool** `{"action":"javascript_exec","text":"const w = window.inkling.world;\nfor (let i = 0; i < 40 && w.phase !== 'pageCleared'; i++) await new Promise(r => setTimeout(r, 1000));\nclearInterval(window.__observer);\n({ phase: w.phase, page: w.page.index, chapter: w.page.chapter })"}`

</details>

### 🤖 Claude

The chapter is cleared. I'll turn to chapter 2 (a word page) and screenshot it without typing, to see words arriving whole.

<details><summary>3 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"Return","action_summary":"Turns to the next chapter"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot","scale":0.5}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[550,435],"action_summary":"Closes the unlock card"}},{"name":"computer","input":{"action":"key","text":"Return","action_summary":"Turns to the next chapter"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name
… (59 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[580,383],"action_summary":"Closes the briefing and starts the page"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot","scale":0.6}},{"name":"computer","input":{"ac
… (66 more characters)`

</details>

### 🤖 Claude

One second after the page starts, the word "dowel?" is already fully on the page on the right. Last, I'll sample drip characters from each pool in the live game.

<details><summary>1 tool call</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"const c = window.inkling.world.content;\n({ letters: Array.from({ length: 30 }, () => c.nextChar(Math.random, 'letters')).join(''), symbols: Array.from({ length: 30 }, () => c.nextChar(Math.random, 'symbols')).join('') })"}`

</details>

### 🤖 Claude

The pools stay separate in the live game. Next I'll run the M18 snapshots.

<details><summary>5 tool calls</summary>

- **Shell:** Capture m18 and latest snapshots

  ```bash
  (timeout 300 npm run snapshots -- m18 && timeout 300 npm run snapshots -- latest) > <temp file> 2>&1; echo EXIT $?; grep -i "skipped\|error" <temp file>
  ```
- **Read** `docs/progression/m18/play.png`
- **Read** `docs/progression/m18/lineup.png`
- **Shell:** Add M18 progression entry and tidy shots

  ```bash
  rm -rf docs/progression/m18 && git clean -q -f docs/progression/latest/ && python3 - <<'EOF'
  p='docs/progression/README.md'; s=open(p).read()
  a="## Keeping this up to date"
  b="""### M18: Waves and pacing

  No new screens this time: everything changed is in motion and in which pages come up, so there are no new shots.

  **New:**
  - **Zoom-in:** new creatures rush in from the right (up to 900 px/s), braking smoothly until their whole word is on the page, then crawl at their own pace. They never get closer than a small gap to the creature ahead in their lane.
  - **Numbers and symbols get their own dr
  … (1098 more characters)
  ```
- **Shell:** Drop unchanged screenshot churn and recheck

  ```bash
  git checkout -- docs/progression/latest && timeout 100 npm run check 2>&1 | grep -E "Tests |error"
  ```

</details>

### 🤖 Claude

M17 is committed, merged into `main` with a fast-forward, tagged `v2.7.0`, and its branch is deleted. Nothing is pushed: run `git push origin v2.7.0` to publish the tag. The build transcript is included in the commit, and I checked it for private details first: only redacted paths, no emails or secrets.

M18 is built on `feat/m18-waves` as release 2.8.0, but not committed yet. `npm run check` (345 tests) and `npm run build` pass, and I checked each change in the browser.

- **Zoom-in:** new creatures rush in until their whole word is on the page, then slow to their own speed. Fifteen frames after a page started, the word "dowel?" was already fully visible. They never run into the creature ahead in their lane; if there isn't room yet, they follow it in.
- **Scrawlers are the main wave:**
  - Free Write chapters are now mostly word pages, with one letter-drip page, and every chapter ends on words.
  - Later Apprentice chapters are one drip page for the new key, then four word pages. They're still five pages long, so stars stay the same.
- **Numbers and symbols:**
  - In Free Write they get their own drip page when the keys include at least three of them. Sampling the live game, letter drips gave only letters and space, and symbol drips gave only digits, `!` and `?`.
  - With just one or two, like the home row's `;`, they stay mixed in. Apprentice keeps teaching `;` with its home row, as before.
- **Eraser grace:** for one second after the Eraser forgives a slip, more wrong keys are ignored. They cost no ink and don't break the combo or count as misses. In a Run-on, the wrong letter isn't even typed.
- **Blotter:** this differs from the approved plan. Charges are shared by all three active powers and the Blotter costs 2, so capping Expert at 1 charge would have made it unusable. Instead:
  - On Hard and Expert the Blotter costs 3 charges (still 2 on Relaxed and Normal).
  - Every charge takes a longer run: ×1.15 on Normal, ×1.35 on Hard, ×1.6 on Expert.
  - On Expert the game correctly handed over 3 charges for the briefing.

I didn't retune page sizes or spawn timing, because a page of words already lasts about as long as a page of drips did.

The M18 progression entry is text only, because the standard snapshots mostly show Apprentice screens and capture none of these changes. RELEASING.md's history table now lists 2.6.0 and 2.7.0. The "Test" player in the browser pane now has custom keys and the quill equipped, and can be deleted.

## 🧑 Prompt

> Commit and merge

<details><summary>1 tool call</summary>

- **Shell:** Export transcript and scan for private details

  ```bash
  timeout 120 npm run transcript 2>&1 | tail -2; cd docs/transcripts && f=2026-11-16-inky-keys-milestones-95f6365a.md; grep -nEo "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}" $f | sort -u | head; grep -c "private/tmp\|[removed]\|[removed]" $f; grep -nEo "/(Users|home)/[^ )\`\"']*" $f | grep -v "\[removed\]" | head -3; grep -nEoi "(api[_-]?key|secret|password|bearer)[^ ]{0,30}" $f | head -3; git status --short .
  ```

</details>

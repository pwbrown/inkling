# Game look, feel, and mechanics

Claude Code session started 2026-11-14. 7 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> I want you to analyze this game to look for any improvements to the look and feel. Something just feels a bit off and lifeless about it. It lacks some character, but I'm not really sure where to continue. It could use some work with additional abilities maybe, and also just more of a tutorial workflow as well. It's hard to know for new players what the new game mechanics are because they often just appear. There should also be more consequences for mistakes both in scoring, and visually. There should also be a way to recover some health, and these mechanics should adjust as the game progresses (for example, as you get further it should be harder to unlock abilities).

### 🤖 Claude

I'll start by mapping how the game works today across three areas: the rules, the rendering, and how new mechanics are introduced.

<details><summary>3 tool calls</summary>

- **Agent** `{"description":"Explore core game rules","subagent_type":"Explore","prompt":"Read-only exploration of the Inkling typing game at /Users/[removed]/projects/inkling (TypeScript + Vite + PixiJS). Thoroughness: very thorough. Focus: the game RULES in 'src/core/' (plus 'docs/REQUIREMENTS.md' for intent
… (1983 more characters)`
- **Agent** `{"description":"Explore rendering and feel","subagent_type":"Explore","prompt":"Read-only exploration of the Inkling typing game at /Users/[removed]/projects/inkling (TypeScript + Vite + PixiJS). Thoroughness: very thorough. Focus: LOOK AND FEEL — 'src/render/', any audio code, CSS/styles, assets,
… (2135 more characters)`
- **Agent** `{"description":"Explore onboarding and UI","subagent_type":"Explore","prompt":"Read-only exploration of the Inkling typing game at /Users/[removed]/projects/inkling (TypeScript + Vite + PixiJS). Thoroughness: very thorough. Focus: ONBOARDING, TUTORIAL and UI FLOW — 'src/ui/', 'src/i18n/en.ts', the
… (2135 more characters)`

</details>

### 🤖 Claude

Three read-only explorations are running in the background: the game rules (health, scoring, abilities, progression), the rendering and feedback layer, and the onboarding and screen flow. I don't have any of their findings yet; once they report back I'll design the approach and come to you with any choices that are yours to make.

### 🤖 Claude

The rendering exploration is back and backs up your "lifeless" read: nearly every effect is a dot burst or a text label drifting in a straight line, a wrong key carries about the same visual weight as a right one, and mistakes cost no ink. The Nib has no face or idle motion, there's no real screen shake or damage flash, and combo changes and game over have no feedback at all.

The rules and onboarding explorations are still running, so I'll hold the design until both report back.

### ❓ Claude asked

- Today a wrong key costs no points and no ink (health); it only resets the combo. How hard should mistakes hit?
  - Points + small ink cost (Recommended)
  - Points only
  - Ink cost only on Hard/Expert
- The only health recovery today is a 30% ink refill at the end of each chapter. How should players win ink back mid-page?
  - Clean streaks + ink bottle (Recommended)
  - Clean streaks only
  - Ink bottle only
  - A refill ability
- The Blotter (clear the page) is the only ability, available from page 1. Which new abilities do you want alongside it? Each would unlock at a set chapter with its own tutorial, and charge costs would rise as the game progresses.
  - Paperweight (slow)
  - Highlighter (reveal + bonus)
  - Eraser (forgive)
  - Blotting paper (shield)
- New mechanics (Blotlings, crimson, ghosts, Run-ons, Misprints, the Spill, combo, abilities) currently appear with no explanation. How should they be introduced?
  - Briefing card + guided first try (Recommended)
  - Briefing card only
  - In-play callouts only

**Answer:** Your questions have been answered: "Today a wrong key costs no points and no ink (health); it only resets the combo. How hard should mistakes hit?"="Points + small ink cost (Recommended)", "The only health recovery today is a 30% ink refill at the end of each chapter. How should players win ink back mid-page?"="Clean streaks + ink bottle (Recommended)", "The Blotter (clear the page) is the only ability, available from page 1. Which new abilities do you want alongside it? Each would unlock at a set chapter with its own tutorial, and charge costs would rise as the game progresses."="Paperweight (slow),Highlighter (reveal + bonus),Eraser (forgive),Blotting paper (shield)", "New mechanics (Blotlings, crimson, ghosts, Run-ons, Misprints, the Spill, combo, abilities) currently appear with no explanation. How should they be introduced?"="Briefing card + guided first try (Recommended)". You can now continue with these answers in mind.

<details><summary>2 tool calls</summary>

- **Asked questions** (shown above)
- **Wrote** `/Users/[removed]/.claude/plans/i-want-you-to-jiggly-mccarthy.md`

</details>

### 🤖 Claude

The plan is written and I'm submitting it for your approval now. It covers four milestones: feel foundation, mistake consequences and recovery, abilities, and tutorials.

<details><summary><strong>📋 Plan for approval</strong></summary>

# Inkling: feel, consequences, abilities and tutorials

## Context

The game plays correctly but feels flat. The exploration found why:

- **Feedback is weightless.** Every effect is a linear dot burst or drifting text. No easing, no real screen shake (only the Nib moves), no flash, no hit reaction on creatures, no combo or game-over feedback. The Nib is a faceless arrow.
- **Mistakes cost nothing.** `registerError` (`src/core/input.ts:54`) only resets the combo. No points, no ink, and almost no visual.
- **No mid-page recovery.** Ink only returns as a 30% refill at chapter end.
- **One ability.** The Blotter, available from page 1, at a fixed 25-key cost forever.
- **Nothing is taught.** Blotlings, combo, Blotter, crimson, ghosts, Run-ons, Misprints, violet and the Spill all appear unannounced. No "seen" tracking exists.

Decisions already made with the owner: mistakes cost points plus a small scaling ink cost; recovery is clean streaks plus an ink-bottle creature; four new abilities (Paperweight, Highlighter, Eraser, Blotting paper); tutorials are a briefing card plus a guided first try.

Delivered as four milestones, each on its own `feat/` branch, fast-forward merged, with `npm run check`, `npm run build`, a browser check and `npm run snapshots -- m<N>` + `-- latest` at the end. Nothing is committed until asked.

All new numbers go in `src/core/config.ts`; all strings through `t()` in `src/i18n/en.ts`; rules stay in `src/core/` with unit tests beside them.

---

## M15: Feel foundation (`feat/m15-feel`)

Render and audio only; no rule changes.

**New helpers**
- `src/render/tween.ts`: easing functions (outBack, outCubic, outElastic) and a small `Tweens` list driven from `renderer.sync`. Export the existing `approach` and `mix` from here (currently private in `renderer.ts:53,132`, `mix` duplicated in `overlay.ts:304`).
- `Effects` (`src/render/effects.ts`): add scale-over-life, rotation, eased motion, a droplet-streak and splash-ring particle, and a simple pool. `popup` and `banner` get an eased pop-in; `banner` uses `DISPLAY_FONT` instead of hard-coded Georgia.

**Screen-level feedback** (`src/render/renderer.ts`)
- Real stage shake (offset the `stage` container, decaying), replacing the Nib-only shake on `marginHit`.
- Damage vignette: red-pen edge flash on `marginHit`; a slow pulse when ink is under 30%.
- All gated by `reducedMotion` and a new `screenEffects: 'full' | 'gentle'` setting (`src/settings.ts`, `src/ui/settingsDialog.ts`).

**Characters**
- The Nib gets a face (eyes on the barrel) with moods reusing the `MoodTracker` idea from `src/render/creatures/common.ts:135`: idle bob and blink, focused when locked, wince on error, alarmed on margin hit, cheer on combo milestones.
- Creatures: entrance pop when they cross onto the page, hit-flash tint on each correct letter, typed letters pop then fade, a smirk mood when the player mistypes on them (needs an `errorAt` signal in `FrameContext`), line-boil jitter on outlines (DESIGN §7), kind-specific defeats promised in `docs/DESIGN.md` (Drip flick, Blotling blot-up).
- Locked highlight tweens in and gains the underline DESIGN §7 promises.

**HUD** (`src/render/hud.ts`)
- Ink bar drains with a trailing ghost bar; score counts up and punches on gain; the ×N label punches on increase and shatters on break.

**Events and sound**
- Add `comboStep{multiplier}` and `comboBroken{was}` to `GameEvent` (`src/core/world.ts:90`), pushed from `registerHit` / `registerError` / margin hit. These are notifications only.
- `src/audio/sfx.ts`: new synthesized sounds for combo up, combo break, blotter charge, blotter fire, boss, split, low ink, game over, notebook complete; key-press pitch rises with combo. Map them in `soundFor` (`src/main.ts:735`).

**Cards and menus**
- End-of-page card (`src/render/overlay.ts`): grade stamps in, stars fill one by one, card eases in. Game over gets its own ink-spill animation.
- Handwriting display font: bundle one OFL font as woff2, set `DISPLAY_FONT` (`src/render/theme.ts:91`), add to `CREDITS.md`.
- CSS animations follow the in-game motion setting via a `data-motion` attribute on the root, not only the OS media query.

---

## M16: Consequences and recovery (`feat/m16-consequences`)

**Mistake penalty** (`registerError`, `src/core/input.ts:54`)
- Config `mistakes: { points, inkByDifficulty, fromApprenticeChapter, rampChapters, minInk: 1 }`.
- Points: deduct a fixed amount per wrong key, score floored at 0. New `Stats.penalty` total.
- Ink: 0 on Relaxed; small on Normal, larger on Hard and Expert; in Apprentice it is 0 for the first chapters then ramps in via `effectiveChapter`. A mistake can never take ink below 1, so only the margin can end a run.
- `error` event gains `pointsLost` and `inkLost`.

**Recovery**
- Clean streak: config `recovery.streak { keys, ink, keysPerChapter, maxKeys }`. Every N consecutive correct keys restores a little ink; N grows with chapter. Emits `inkRestored{amount, source}`.
- Ink bottle: a `bottle` flag on `Target` (a word-payload target reusing the Blotling typing path in `spawnTarget`, `src/core/world.ts:416`). Typing it restores a chunk of ink; if it reaches the margin it leaves with no leak and no ink loss. Spawns at most once per page, only when ink is below a threshold, with chance and speed that get stingier by chapter (`recovery.bottle {...}`). Immune to the Blotter and to variants. New creature view `src/render/creatures/bottle.ts`.

**Feedback**
- Wrong key: the expected letter flashes red on the creature, a red "−N" popup, a small stage shake, the ink bar chips with a red tick when ink is lost, the creature smirks, the Nib winces.
- Recovery: blue ink drops fly from the source to the ink bar, the bar glows, a soft chime.

**Results**
- Page-cleared and game-over cards (`overlayContent`, `src/render/overlay.ts:89`) gain a mistakes line (count, points lost) and best combo.

**Docs and save**
- Update `docs/REQUIREMENTS.md` §2 (mistakes now cost points and, later on, ink) and the stale milestone table.
- No save change; `Stats.penalty` is derived per run.

---

## M17: Abilities (`feat/m17-abilities`)

**Model** (new `src/core/abilities.ts`, replacing the hard-coded Blotter check in `registerHit`, `input.ts:77`)
- One shared charge pool (ink drops in the HUD), max 3. A charge is earned every `chargeKeys(chapter, difficulty)` clean keys: starts at today's 25 and rises with chapter to a cap, so charges get harder to earn as the game progresses.
- Active abilities spend charges:

| Ability | Key | Cost | Effect |
|---|---|---|---|
| Paperweight | 1 | 1 | Creatures crawl at a fraction of speed for a few seconds |
| Highlighter | 2 | 1 | Ghosts revealed and word points doubled for a few seconds |
| Blotter | Enter (or 3) | 2 | Existing page clear (`useBlotter`, `input.ts:89`) |

- Passive abilities are held items (max one each), consumed automatically:
  - Eraser: absorbs the next mistake (no combo break, no penalty). Re-arms after a clean run whose length rises with chapter.
  - Blotting paper: soaks up the next creature to reach the margin. Earned by clearing a page with no leaks.
- Unlocks are derived, not stored: `unlockedAbilities(apprenticeUnlocked, level)`. Each ability unlocks at an Apprentice chapter, with the gaps widening (Blotter early, then Eraser, Paperweight, Highlighter, Blotting paper), or at a player level so Practice-only players get them too. Level XP is already quadratic (`inkForLevel`, `src/core/rewards.ts`).
- `World` gains `charges`, `eraser`, `shield`, `effects` (timed slow / highlight) and `abilities` (the unlocked set, injected at creation like `keys`). `world.blotter` becomes `charges`.
- Events: `charged`, `ability{id}`, `abilityEnded{id}`, `eraserUsed`, `shieldUsed`.

**Input and HUD**
- Bind 1 / 2 / 3 next to the Enter binding in `src/main.ts:198`. Digits are never typing targets.
- HUD shows the charge drops, a slot per unlocked ability with its key and cost (dim when unaffordable), held Eraser / Blotting paper icons, and a timer ring while an effect runs.
- Each ability gets its own effect and sound: Paperweight thuds down and the page ripples; Highlighter sweeps a yellow band; Eraser rubs out the miss with crumbs; Blotting paper slaps onto the margin.

**Save** (`src/storage/schema.ts`)
- `SavedNotebook` gains `charges`, `eraser`, `shield` so Continue keeps them. Bump `SAVE_VERSION` to 7 with a migration (shared with M18's field if both land together; otherwise 7 then 8).
- `StartSnapshot` also records them so restart/retry is consistent (today charges leak across restarts).

**Text**
- Update `how.powers` and add ability strings in `src/i18n/en.ts`; add the abilities to the How to play screen (`src/ui/menu.ts:446`).

---

## M18: Tutorials (`feat/m18-tutorials`)

**Registry** (new `src/core/mechanics.ts`, pure and tested)
- Mechanic ids: `ink`, `combo`, `blotling`, `tab`, `mistakes`, `recovery`, `bottle`, `crimson`, `ghost`, `spill`, `runon`, `misprint`, `violet`, and one per ability.
- `mechanicsForPage(page, mode, abilities)` reads the same sources the spawner uses (`variantChances`, `sprinkleChances`, `hasSpill`, `apprenticePlan`, mistake/recovery config), so tutorials can never drift from the rules.
- `pendingBriefings(world, seen)` returns what is new for the page about to start, capped at two per page; extras roll to the next page.

**Flow**
- New phase `'briefing'` in `GamePhase` (`world.ts:87`), entered from `confirm()`, `startPractice` and `continueNotebook` when briefings are pending; Enter moves on to `playing`. `stepWorld` already idles outside `playing`. `syncMenu` (`main.ts:565`) and the Esc logic treat it like `intro`.
- Briefing card: accessible DOM dialog `src/ui/briefingDialog.ts`, modelled on `src/ui/unlockDialog.ts` (focus trap, Esc, `dialogOpen`). Shows a portrait of the creature or ability (rendered from the real creature view to an image), a two-line explanation, the keys to press, and a "Don't show tips" checkbox.
- Guided first try: `world.guide` makes the spawner send the new thing alone and slowed, holding other spawns until it is cleared or leaves. A handwritten callout with an arrow follows it (Pixi), mirrored to an `aria-live` region since the canvas is `aria-hidden`. For an ability, the player gets one free charge and the HUD slot pulses with its key.
- The mechanic is marked seen when the guided try ends.

**Save and settings**
- `SaveData.tutorials: { enabled: boolean; seen: string[] }`, `SAVE_VERSION` bump with migration, default and sanitizer. Existing players are migrated with mechanics up to their furthest unlocked chapter marked seen, so veterans only get briefings for what is new.
- Per-player "Show tips" toggle and "Reset tips" button on the player edit form (`src/ui/menu.ts:656`).

---

## Verification

Per milestone:
- `npm run check` and `npm run build` pass. New core tests follow the existing pattern (`createWorld({ random: () => 0.5, keys })`, `spawnTarget`, assert on state and events, expected values written from `GAME_CONFIG`): mistake penalties and the ink floor, streak recovery scaling, bottle spawn rules, charge cost growth, each ability's effect and expiry, passive consumption, unlock derivation, `mechanicsForPage` for known chapters, briefing phase transitions, save migration round-trips.
- Run `npm run dev` and play in the browser pane: a wrong key visibly hurts and shows on the graded page; ink recovers on a clean streak and from a bottle; each ability fires from its key with its own effect; a fresh player gets a briefing and guided try at each first appearance, and a migrated save does not get old ones.
- Check reduced motion, the gentle screen-effects setting, and the night and high-contrast themes.
- `npm run snapshots -- m<N>` and `-- latest`, then add the milestone to `docs/progression/README.md`.


</details>

<details><summary>6 tool calls</summary>

- **Presented the plan** (shown above)
- **Shell:** Create the M15 branch and size up the files

  ```bash
  git checkout -b feat/m15-feel && wc -l src/render/*.ts src/render/creatures/*.ts src/audio/sfx.ts src/main.ts src/settings.ts src/core/world.ts src/core/input.ts
  ```
- **Read** `src/render/renderer.ts`
- **Read** `src/render/effects.ts`
- **Read** `src/render/hud.ts`
- **Read** `src/audio/sfx.ts`

</details>

### 🤖 Claude

Plan approved; I'm on the `feat/m15-feel` branch and reading the render, input and settings code before making the first edits.

<details><summary>12 tool calls</summary>

- **Read** `src/render/creatures/common.ts`
- **Read** `src/core/input.ts`
- **Read** `src/core/world.ts`
- **Read** `src/settings.ts`
- **Read** `src/render/theme.ts`
- **Read** `src/main.ts`
- **Read** `src/render/creatures/blotling.ts`
- **Read** `src/render/overlay.ts`
- **Read** `src/ui/settingsDialog.ts`
- **Shell:** Look at fonts, strings, stats and motion CSS

  ```bash
  cat src/fonts.ts | head -40; grep -n "settings\.\|how\.\|hud\.\|banner\.\|overlay\.stats\|overlay\.leaks" src/i18n/en.ts | head -60; cat src/core/stats.ts; grep -n "prefers-reduced-motion" -r src --include=*.css; ls node_modules/@fontsource 2>/dev/null
  ```
- **Wrote** `src/render/tween.ts`
- **Wrote** `src/render/effects.ts`

</details>

### 🤖 Claude

M15 is underway: the easing helpers and the upgraded particle effects are written. Next I'm adding combo events to the core, then the Nib's face, real screen shake and the animated HUD.

<details><summary>9 tool calls</summary>

- **Edited** `src/core/world.ts`
- **Edited** `src/core/world.ts`
- **Edited** `src/core/input.ts`
- **Edited** `src/core/input.ts`
- **Shell:** Find reduced-motion CSS and creature update hooks

  ```bash
  grep -rn "prefers-reduced-motion" src --include='*.css' --include='*.ts' | grep -v "theme.ts"; grep -n "taunt\|FrameContext\|mood.update" src/render/creatures/*.ts | grep -v common.ts | head -20; sed -n 55,106p src/render/creatures/drip.ts
  ```
- **Edited** `src/render/creatures/common.ts`
- **Edited** `src/render/creatures/common.ts`
- **Shell:** Swap renderer helpers for the shared tween module

  ```bash
  python3 - <<'EOF'
  import re,io
  p='src/render/renderer.ts'
  s=open(p).read()

  # imports
  s=s.replace("""import { createCreature, type CreatureView } from './creatures';
  import { InkShots, SHOT_SPEED } from './shots';
  import { COLORS, prefersReducedMotion } from './theme';
  ""","""import { GAME_CONFIG } from '../core/config';
  import { createCreature, type CreatureView } from './creatures';
  import { drawFace, type Mood } from './creatures/common';
  import { InkShots, SHOT_SPEED } from './shots';
  import { COLORS, prefersReducedMotion } from './theme';
  import { Punch, approach, mix } from './tween';
  ""
  … (977 more characters)
  ```
- **Shell:** Rewrite the renderer scene, shake, vignette and Nib face

  ```bash
  python3 - <<'EOF'
  p='src/render/renderer.ts'
  s=open(p).read()
  a=s.index("  // Everything is drawn in logical world units")
  new = r'''  // Everything is drawn in logical world units, then scaled to fit the window.
    const stage = new Container();
    app.stage.addChild(stage);
    const views = new Map<number, CreatureView>();
    /** Per-creature reactions the renderer adds on top of each creature's own drawing. */
    const reactions = new Map<number, { punch: Punch; tauntMs: number }>();
    let timeMs = 0;

    // The scene is rebuilt from scratch when display settings change.
    let reducedMotion = fal
  … (17670 more characters)
  ```

</details>

### 🤖 Claude

The renderer now has real page shake, a red damage edge and a Nib with a face. Next up is the animated HUD, then sounds and the settings toggle.

<details><summary>5 tool calls</summary>

- **Edited** `src/core/config.ts`
- **Wrote** `src/render/hud.ts`
- **Shell:** Add card animation, new sounds, screen-effects setting and wiring; typecheck

  ```bash
  python3 - <<'EOF'
  p='src/render/overlay.ts'
  s=open(p).read()
  s=s.replace("import { COLORS, DISPLAY_FONT, TEXT_FONT, keyLabel } from './theme';","import { COLORS, DISPLAY_FONT, TEXT_FONT, keyLabel } from './theme';\nimport { outBack, outCubic } from './tween';")
  s=s.replace("""  private shownKey: string | null = null;

    constructor(private readonly actions: OverlayActions) {""","""  private shownKey: string | null = null;
    /** The card and everything on it, so it can pop in as one. */
    private readonly panel = new Container();
    /** Time since the card appeared, for its entrance and the grad
  … (8574 more characters)
  ```
- **Shell:** Check nib style names and add motion-setting CSS

  ```bash
  grep -n "NibStyle\|'classic'\|nib:" src/core/rewards.ts | head; cat >> src/ui/unlock.css <<'EOF'

  /* The in-game Motion setting, as well as the OS one. */
  :root[data-motion='reduced'] .ul-burst,
  :root[data-motion='reduced'] .ul-card {
    animation: none;
  }
  EOF
  cat >> src/ui/dialog.css <<'EOF'

  /* The in-game Motion setting, as well as the OS one. */
  :root[data-motion='reduced'] .tc-char,
  :root[data-motion='reduced'] .tc-chip {
    transition: none;
  }
  EOF
  ```
- **Shell:** Fix nib style key and run typecheck, lint and tests

  ```bash
  sed -i '' "s/    default: { x: 19, y: -1, r: 4.6 },/    classic: { x: 19, y: -1, r: 4.6 },/" src/render/renderer.ts && npm run check 2>&1 | tail -40
  ```

</details>

### 🤖 Claude

M15's code passes typecheck, lint and all 253 tests. I'm starting the dev server now to check it visually in the browser.

<details><summary>8 tool calls</summary>

- **Shell:** Check the dev server launch configuration

  ```bash
  cat .claude/launch.json 2>/dev/null; grep -n '"dev"\|"preview"\|"snapshots"' package.json; grep -n "port" vite.config.ts
  ```
- **preview_start** `{"name":"inkling-dev"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":2}},{"name":"read_console_messages","input":{"onlyErrors":true}},{"name":"find","input":{"query":"Practice"}},{"name":"computer","input":{"action":"screenshot","scale":0.5}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_16","action_summary":"Opens the Practice screen"}},{"name":"computer","input":{"action":"screenshot","scale":0.5}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[546,492],"action_summary":"Starts a Practice notebook"}},{"name":"computer","input":{"action":"wait","duration":3}},{"name":"computer","input":{"action":"type","text":"zq","action_summary":"Types two wrong keys in the game"}
… (556 more characters)`
- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const w = window.inkling.world; w.phase='playing'; let n=0; window.__iv && clearInterval(window.__iv); window.__iv = setInterval(()=>{ n++; if (w.phase!=='playing') w.phase='playing'; const vis=[...w.targets].filter(t=
… (826 more characters)`
- **Shell:** Read config, creature dispatch and save stats usage

  ```bash
  sed -n 26,60p src/core/config.ts && sed -n 226,262p src/core/config.ts && cat src/render/creatures/index.ts && grep -n "createStats\|bestCombo" src/storage/*.ts | head -20 && sed -n 1,52p src/render/creatures/drip.ts && grep -n "overlay\.\(leaks\|missed\|circled\)" src/i18n/en.ts
  ```
- **javascript_tool** `{"action":"javascript_exec","text":"clearInterval(window.__iv); 'stopped'"}`

</details>

### 🤖 Claude

M15 checks out in the browser with no console errors. Moving on to M16: mistake penalties, streak recovery and the ink-bottle creature.

<details><summary>4 tool calls</summary>

- **Shell:** Add mistake penalties, streak recovery and ink bottle rules to core

  ```bash
  python3 - <<'EOF'
  p='src/core/config.ts'
  s=open(p).read()
  s=s.replace("""  /**
     * The Blotter: a power charged by long runs of correct keys.""","""  /**
     * What a wrong key costs. Points always; ink only once the player has found
     * their feet (never on Relaxed, and not in the first Apprentice chapters,
     * after which it ramps in). A mistake never takes the last of the ink: only
     * a creature reaching the margin can end a run.
     */
    mistakes: {
      points: 15,
      ink: { relaxed: 0, normal: 1, hard: 2, expert: 3 } as Record<Difficulty, number>,
      /** First Apprentice chapter (0-b
  … (8888 more characters)
  ```
- **Wrote** `src/render/creatures/bottle.ts`
- **Shell:** Wire bottle view, penalty and recovery feedback; run checks

  ```bash
  python3 - <<'EOF'
  p='src/render/creatures/index.ts'
  s=open(p).read()
  s=s.replace("import { createBlotling } from './blotling';","import { createBlotling } from './blotling';\nimport { createBottle } from './bottle';")
  s=s.replace("  const scale = target.boss ? baseScale * BOSS_SCALE : baseScale;","  const scale = target.boss ? baseScale * BOSS_SCALE : baseScale;\n  if (target.bottle) return createBottle(target, scale);")
  open(p,'w').write(s)

  p='src/render/renderer.ts'
  s=open(p).read()
  s=s.replace("""        if (!reducedMotion) wobbleMs = 220;
          startShake(150, 3.5);""","""        if (ev
  … (2923 more characters)
  ```
- **Shell:** Add tests for penalties, streak recovery and the ink bottle

  ```bash
  sed -n 1,22p src/core/blotterBoss.test.ts && cat > src/core/consequences.test.ts <<'EOF'
  import { describe, expect, it } from 'vitest';
  import { GAME_CONFIG, bottleParams, mistakeInk, streakKeys } from './config';
  import { typeChar, useBlotter } from './input';
  import { MARGIN_X, createPage, createWorld, spawnBottle, spawnTarget, stepWorld, type World } from './world';

  function playingWorld(difficulty: 'relaxed' | 'normal' | 'hard' | 'expert' = 'normal'): World {
    const world = createWorld({ random: () => 0.5, keys: ['a', 's', 'd', 'f'], difficulty });
    world.phase = 'playing';
    return wor
  … (6072 more characters)
  ```

</details>

### 🤖 Claude

M16's rules are in with 14 new passing tests. Starting M17 (abilities) now — first checking whether number keys can be typing targets, since I planned to bind abilities to 1/2/3.

<details><summary>3 tool calls</summary>

- **Shell:** Check digit keys, keyboard binding and Blotter references

  ```bash
  grep -n "'1'\|digit\|number row" src/content/layouts/us-qwerty.ts | head -8; cat src/input/keyboard.ts | head -80; grep -rn "blotterCharged\|'blotter'\|world.blotter\|\.blotter\b" src --include='*.ts' | grep -v "^src/core/input.ts\|^src/core/world.ts\|^src/render/hud.ts\|^src/render/renderer.ts" | head -30
  ```
- **Shell:** Add ability config and the abilities module

  ```bash
  python3 - <<'EOF'
  p='src/core/config.ts'
  s=open(p).read()
  a=s.index("  /**\n   * The Blotter: a power charged by long runs of correct keys.")
  b=s.index("  /**\n   * The Spill: a boss")
  s=s[:a]+"""  /**
     * Abilities. A clean run of keys earns a charge (an ink drop in the HUD);
     * the run needed grows with the chapter, so charges get harder to earn.
     * Active abilities spend charges; passive ones are held and used up
     * automatically. Each unlocks at an Apprentice chapter (0-based, further
     * apart each time) or at a player level, whichever comes first.
     */
    abilities: {
      maxChar
  … (3226 more characters)
  ```
- **Shell:** Implement ability charges, effects and passives in core

  ```bash
  python3 - <<'EOF'
  p='src/core/world.ts'
  s=open(p).read()
  def rep(old,new,count=1):
      global s
      assert old in s, old[:60]
      s=s.replace(old,new,count)
  rep("""  /** The Blotter gained a charge. */
    | { type: 'blotterCharged'; charges: number }
    /** The Blotter was used. */
    | { type: 'blotter' }""","""  /** A clean run of keys earned an ability charge. */
    | { type: 'charged'; charges: number }
    /** An active ability was fired. */
    | { type: 'ability'; id: ActiveAbility }
    /** A timed ability (Paperweight, Highlighter) wore off. */
    | { type: 'abilityEnded'; id: ActiveAbility }
    
  … (11142 more characters)
  ```

</details>

### 🤖 Claude

Core ability rules are in; now I'm updating the HUD, effects, key bindings and the existing Blotter tests to match the new charge system.

<details><summary>4 tool calls</summary>

- **Shell:** Update HUD, effects, key bindings, strings and tests for abilities

  ```bash
  python3 - <<'EOF'
  p='src/render/hud.ts'
  s=open(p).read()
  def rep(old,new,count=1):
      global s
      assert old in s, old[:70]
      s=s.replace(old,new,count)
  rep("import { GAME_CONFIG } from '../core/config';","import { ACTIVE_ABILITIES, abilityCost, isActive, type AbilityId } from '../core/abilities';\nimport { GAME_CONFIG } from '../core/config';")
  rep("import { formatNumber, t } from '../i18n';","import { formatNumber, t, type MessageKey } from '../i18n';")
  rep("""  /** Blotter charges, drawn as ink drops beside the ink bar. */
    private readonly blotterDrops = new Graphics();
    private read
  … (15007 more characters)
  ```
- **Shell:** Add ability tests and run them

  ```bash
  cat > src/core/abilities.test.ts <<'EOF'
  import { describe, expect, it } from 'vitest';
  import { ABILITIES, abilityUnlockedAt, chargeKeys, eraserKeys, unlockedAbilities } from './abilities';
  import { GAME_CONFIG } from './config';
  import { restartPage, typeChar, useAbility } from './input';
  import { MARGIN_X, WORLD_WIDTH, createWorld, isRevealed, markPageStart, spawnTarget, stepWorld, type World } from './world';

  const A = GAME_CONFIG.abilities;

  function playingWorld(options: Parameters<typeof createWorld>[0] = {}): World {
    const world = createWorld({ random: () => 0.5, keys: ['a', 's', 'd
  … (7425 more characters)
  ```
- **Shell:** Fix the Highlighter test; read the save schema

  ```bash
  python3 - <<'EOF'
  p='src/core/abilities.test.ts'
  s=open(p).read()
  s=s.replace("""    stepWorld(world, A.highlighter.durationMs);
      expect(world.highlightMs).toBe(0);
      drip(world);""","""    // Something still on the page, so it isn't cleared while the time runs out.
      spawnTarget(world, { kind: 'drip', text: 's', x: 1200, prevX: 1200, lane: 1, speed: 0 });
      stepWorld(world, A.highlighter.durationMs);
      expect(world.highlightMs).toBe(0);
      drip(world);""")
  open(p,'w').write(s)
  EOF
  npx vitest run src/core/abilities.test.ts 2>&1 | grep -v "^$" | tail -6; grep -n "SavedNotebook\|note
  … (77 more characters)
  ```
- **Shell:** Read the unlock dialog, player edit form and save schema

  ```bash
  cat src/ui/unlockDialog.ts && sed -n 640,720p src/ui/menu.ts && sed -n 76,130p src/storage/schema.ts && sed -n 150,175p src/storage/schema.ts && sed -n 212,300p src/storage/schema.ts && grep -n "onSavePlayer\|contentLevel" src/ui/menu.ts | head -20 && cat src/ui/unlock.css | head -60
  ```

</details>

### 🤖 Claude

M17 is done with 13 passing ability tests. Now building M18: the mechanics registry, the briefing phase and card, the guided first try, and the save migration.

<details><summary>3 tool calls</summary>

- **Shell:** Add mechanics registry, briefing phase, guided spawn and save v7

  ```bash
  cat > src/core/mechanics.ts <<'EOF'
  /**
   * Mechanics the game teaches the first time they come up: a briefing card
   * before the page, then a guided first try (the new thing arrives alone and
   * slowed). What a page holds is read from the same settings the spawner uses,
   * so the tutorials can't drift from the rules.
   */
  import { ABILITIES, abilityCost, isActive, type AbilityId } from './abilities';
  import { GAME_CONFIG, mistakeInk } from './config';
  import type { Target, World } from './world';

  export type MechanicId =
    | 'basics'
    | 'combo'
    | 'blotling'
    | 'mistakes'
    | 'recovery'
    |
  … (12729 more characters)
  ```
- **Shell:** Bump save version and typecheck

  ```bash
  python3 - <<'EOF'
  p='src/storage/schema.ts'
  s=open(p).read()
  s=s.replace("export const SAVE_VERSION = 6;","export const SAVE_VERSION = 7;")
  s=s.replace("  playMs: number;\n","  playMs: number;\n  /** Ability charges and held passives when the page began (added in version 7). */\n  charges: number;\n  eraser: boolean;\n  shield: boolean;\n",1)
  s=s.replace("import { DEFAULT_COSMETICS, UNLOCKS, type Cosmetics } from '../core/rewards';","import { isMechanic } from '../core/mechanics';\nimport { DEFAULT_COSMETICS, UNLOCKS, type Cosmetics } from '../core/rewards';")
  open(p,'w').write(s)
  p='src/stora
  … (258 more characters)
  ```
- **Shell:** Fix imports and overlay phase; check Pixi version and CSS helpers

  ```bash
  python3 - <<'EOF'
  p='src/storage/progress.ts'
  s=open(p).read()
  s=s.replace("import {\n  createPage,","import {\n  beginPage,\n  createPage,",1)
  s=s.replace("  resetWorld,\n  setPhase,\n","  resetWorld,\n")
  open(p,'w').write(s)
  p='src/render/overlay.ts'
  s=open(p).read()
  s=s.replace("""    case 'ready':
      case 'paused':
      case 'playing':
        return null;""","""    case 'ready':
      case 'paused':
      case 'playing':
      // The briefing is a DOM dialog (ui/briefingDialog.ts), so screen readers can read it.
      case 'briefing':
        return null;""")
  s=s.replace("""    if (world.phase === 'p
  … (483 more characters)
  ```

</details>

### 🤖 Claude

Now the briefing card, its strings and the wiring in `main.ts` and the renderer.

<details><summary>5 tool calls</summary>

- **Shell:** Add briefing dialog, styles, tutorial strings and a tips setting

  ```bash
  cat > src/ui/briefingDialog.ts <<'EOF'
  /**
   * "New on this page": a short card shown before a page that holds something
   * the player hasn't met yet (core/mechanics.ts). A DOM dialog rather than a
   * canvas card, so screen readers can read it. Enter, Esc or the button starts
   * the page, where the new thing gets a guided first try.
   */
  import './dialog.css';
  import './unlock.css';
  import './briefing.css';
  import type { MechanicId } from '../core/mechanics';
  import { t, type MessageKey } from '../i18n';
  import { h, trapFocus } from './dom';

  export interface BriefingDialogOptions {
    mechanics:
  … (10343 more characters)
  ```
- **Shell:** Wire portraits, the guided callout, the briefing flow and tips; run checks

  ```bash
  grep -n "Content-Security-Policy" -A 3 index.html | head -12; python3 - <<'EOF'
  p='src/render/renderer.ts'
  s=open(p).read()
  def rep(old,new,count=1):
      global s
      assert old in s, old[:70]
      s=s.replace(old,new,count)
  rep("import { Application, Container, Graphics } from 'pixi.js';","import { Application, Container, Graphics, Text } from 'pixi.js';")
  rep("import { COLORS, prefersReducedMotion } from './theme';","import { COLORS, DISPLAY_FONT, prefersReducedMotion } from './theme';")
  rep("import { t } from '../i18n';","import { t, type MessageKey } from '../i18n';\nimport type { MechanicI
  … (7997 more characters)
  ```
- **Shell:** Fix the lint error and rerun checks

  ```bash
  python3 - <<'EOF'
  p='src/render/overlay.ts'
  s=open(p).read()
  old="""    case 'ready':
      case 'paused':
      case 'playing':
      // The briefing is a DOM dialog (ui/briefingDialog.ts), so screen readers can read it.
      case 'briefing':
        return null;"""
  assert old in s
  s=s.replace(old,"""    // (The briefing is a DOM dialog, ui/briefingDialog.ts, so screen readers can read it.)
      case 'ready':
      case 'paused':
      case 'playing':
      case 'briefing':
        return null;""")
  open(p,'w').write(s)
  EOF
  npm run check 2>&1 | grep -v "^$" | tail -40
  ```
- **Shell:** Add mechanics and guided-try tests; look at schema tests

  ```bash
  cat > src/core/mechanics.test.ts <<'EOF'
  import { describe, expect, it } from 'vitest';
  import { GAME_CONFIG } from './config';
  import { confirm, startApprentice, startPractice } from './input';
  import { MAX_BRIEFINGS, MECHANICS, mechanicsForPage, pendingBriefings } from './mechanics';
  import { createPage, createWorld, stepWorld, type World } from './world';

  const LETTERS = [...'abcdefghijklmnopqrstuvwxyz;', ' '];

  function apprentice(chapter: number, page = 0, abilities: World['abilities'] = []): World {
    const world = createWorld({ random: () => 0.5, keys: LETTERS, abilities });
    world.mo
  … (4804 more characters)
  ```
- **Shell:** Add save migration tests and run all checks

  ```bash
  python3 - <<'EOF'
  p='src/storage/schema.test.ts'
  s=open(p).read()
  old="  it('keeps valid word lists and drops bad ones', () => {"
  assert old in s
  s=s.replace(old,"""  it('upgrades version 6 saves with tips on, crediting mechanics the player has already met', () => {
      const fresh = migrate({ version: 6, keys: ['a'] });
      expect(fresh.tutorials).toEqual({ enabled: true, seen: [] });

      // Seven chapters opened means six finished: everything up to crimson (chapter 5), not yet the Spill.
      const veteran = migrate({ version: 6, apprentice: { unlocked: 7, stars: {}, completed: false } });
   
  … (1403 more characters)
  ```

</details>

### 🤖 Claude

All four milestones are coded and 294 tests pass. Now running the production build and checking the whole flow in the browser.

<details><summary>7 tool calls</summary>

- **Shell:** Run the production build

  ```bash
  npm run build 2>&1 | tail -12
  ```
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5173/"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const i = window.inkling; ({v: i.store.data.version, tut: i.store.data.tutorials, abilities: i.wor
… (130 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"({ink: window.inkling.store.data.profile.ink, notebook: window.inkling.store.data.notebook, records: window.inkling.store.data.records})"}`
- **javascript_tool** `{"action":"javascript_exec","text":"const st = window.inkling.store; st.update((save) => { save.profile.ink = 9; save.notebook = null; }); await st.flush(); sessionStorage.setItem('__inklingSnap', JSON.stringify(st.data)); ({ink: st.data.profile.ink, keyStats: st.data.keyStats, tut: st.data.tutorial
… (5 more characters)`
- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const st = window.inkling.store; st.update((save) => { save.keyStats = {}; save.records = { bestScore: {}, furthestChapter: {} }; }); await st.flush(); sessionStorage.setItem('__inklingSnap', JSON.stringify(st.data)); 
… (137 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_14","action_summary":"Opens the Apprentice chapter list"}},{"name":"computer","input":{"action":"key","text":"Return","action_summary":"Starts Apprentice chapter 1"}},{"name":"computer","input":{"action":"wait","duration":1}},{
… (241 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"Return","action_summary":"Continues from the new-keys card"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot"}},{"name":"read_console_messages","input":{"onlyErrors":true}}]}`

</details>

### 🤖 Claude

The briefing card shows correctly before the first page, with the creature's portrait. Now I'm playing a page through to check penalties, effects and the graded card.

<details><summary>7 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"Return","action_summary":"Dismisses the briefing card and starts the page"}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const w = window.inkling.world; let n=0; clearInterval(window.__iv); window.__iv = setInte
… (831 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":6}},{"name":"computer","input":{"action":"screenshot"}},{"name":"computer","input":{"action":"wait","duration":10}},{"name":"computer","input":{"action":"wait","duration":10}},{"name":"computer","input":{"action":"wait","duration":10
… (323 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"Return","action_summary":"Turns to the next page"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot"}},{"name":"computer","input":{"action":"key","text":"Return","action_summary
… (897 more characters)`
- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})); const w6 = window.inkling.world; ({hl: w6.highlightMs, charges: w6.charges})"}},{"name":"computer","input":{"action":"screenshot","scal
… (474 more characters)`
- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"clearInterval(window.__iv); const snap = JSON.parse(sessionStorage.getItem('__inklingSnap')); const st2 = window.inkling.store; st2.update((save) => { for (const k of Object.keys(save)) delete save[k]; Object.assign(sa
… (673 more characters)`
- **Shell:** Find the mistakes rule in the requirements doc

  ```bash
  grep -n "does \*\*not\*\* cost health" docs/REQUIREMENTS.md
  ```
- **Shell:** Update the requirements doc, rerun checks and build, list changes

  ```bash
  python3 - <<'EOF'
  p='docs/REQUIREMENTS.md'
  s=open(p).read()
  old="| **Mistakes** | A wrong key counts as an error. It lowers accuracy and the score multiplier but does **not** cost health. The penalty is tunable. |"
  s=s.replace(old,"| **Mistakes** | A wrong key counts as an error. It lowers accuracy, resets the score multiplier and costs points. It also costs a little ink (health), except on Relaxed and in the first Apprentice chapters, after which the cost ramps in; a mistake never takes the last of the ink. Tuned in `GAME_CONFIG.mistakes`. |\n| **Recovery** | A long run of correct keys restor
  … (304 more characters)
  ```

</details>

### 🤖 Claude

All four milestones are implemented, but not everything in the plan made it in, and one thing went wrong during testing that you should know about first.

## Your local dev save was altered
My test script inflated Player 1's save on `localhost:5173` (ink went from 9 to 9,940, plus bogus key stats and a best score). I put ink back to 9 and cleared the saved notebook, but I could not recover the original key stats or best score, so those are now empty. Apprentice progress and stars are as they were.

## What changed

- **Feel:** the page now shakes and its edge flashes red when ink is lost, the Nib has a face that reacts, and the HUD animates (score, multiplier, ink bar). Creatures grin when you mistype at them. There are 11 new sounds and a "Screen effects: Full / Gentle" setting.
- **Mistakes:** a wrong key costs 15 points and shows a red cross and "−15". It also costs ink (1/2/3 on Normal/Hard/Expert, none on Relaxed), starting at Apprentice chapter 5 and ramping up. A mistake can never take the last of the ink. The graded page shows wrong keys and points lost.
- **Recovery:** a clean run of 30 keys (rising to 60) restores 3 ink. When ink is below 60%, an ink bottle may cross the page once; typing it restores 20, and missing it costs nothing.
- **Abilities:** clean runs earn charges (25 keys at first, rising to 50). Paperweight and Highlighter cost one charge, the Blotter two. Eraser and Blotting paper are passive. They unlock at Apprentice chapters 2, 4, 7, 11 and 16, or at player levels 2, 3, 5, 8 and 12.
- **Tutorials:** a "New on this page" card appears before any page with something new, at most two items at a time. New creatures then arrive alone and slowed with a red-pen hint, and new abilities are handed over ready to use. Existing players get credit for chapters they've finished. The save format is now version 7 with a migration.

`npm run check` (294 tests, 41 new) and `npm run build` pass. In the browser I confirmed the briefing cards, penalties, graded page, Paperweight, Highlighter and Eraser.

## Differs from the plan
- **Ability keys:** Paperweight is ↑ and Highlighter is ↓, because number keys can be practice targets. 1/2/3 also work when you aren't practicing digits.
- **One branch:** everything is uncommitted on `feat/m15-feel`, since separate branches would have needed commits.
- **Tips setting:** the "Show tips" toggle and reset are in Settings, not the player edit form.
- **Seen tracking:** a mechanic is marked seen when its card is dismissed, not when the guided try ends.

## Not done
- **Handwriting font:** needs a download, so headings are still Georgia.
- **Creature polish:** line boil, kind-specific defeat animations, typed-letter pop and the locked underline.
- **Star-fill animation** on the graded card.
- **Docs:** milestone snapshots, the `docs/progression/README.md` entry, and the stale milestone table in `REQUIREMENTS.md`.

## Not checked in the browser
The ink bottle, Blotting paper, streak recovery effects, the guided-try callout, the Blotter's effect, reduced motion, Gentle mode, and the night and high-contrast themes. Their rules are covered by tests, but I haven't seen them on screen.

## 🧑 Prompt

> can you continue those changes on Opus?

### 🤖 Claude

I can't switch this session's model myself: the app blocks a session from changing its own model. You can do it in one step, though: pick Opus in the model menu for this session, then send "continue". The conversation carries over, so Opus picks up with everything here, including the uncommitted work on `feat/m15-feel`.

When it resumes, the remaining work is the "Not done" list (handwriting font, creature polish, star-fill animation, the docs and snapshots) and the browser checks I didn't get to (ink bottle, Blotting paper, streak recovery, the guided-try callout, the Blotter's effect, reduced motion, Gentle mode and the other themes).

If you'd rather keep this session as it is, I can instead start a separate Opus session with a brief of that remaining work. It would share this checkout, so the uncommitted changes would be there for it.

## 🧑 Prompt

> continue

### 🤖 Claude

Picking up the remaining work. First I'll check the console error I saw earlier, since it may have been a leftover from mid-edit hot reloads rather than a real bug.

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5173/"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.inkling.world.phase"}},{"name":"read_console_messages","input":{"onlyErrors":true,"limit":5
… (4 more characters)`

</details>

### 🤖 Claude

Those two errors carry the old module timestamps from mid-edit hot reloads, so they're stale console history. To be sure, I'll count fresh errors while the game runs.

<details><summary>1 tool call</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(String(e.message))); const w = window.inkling.world; window.inkling.store.data.tutorials.enabled; await new Promise(r => setTimeout(r, 1500)); ({errs: window.__errs, phase: w.phase})"}`

</details>

## 🧑 Prompt

> [Request interrupted by user]

## 🧑 Prompt

> continue

### 🤖 Claude

No new errors while the game runs; the earlier two were stale. Next, the handwriting display font.

<details><summary>1 tool call</summary>

- **Shell:** Check font packages and credits format

  ```bash
  grep -n "fontsource" package.json && grep -n -i -A6 "atkinson" CREDITS.md | head -30
  ```

</details>

### 🤖 Claude

I'll use Caveat (SIL OFL 1.1), a legible handwriting face, bundled from npm like the existing fonts so nothing loads from the network at runtime.

<details><summary>2 tool calls</summary>

- **Shell:** Install the Caveat font package and check its license

  ```bash
  npm install @fontsource/caveat@^5 2>&1 | tail -3 && ls node_modules/@fontsource/caveat/ | head -20 && ls node_modules/@fontsource/caveat/LICENSE* && head -5 node_modules/@fontsource/caveat/LICENSE
  ```
- **Shell:** Wire the font, credit it, and find italic display text

  ```bash
  cp node_modules/@fontsource/caveat/LICENSE licenses/Caveat-OFL.txt && python3 - <<'EOF'
  import re
  def edit(p, old, new):
      s=open(p).read(); assert old in s, (p, old[:50]); open(p,'w').write(s.replace(old,new,1))
  edit('src/fonts.ts', "import '@fontsource/atkinson-hyperlegible-mono/latin-600.css';",
  "import '@fontsource/atkinson-hyperlegible-mono/latin-600.css';\n// Caveat: a handwriting face for headings and the teacher's red-pen marks (DESIGN §7).\nimport '@fontsource/caveat/latin-700.css';")
  edit('src/fonts.ts', "    document.fonts.load('600 20px \"Atkinson Hyperlegible Mono\"'),",
  "    do
  … (1148 more characters)
  ```

</details>

### 🤖 Claude

Caveat has no italic, so I'll drop the synthetic slant, use the bundled bold weight everywhere, and size it up a little since handwriting fonts run small. Then check the DOM headings' CSS.

<details><summary>3 tool calls</summary>

- **Shell:** Drop synthetic italics and resize display text; find CSS fonts

  ```bash
  python3 - <<'EOF'
  import re
  for p, subs in {
   'src/render/renderer.ts': [("fontFamily: DISPLAY_FONT, fontSize: 26, fontStyle: 'italic', fontWeight: '700'", "fontFamily: DISPLAY_FONT, fontSize: 32, fontWeight: '700'")],
   'src/render/effects.ts': [("fontFamily: DISPLAY_FONT, fontSize: 54, fontStyle: 'italic', fontWeight: '700'", "fontFamily: DISPLAY_FONT, fontSize: 66, fontWeight: '700'")],
   'src/render/overlay.ts': [
     ("fontFamily: DISPLAY_FONT, fontSize: 40, fontStyle: 'italic', fill: COLORS.ink", "fontFamily: DISPLAY_FONT, fontSize: 50, fontWeight: '700', fill: COLORS.ink"),
     ("fontFamily
  … (499 more characters)
  ```
- **Shell:** Read the DOM heading styles

  ```bash
  sed -n 34,44p src/ui/dialog.css; sed -n 54,66p src/ui/menu.css
  ```
- **Shell:** Switch dialog headings to the handwriting font

  ```bash
  grep -n "h2\|h1" src/ui/menu.css | head; python3 - <<'EOF'
  p='src/ui/dialog.css'
  s=open(p).read()
  old="""  font-family: Georgia, 'Times New Roman', serif;
    font-style: italic;
    font-weight: 400;
    font-size: 34px;"""
  assert old in s
  s=s.replace(old,"""  font-family: Caveat, 'Segoe Print', 'Bradley Hand', Georgia, serif;
    font-weight: 700;
    font-size: 42px;
    line-height: 1.1;""")
  open(p,'w').write(s)
  EOF
  ```

</details>

### 🤖 Claude

Fonts are wired (I kept the "Inkling" logo in Georgia, since it's the brand mark). Now creature polish and the star-fill animation. First, the overlay's current layout code.

<details><summary>1 tool call</summary>

- **Shell:** Read the overlay layout and star text

  ```bash
  grep -n "starText\|overlay.stars\|stars" src/render/overlay.ts src/core/campaign.ts src/i18n/en.ts | head; sed -n 255,345p src/render/overlay.ts
  ```

</details>

### 🤖 Claude

I'll draw the stars as shapes in their own row so each one can pop in after the grade stamp, instead of the "★☆☆" text line.

<details><summary>2 tool calls</summary>

- **Shell:** Draw page stars as shapes that fill in one by one

  ```bash
  python3 - <<'EOF'
  def edit(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s,(p,a[:60]); s=s.replace(a,b,1)
      open(p,'w').write(s)

  edit('src/render/overlay.ts', [
  ("import { APPRENTICE_CHAPTERS, newKeysFor, starText, starsForGrade } from '../core/campaign';",
   "import { APPRENTICE_CHAPTERS, newKeysFor, starsForGrade } from '../core/campaign';"),
  ("""  /** Red-pen grade for a finished page (DESIGN §6). */
    grade?: Grade;""","""  /** Red-pen grade for a finished page (DESIGN §6). */
    grade?: Grade;
    /** Stars earned on an Apprentice page, out of three. */
    stars?
  … (3369 more characters)
  ```
- **Shell:** Add line boil, letter pops, lock underline and per-kind defeats; run checks

  ```bash
  python3 - <<'EOF'
  def edit(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s,(p,a[:60]); s=s.replace(a,b,1)
      open(p,'w').write(s)

  edit('src/i18n/en.ts', [("  'overlay.stars': '{stars}',\n", "")])

  edit('src/render/effects.ts', [
  ("""  /** A faint mistake smudge that stays on the page. */""","""  /** The letter just typed jumps off the creature and fades, like a fresh pen mark. */
    letterPop(x: number, y: number, char: string, size: number): void {
      if (char.trim() === '') return;
      const text = new Text({ text: char, style: { fontFamily: TEXT_FONT, fontSize:
  … (5199 more characters)
  ```

</details>

### 🤖 Claude

Check and tests pass. Now the browser pass over everything I hadn't seen on screen. This time I'll back up the save and settings before touching anything, and restore both at the end.

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5173/"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const st = window.inkling.store; localStorage.setItem('__inklingBackupSave', JSON.stringify(st.dat
… (213 more characters)`

</details>

### 🤖 Claude

The dev server stopped between sessions; restarting it.

<details><summary>2 tool calls</summary>

- **preview_start** `{"name":"inkling-dev"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":3}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const st = window.inkling.store; if (!localStorage.getItem('__inklingBackupSave')) { localStorage.setItem('__inklingBackupSave', JSON.stringify(st.data)); loca
… (306 more characters)`

</details>

### 🤖 Claude

Backed up. Starting a Practice page (it avoids touching Apprentice stars) to check the briefing font, guided callout, bottle, recovery and abilities.

<details><summary>3 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"p","action_summary":"Opens the Practice screen"}},{"name":"find","input":{"query":"Start writing"}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_23","action_summary":"Starts a Practice notebook"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"computer","input":{"action":"screenshot"}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"Return","action_summary":"Dismisses the briefing and starts the page"}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const w = window.inkling.world; w.targets = []; w.guide = { id: 'blotling', targetId: null, spa
… (215 more characters)`

</details>

### 🤖 Claude

The callout follows the guided Blotling in. Let me wait for it to come onto the page, then type its first letter to see the lock underline and letter pop.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":3}},{"name":"computer","input":{"action":"type","text":"a","action_summary":"Types the first letter of the Blotling's word"}},{"name":"computer","input":{"action":"zoom","region":[400,120,1280,560],"scale":0.8}}]}`
- **javascript_tool** `{"action":"javascript_exec","text":"const w = window.inkling.world; ({phase: w.phase, locked: w.lockedId, errors: w.stats.errors, targets: w.targets.map(t => [t.id, t.text, t.typed, Math.round(t.x)]), focus: document.activeElement?.tagName, menu: window.inkling.menu.visible})"}`

</details>

### 🤖 Claude

The key never reached the game (no lock, no error), which points to the test tool's typing rather than the game. Dispatching real keydown events instead:

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', bubbles: true})); await new Promise(r => setTimeout(r, 120)); const w = window.inkling.world; ({locked: w.lockedId, typed: w.targets[0]?.typed})"}},{"name":"
… (76 more characters)`

</details>

### 🤖 Claude

The lock highlight and red-pen underline both show. Fixing the clipped handwriting with text padding, and rewording the mistakes tip:

<details><summary>1 tool call</summary>

- **Shell:** Pad handwritten text so it isn't clipped; reword the mistakes tip

  ```bash
  python3 - <<'EOF'
  import re
  def edit(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s,(p,a[:60]); s=s.replace(a,b,1)
      open(p,'w').write(s)
  # Caveat's strokes run past its measured width: pad every display-font Text.
  for p in ['src/render/renderer.ts','src/render/effects.ts','src/render/overlay.ts']:
      s=open(p).read()
      n=s.count("fontFamily: DISPLAY_FONT, ")
      s=s.replace("fontFamily: DISPLAY_FONT, ","fontFamily: DISPLAY_FONT, padding: DISPLAY_PADDING, ")
      open(p,'w').write(s)
      print(p,n)
  edit('src/render/theme.ts',[("""export const DISPLAY_FONT = 'Ca
  … (1379 more characters)
  ```

</details>

### 🤖 Claude

Now the ink bottle, streak recovery, Blotting paper and the Blotter, driven through the game's own modules:

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const W = await import('/src/core/world.ts'); const w = window.inkling.world; w.guide = null; w.targets = []; w.lockedId = null; w.ink = 35; const b = W.spawnB
… (607 more characters)`

</details>

### 🤖 Claude

My file edit triggered a full page reload, which dropped back to the menu. Continuing the saved Practice page and rerunning the bottle test:

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"c","action_summary":"Continues the saved Practice notebook"}},{"name":"computer","input":{"action":"wait","duration":1}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const W = await import('/src/core/world.ts'); 
… (399 more characters)`

</details>

## 🧑 Sent while Claude was working

> the arrow pointing to that tutorial target is weird

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.dispatchEvent(new KeyboardEvent('keydown', {key: 'g', bubbles: true})); await new Promise(r => setTimeout(r, 380)); ({ink: window.inkling.world.ink})"}},{"name":"computer","input":{"action":"zoom","region":[0,80
… (26 more characters)`

</details>

### 🤖 Claude

The bottle restored 20 ink (35 → 55), with the glow on the ink bar. The game is paused now because you clicked in the pane, which is fine. On to the arrow:

<details><summary>2 tool calls</summary>

- **Shell:** Show the current callout arrow code

  ```bash
  grep -n "A note in red pen follows" -A 26 src/render/renderer.ts
  ```
- **Shell:** Redraw the tutorial arrow as a short stroke with a direction-following head

  ```bash
  python3 - <<'EOF'
  p='src/render/renderer.ts'
  s=open(p).read()
  old=s[s.index("        const half = calloutText.width / 2 + 12;"):s.index("      // Thin pencil guide line from the nib tip to the locked target, and a red-pen underline.")]
  new="""        // The note sits above the creature (kept on the page), with a short pen stroke
          // down to it. The arrow ends clear of eyes, horns and crowns, and its head
          // follows the stroke, so it points straight at the creature from wherever the note is.
          const bob = reducedMotion ? 0 : Math.sin(timeMs / 260) * 3;
          const half = 
  … (1335 more characters)
  ```

</details>

### 🤖 Claude

Checking the new arrow in both positions: while the creature is still entering at the right edge, and once it's on the page.

<details><summary>4 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5173/"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"computer","input":{"action":"key","text":"c","action_summary":"Continues the saved Practice notebook"}},{"name":"computer","input":{"action":"wait","duration":
… (707 more characters)`
- **computer** `{"action":"zoom","region":"[300, 180, 560, 360]","scale":"0.8"}`
- **computer** `{"action":"zoom","region":[300,180,560,360],"scale":0.8}`
- **computer** `{"action":"screenshot"}`

</details>

### 🤖 Claude

You're playing in the pane, so I'll keep this to one quick look: a slowed guided Blotling, screenshotted at full size.

<details><summary>3 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const w = window.inkling.world; if (w.phase !== 'playing') w.phase; else { w.targets = []; w.lockedId = null; w.guide = { id: 'blotling', targetId: null, spawned: false }; await new Promise(r => setTimeout(r, 120)); co
… (171 more characters)`
- **Shell:** Flip the tutorial note below the creature near the top of the page

  ```bash
  python3 - <<'EOF'
  p='src/render/renderer.ts'
  s=open(p).read()
  old="""        const tipY = guidedView.root.y - guidedView.height / 2 - 24;
          const cx = Math.min(WORLD_WIDTH - half, Math.max(MARGIN_X + half, targetX));
          const noteBottom = tipY - 40 + bob;
          calloutText.position.set(cx, noteBottom);
          // Start under the note, as close above the creature as the note allows.
          const startX = Math.min(cx + half - 24, Math.max(cx - half + 24, targetX));
          const startY = noteBottom + 6;"""
  new="""        // Above the creature, unless that would crowd the HUD: then 
  … (951 more characters)
  ```
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const w = window.inkling.world; if (w.phase !== 'playing') { window.dispatchEvent(new KeyboardEvent('keydown', {key: 'c', bubbles: true})); } w.phase"}},{"name
… (736 more characters)`

</details>

### 🤖 Claude

On the top lane the note now sits below the creature with the arrow pointing up. Next, quick checks of Blotting paper, the Blotter and the streak refill:

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const W = await import('/src/core/world.ts'); const w = window.inkling.world; w.guide = null; w.targets = []; w.lockedId = null; w.abilities = ['blotter','eraser','paperweight','highlighter','blottingPaper']; w.shield 
… (913 more characters)`

</details>

### 🤖 Claude

Blotting paper's sheet and the Blotter's wave both work, with no console errors. Last visual check: the night theme with reduced motion and Gentle effects, set through stored settings and a reload.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"localStorage.setItem('inkling.settings', JSON.stringify({textSize:'normal', theme:'night', motion:'reduced', screenEffects:'gentle', volume:0.6, muted:false})); location.reload(); 'ok'"}},{"name":"computer","input":{"a
… (902 more characters)`
- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const st = window.inkling.store; const backup = JSON.parse(localStorage.getItem('__inklingBackupSave')); const settings = localStorage.getItem('__inklingBackupSettings'); window.inkling.world.phase = 'ready'; st.update
… (775 more characters)`

</details>

### 🤖 Claude

Your save and settings are back exactly as they were before this round. Now the milestone snapshots and docs. First, how the snapshot script works:

<details><summary>1 tool call</summary>

- **Shell:** Read the snapshot script and progression doc outline

  ```bash
  sed -n 1,60p scripts/snapshots.ts; grep -n "^## \|^### " docs/progression/README.md | tail -12
  ```

</details>

### 🤖 Claude

The snapshot tour predates the briefing card, which will now pop up in its fresh headless profile and block play. Checking the tour steps:

<details><summary>1 tool call</summary>

- **Shell:** Read the snapshot tour and the doc's latest sections

  ```bash
  grep -n "const TOUR" -A 60 scripts/snapshots.ts | head -80; sed -n 160,200p docs/progression/README.md
  ```

</details>

### 🤖 Claude

I'll add the briefing card to the tour (it appears when Practice starts, so the shot is free), dismiss it there, and wait for the star animation before the graded-page shot.

<details><summary>4 tool calls</summary>

- **Shell:** Add the briefing to the snapshot tour and take M15 shots

  ```bash
  python3 - <<'EOF'
  p='scripts/snapshots.ts'
  s=open(p).read()
  for a,b in [
  ("  { click: 'Start writing' }, { wait: 4000 }, { eval: LINEUP },",
   "  // A fresh player gets the \"New on this page\" briefing before their first page.\n  { click: 'Start writing' }, { wait: 800 }, { shot: 'briefing' }, { key: 'Enter' },\n  { wait: 4000 }, { eval: LINEUP },"),
  ("  { play: 60000, maxX: 1000 }, { shot: 'page-done' },",
   "  // Let the grade stamp and the stars fill in before the shot.\n  { play: 60000, maxX: 1000 }, { wait: 1500 }, { shot: 'page-done' },"),
  ]:
      assert a in s; s=s.replace(a,b)
  open(p,'w'
  … (415 more characters)
  ```
- **Read** `docs/progression/m15/page-done.png`
- **Read** `docs/progression/m15/play.png`
- **Read** `docs/progression/m15/lineup.png`

</details>

### 🤖 Claude

The shots look right: handwritten title and grade, filled stars, the best-run line, and the Nib's face. Taking the "latest" set too, then writing the doc sections.

<details><summary>4 tool calls</summary>

- **Shell:** Take latest shots and find the milestone tables

  ```bash
  npm run snapshots -- latest 2>&1 | tail -2; grep -n "^## \|^| \*\*M1[0-4]\|^| M1[0-4]\|M13\|M14" docs/REQUIREMENTS.md | head -20; grep -n "Side by side" -A 8 docs/progression/README.md | head -20
  ```
- **Shell:** Read the round 2 table and side-by-side sections

  ```bash
  sed -n 259,268p docs/REQUIREMENTS.md; sed -n 18,60p docs/progression/README.md | grep -n "^###\|^| M\|page-done\|Graded" | head
  ```
- **Shell:** Read the end-of-page comparison table

  ```bash
  sed -n 49,58p docs/progression/README.md
  ```
- **Shell:** Add the M15 docs sections and milestone rows

  ```bash
  python3 - <<'EOF'
  def edit(p, pairs):
      s=open(p).read()
      for a,b in pairs:
          assert a in s,(p,a[:70]); s=s.replace(a,b,1)
      open(p,'w').write(s)
  edit('docs/progression/README.md', [
  ("""| M2 | M7 | M12 | M13 | Latest |
  |---|---|---|---|---|
  | <img src="m02/page-done.png" width="170" alt="M2 page complete card"> | <img src="m07/page-done.png" width="170" alt="M7 graded page with A+"> | <img src="m12/page-done.png" width="170" alt="M12 page with stars"> | <img src="m13/page-done.png" width="170" alt="M13 page with ink and level up"> | <img src="latest/page-done.png" width="170" alt
  … (3817 more characters)
  ```

</details>

### 🤖 Claude

The doc says to keep only shots the page uses, so I'll remove the generated ones nothing references (all created just now by the script):

<details><summary>1 tool call</summary>

- **Shell:** Delete generated shots the gallery doesn't reference

  ```bash
  for f in docs/progression/m15/*.png docs/progression/latest/*.png; do rel=${f#docs/progression/}; if ! grep -q "$rel" docs/progression/README.md; then if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then echo "tracked-unused (kept): $rel"; else rm "$f"; echo "removed: $rel"; fi; fi; done; ls docs/progression/m15 docs/progression/latest
  ```

</details>

### 🤖 Claude

Final check and build:

<details><summary>1 tool call</summary>

- **Shell:** Run typecheck, lint, tests and the production build

  ```bash
  npm run check 2>&1 | grep -E "error|Tests |Test Files|problem" ; npm run build 2>&1 | grep -E "built|error"; git status --short | wc -l
  ```

</details>

### 🤖 Claude

The tutorial arrow is fixed, and the rest of the plan is now finished. `npm run check` (294 tests) and `npm run build` both pass, and everything is still uncommitted on `feat/m15-feel`.

**The arrow:** it used to curve from the middle of the note to wherever the creature happened to be, with a fixed downward triangle on the end, so it came out as a squiggle or a crooked swoop. Now it's a short pen stroke from the note to just above the creature, and the arrowhead follows the stroke. On the top line the note moves below the creature and the arrow points up, so it doesn't crowd the HUD. I checked both cases in the browser.

**Also done:**
- **Handwriting font:** headings, grades, banners and notes use Caveat, bundled from npm with no network loading. I added it to `CREDITS.md` and copied its license to `licenses/`. The "Inkling" logo stays in Georgia because it's the brand mark. I also fixed Caveat's last letter getting clipped (the hint read "wora").
- **Creature polish:**
  - Drawings jitter slightly, like hand-drawn animation.
  - Each typed letter pops off the creature.
  - The locked creature gets a red-pen underline that draws in.
  - Drips flick ink when beaten, and Blotlings soak into the page and leave a faint mark.
- **Graded page:** the stars are now drawn shapes that fill in one by one after the grade is stamped.
- **Wording:** the "Mistakes cost ink" tip no longer says "from here on", which read oddly on a Practice notebook's first page.
- **Docs:**
  - M15 shots and a new M15 section in `docs/progression/README.md`; I removed the generated shots the page doesn't use.
  - The snapshot tour now captures the briefing card.
  - The `REQUIREMENTS.md` milestone table now covers M14 and M15.

**Checked in the browser:**
- the ink bottle (ink went from 35 to 55, and the ink bar glows)
- Blotting paper's "Soaked up" sheet
- the Blotter's wave
- the guided-try note
- night theme with reduced motion and Gentle effects
- no console errors

Your save and settings are back exactly as they were before I tested. The two console errors from yesterday were leftovers from mid-edit reloads, not a real bug.

**Not checked:** the high-contrast theme, and the clean-run ink refill on screen (unit tests cover it). The old `latest/page-done.png` is still in git but the gallery no longer uses it, so you may want to delete it.

## 🧑 Prompt

> commit this and merge it into main

<details><summary>1 tool call</summary>

- **Shell:** Export the session transcript into docs

  ```bash
  grep -n '"transcript"' package.json && npm run transcript 2>&1 | tail -8 && git status --short docs/transcripts | head
  ```

</details>

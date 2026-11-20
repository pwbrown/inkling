# Fair Copy typing-test prototype (M31)

Claude Code session started 2026-11-20. 6 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> Background (from the session that started this one):
> Inky Keys is an offline-first TypeScript + Vite + PixiJS typing game (read CLAUDE.md, docs/REQUIREMENTS.md, docs/DESIGN.md). Players asked for a formal typing-test mode. The agreed direction: a paragraph becomes the page itself, using the space the background manuscript scribbles fill. Text will eventually come from bundled public-domain Gutenberg passages, plus an optional player-triggered Wikipedia paragraph through the already-allowed `VOCAB_API_ORIGIN` in `src/content/vocabApi.ts`. The user wants to see both a plain and a lively layout before choosing, and asked that nothing be polished until they confirm the design. Milestone 30 (capital-letter cue, hit-shake removal) is happening in parallel in another session and touches `src/render/renderer.ts` and `src/render/creatures/*`, so avoid editing those creature files.
>
> Task:
> Build a throwaway prototype of "Fair Copy", a typing-speed test mode for Inky Keys, on branch `feat/m31-fair-copy`. Then stop and show screenshots. Don't finalize anything.
>
> Scope:
> - Two layouts behind a dev-only URL switch `?fairCopy=plain|lively` that opens the mode directly. No main-menu entry yet, no save changes, no release entry.
>   - **plain**: a paragraph laid out on the notebook lines (the area the faint manuscript scribbles fill, see `src/render/manuscript.ts`). Untyped text is pale, typed text is in the scribe's ink, and a caret marks the next letter. The scribe (`src/render/scribe.ts`) follows the caret. The timer starts on the first key. Mistakes show in margin red and must be fixed with Backspace (reuse the Run-on rules in `src/core/bufferInput.ts` / `src/core/editing.ts`). It ends on the last character with a simple result (net WPM, raw WPM, accuracy, time).
>   - **lively**: the same, plus a live WPM on the HUD, the scribe reacting to streaks and slips, and a graded result card in the style of the existing page-cleared card, with slowest keys from the per-key stats.
> - Use 3 hard-coded short public-domain passages (e.g. Gutenberg: Austen, Dickens, Twain). Put the rules in a new pure `src/core/fairCopy.ts` with a few unit tests, reusing `wpm` from `src/core/stats.ts`. Strings go through `t()` with entries in `src/i18n/en.ts`.
> - Run `npm run check`, `npm run dev`, and screenshot both layouts in day and night mode, mid-test and on the result screen, using the in-app browser.
>
> Done = the prototype runs, checks pass, and the screenshots are shown to the user along with these open questions: timed 30s/60s option? strict Backspace vs. leave mistakes with a penalty? all keys vs. the Type Case selection? its own sticker shelf? Do not commit unless asked. Do not do the Wikipedia download, bundled passage library, SAVE_VERSION bump, or release yet: those wait for the user's design sign-off.
>
> Shared notes folder for this group of sessions (outside the repo; read siblings' notes there, leave hand-over notes or large findings there instead of pasting them into messages): /Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006

<details><summary>5 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  git checkout -b feat/m31-fair-copy && ls "/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006" ; ls src src/* | head -100; wc -l src/main.ts src/game/*.ts src/render/*.ts src/core/*.ts 2>/dev/null | sort -n | tail -40
  ```
- **Shell:** Ran a command

  ```bash
  ls src/render src/ui src/input src/storage; wc -l src/main.ts src/render/*.ts src/ui/*.ts src/core/bufferInput.ts src/core/editing.ts src/core/stats.ts src/core/grade.ts | sort -n | tail -30
  ```
- **Shell:** Ran a command

  ```bash
  cat src/core/editing.ts src/core/stats.ts; head -40 src/core/bufferInput.test.ts; cat src/render/manuscript.ts src/render/scribe.ts src/render/theme.ts
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "URLSearchParams\|location\.\|import.meta.env\|^async function\|^function\|^const \|^let \|new Renderer\|new GameRenderer\|addEventListener('keydown'\|createKeyboard\|onKey\|Application\|app.ticker\|ticker" src/main.ts | head -120
  ```
- **Shell:** Ran a command

  ```bash
  sed -n 1,140p src/main.ts; sed -n 1380,1585p src/main.ts
  ```

</details>

### 🤖 Claude

Exploring the renderer now to see how the page and scribe are drawn, so the prototype can sit on its own scene without touching `renderer.ts`.

<details><summary>6 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  grep -n "export\|baselines\|new Scribe\|new Manuscript\|LANE\|rule\|margin\|resize\|Application\|init(" src/render/renderer.ts | head -90; grep -n "export const\|LANE\|WORLD_\|MARGIN" src/core/world.ts | head -30
  ```
- **Shell:** Ran a command

  ```bash
  sed -n 40,160p src/render/renderer.ts; sed -n 241,420p src/render/renderer.ts
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "pageCleared\|grade\|function \|card\|stamp" src/render/overlay.ts | head -80; cat src/core/grade.ts | head -60; sed -n 1,60p src/render/hud.ts
  ```
- **Shell:** Ran a command

  ```bash
  sed -n 240,330p src/render/overlay.ts; sed -n 425,470p src/render/overlay.ts; grep -n "grades\|manuscript:" src/core/config.ts | head; grep -n "^export function\|onChar\|onSpecial" src/input/keyboard.ts; grep -n "overlay.pageCleared\|'hud\." src/i18n/en.ts | head -20; tail -5 src/i18n/en.ts; sed -n 1,40p src/i18n/index.ts
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "runon\|maxExtra\|correctPrefix\|applyEdit" src/core/input.ts | head -30; grep -n "runon" src/core/config.ts | head; sed -n 505,560p src/core/config.ts; grep -n "laneY\|laneCount" src/core/world.ts | head -5; sed -n 315,330p src/core/world.ts
  ```
- **Shell:** Ran a command

  ```bash
  sed -n 60,117p src/render/overlay.ts; grep -n "tilesLayer\|chip" src/render/overlay.ts | sed -n 1,40p; grep -n "private layoutTiles\|private layoutChips" -A40 src/render/overlay.ts | head -90
  ```

</details>

### 🤖 Claude

Writing the pure rules module (`src/core/fairCopy.ts`) and its tests now.

<details><summary>1 tool call</summary>

- **Shell:** Ran a command

  ```bash
  grep -n "^export const GAME_CONFIG\|^} as const\|^};" src/core/config.ts | head; tail -20 src/core/config.ts; cat src/core/config.test.ts | head -30; cat src/input/keyboard.ts | sed -n 1,70p
  ```

</details>

### 🤖 Claude

Now inserting the config block and writing the core module.

<details><summary>7 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  p='src/core/config.ts'
  s=open(p).read()
  anchor="  /** The faint manuscript the scribe writes as a page goes on (src/render/manuscript.ts). */\n  manuscript: {"
  block='''  /** Fair Copy, the typing-speed test (src/core/fairCopy.ts). Prototype numbers. */
    fairCopy: {
      /** After a mistake, at most this many more characters go into the buffer before keys are ignored. */
      maxWrongRun: 10,
      /** A key needs this many timed presses to count among the slowest keys. */
      slowKeyMinPresses: 2,
      slowKeysShown: 3,
      /** The scribe cheers every this many correct keys in a
  … (134 more characters)
  ```
- **Wrote** `src/core/fairCopy.ts`
- **Wrote** `src/core/fairCopy.test.ts`
- **Shell:** Ran a command

  ```bash
  npx vitest run src/core/fairCopy.test.ts 2>&1 | tail -20
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "loadFonts\|createRenderer(\|const renderer\|hideSplash()" src/main.ts; cat src/fonts.ts | head -30; grep -n "outCubic\|export class Punch\|export function" src/render/tween.ts
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "^const CARD_WIDTH\|^const PAD" src/render/overlay.ts; sed -n '/private layoutCircled/,/^  }/p' src/render/overlay.ts; grep -n "popup(" -A25 src/render/effects.ts | head -40
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "^  [a-zA-Z]*(.*{$\|constructor\|readonly" src/render/effects.ts | head -30
  ```

</details>

### 🤖 Claude

Core rules pass their tests. Now writing the Pixi view for both layouts and the dev-only entry point.

<details><summary>2 tool calls</summary>

- **Wrote** `src/render/fairCopyView.ts`
- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  p='src/render/fairCopyView.ts'
  s=open(p).read()
  s=s.replace("pageGrade({ correct: Math.max(1, Math.round(r.accuracy * 1000)), errors: Math.round((1 - r.accuracy) * 1000), leaks: 0 }, 0)","pageGrade({ correct: r.correct, errors: r.errors, leaks: 0 }, 0)")
  open(p,'w').write(s)
  p='src/core/fairCopy.ts'
  s=open(p).read()
  s=s.replace("  ms: number;\n  errors: number;","  ms: number;\n  correct: number;\n  errors: number;")
  s=s.replace("    ms,\n    errors: test.errors,","    ms,\n    correct: test.correct,\n    errors: test.errors,")
  open(p,'w').write(s)
  EOF
  grep -n "correct: test.
  … (29 more characters)
  ```

</details>

### 🤖 Claude

Now the dev entry, the `main.ts` hook, and strings.

<details><summary>4 tool calls</summary>

- **Wrote** `src/fairCopyPrototype.ts`
- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  p='src/main.ts'
  s=open(p).read()
  anchor="  applyColors();\n"
  block='''  applyColors();

    // PROTOTYPE (M31): `?fairCopy=plain|lively` opens the Fair Copy typing test on its own (dev only).
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(location.search);
      const { isFairCopyLayout, runFairCopy } = await import('./fairCopyPrototype');
      const layout = params.get('fairCopy');
      if (isFairCopyLayout(layout)) {
        const theme = params.get('theme');
        if (theme === 'classic' || theme === 'contrast' || theme === 'night') {
          setTheme(theme);

  … (1664 more characters)
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "as const" src/i18n/en.ts; grep -n "fairCopy" src/main.ts | head -3
  ```
- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  p='src/main.ts'
  s=open(p).read()
  anchor="  applyColors();\n\n  const customPresets"
  block='''  applyColors();

    // PROTOTYPE (M31): `?fairCopy=plain|lively` opens the Fair Copy typing test on its own (dev only).
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(location.search);
      const { isFairCopyLayout, runFairCopy } = await import('./fairCopyPrototype');
      const layout = params.get('fairCopy');
      if (isFairCopyLayout(layout)) {
        const theme = params.get('theme');
        if (theme === 'classic' || theme === 'contrast' || theme === 'night') {
    
  … (1698 more characters)
  ```

</details>

### 🤖 Claude

Checks pass. Starting the dev server to see it.

<details><summary>7 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  cat .claude/launch.json 2>/dev/null; grep -n '"dev"' package.json
  ```
- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  import json
  p='.claude/launch.json'
  d=json.load(open(p))
  d['configurations'].append({"name":"inky-keys-fair-copy","runtimeExecutable":"npm","runtimeArgs":["run","dev","--","--port","5183","--strictPort"],"port":5183})
  json.dump(d,open(p,'w'),indent=2); open(p,'a').write('\n')
  EOF
  ```
- **preview_start** `{"name":"inky-keys-fair-copy"}`
- **browser_batch** `{"actions":[{"name":"resize_window","input":{"width":1280,"height":720}},{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=plain"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"computer","input":{"action":"screenshot","scale":0.6}}]}`
- **computer** `{"action":"zoom","region":[0,0,400,225]}`
- **javascript_tool** `{"action":"javascript_exec","text":"const c=document.querySelector('canvas'); [c.clientWidth,c.clientHeight,innerWidth,innerHeight, devicePixelRatio]"}`
- **computer** `{"action":"screenshot"}`

</details>

### 🤖 Claude

Prototype renders. Adjusting the viewport so the whole page fits in screenshots, then typing part of the passage.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"resize_window","input":{"width":960,"height":540}},{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=plain"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"fairCopy.play('It is a 
… (420 more characters)`
- **computer** `{"action":"zoom","region":[90,220,330,290],"scale":0.8}`

</details>

### 🤖 Claude

Working end to end. Small baseline nudge so letters sit on the rules, then the full screenshot set.

<details><summary>2 tool calls</summary>

- **Edited** `src/render/fairCopyView.ts`
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=plain"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.MID='It is a truth universally acknowledgde\\b\\bed, that a single man in po
… (694 more characters)`

</details>

### 🤖 Claude

Plain day looks right. Fixing the screenshot helper's clock (second chunk overlapped the first), then night and lively shots.

<details><summary>2 tool calls</summary>

- **Edited** `src/fairCopyPrototype.ts`
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=plain&theme=night"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.MID='It is a truth universally acknowledgde\\b\\bed, that a sing
… (706 more characters)`

</details>

### 🤖 Claude

Plain day and night done. Now lively: a streak moment, a slip moment, and the result card.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=lively"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.MID='It is a truth universally acknowledgde\\b\\bed, that a single man in p
… (862 more characters)`
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=lively"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.MID='It is a truth universally acknowledgde\\b\\bed, that a single man in p
… (930 more characters)`

</details>

### 🤖 Claude

The lingering popups are an artifact of the hidden pane throttling frames. Adding a dev `settle()` helper to advance animations before shots.

<details><summary>2 tool calls</summary>

- **Edited** `src/fairCopyPrototype.ts`
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=lively"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.MID='It is a truth universally acknowledgde\\b\\bed, that a single man in p
… (467 more characters)`

</details>

### 🤖 Claude

Lively day done. Now lively in night mode.

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=lively&theme=night"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"window.MID='It is a truth universally acknowledgde\\b\\bed, that a sin
… (681 more characters)`

</details>

### 🤖 Claude

All screenshots captured. Quick check that real key presses (not just the helper) drive it.

<details><summary>3 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=plain&passage=1"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"computer","input":{"action":"left_click","coordinate":[400,400],"action_summary":"Focuses the game page"}},{"name":"computer","input":
… (531 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"screenshot","scale":0.4}},{"name":"computer","input":{"action":"left_click","coordinate":[400,400],"action_summary":"Focuses the game page"}},{"name":"computer","input":{"action":"type","text":"It was tge","action_summary":"Types sample text into the
… (450 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"for (const k of [...'It was tge','Backspace','Backspace',...'he best']) window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true})); [fairCopy.test.buffer, fairCopy.test.errors, fairCopy.test.startedAt!==null]"}`

</details>

### 🤖 Claude

Real keydown events drive the test correctly (the pane's synthetic typing just doesn't reach the window). Collecting the screenshots now.

<details><summary>4 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  cd "/Users/[removed]/.claude/projects/-Users-[removed]-projects-inky-keys--claude-worktrees-infallible-elgamal-cca286/68b222fd-ec99-4e3f-8667-ceb97a749a3e/tool-results" && N="/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-screens" && mkdir -p "$N" && cp mcp-Claude_Browser-blob-1795150205716-hvomx4.jpg "$N/1-plain-day-mid.jpg" && cp mcp-Claude_Browser-blob-1795150205716-jkvjuc.jpg "$N/2-plain-day-result.jpg" && cp mcp-Claude_Browser-blob-1795150220784-87oypv.jpg "$N/3-plain-night-mid.jpg" && cp mcp-Claude_Browser
  … (653 more characters)
  ```
- **Wrote** `/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-prototype.md`
- **SendUserFile** `{"files":["/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-screens/1-plain-day-mid.jpg","/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-screens
… (1280 more characters)`
- **resize_window** `{"preset":"desktop"}`

</details>

### 🤖 Claude

I built the Fair Copy prototype on branch `feat/m31-fair-copy`. It isn't committed. `npm run check` passes (446 tests), and I've sent 9 screenshots: plain and lively layouts, day and night, mid-test and on the result screen.

**How to open it:** run `npm run dev` and go to `/?fairCopy=plain` or `/?fairCopy=lively`. Add `&theme=night` for night mode and `&passage=0|1|2` to pick the passage. Esc starts the passage again; Enter on the result moves to the next one.

**What it does:**
- **Both layouts:** the passage is written double-spaced on the notebook lines: text on every other rule, with the scribe following the caret along the empty line below.
  - Untyped text is pale and typed text is in ink.
  - A mistake shows in margin red with a wavy underline, and the wrong letters you typed appear small above it. You have to fix it with Backspace, same as a Run-on.
  - The timer starts on the first key and stops on the last character.
- **Plain:** a timer in the HUD, and a one-line result under the paragraph: net WPM, raw WPM, accuracy and time.
- **Lively:**
  - The HUD shows live WPM, accuracy and the current run of correct keys.
  - The scribe cheers with a "30 in a row!" popup, and on a slip it winces, looks worried and throws a small red splatter.
  - It ends on a graded card styled like the page-cleared card: a big net WPM, five stat boxes, the three slowest keys circled in red with their average times, and a teacher's note.

**Where things are:** the rules are in [src/core/fairCopy.ts](src/core/fairCopy.ts), with 5 tests, and use `wpm` and the Run-on editing helpers. The drawing is in [src/render/fairCopyView.ts](src/render/fairCopyView.ts). The dev-only entry is [src/fairCopyPrototype.ts](src/fairCopyPrototype.ts), reached through an early return in `main.ts` that only runs in dev. I also added a `fairCopy` block to `config.ts`, `fairCopy.*` strings in `en.ts`, and a second dev server on port 5183 in `.claude/launch.json` so it doesn't clash with the M30 session on 5173. I didn't touch `renderer.ts` or `creatures/*`.

**Shortcuts I took, to revisit once you've chosen:**
- The grade reuses the page grade, so it only looks at accuracy, not speed.
- There's no sound yet.
- The card is built by hand, because the existing card reads game state that Fair Copy doesn't have.
- The wrong-letter display above the line is small; it might want to be bigger.

**Open questions:**
1. Should there be a timed 30s/60s option as well as the full passage?
2. Strict Backspace, or let players leave mistakes and take a penalty?
3. All keys, or only the keys picked in the Type Case?
4. Should it have its own sticker shelf?

A hand-over note and the screenshots are in the shared notes folder (`fair-copy-prototype.md` and `fair-copy-screens/`).

## 🧑 Prompt

> Lively

### ❓ Claude asked

- Fair Copy will build on the Lively layout. Should it also offer a timed test, or only full passages?
  - Passage only (Recommended)
  - Add 30s / 60s
- How should mistakes work in Fair Copy?
  - Strict Backspace (Recommended)
  - Leave with penalty
- Which keys should Fair Copy passages use?
  - All keys (Recommended)
  - Type Case selection
- Should Fair Copy get its own sticker shelf?
  - Yes, its own shelf
  - No, not yet

**Answer:** Your questions have been answered: "Fair Copy will build on the Lively layout. Should it also offer a timed test, or only full passages?"="Add 30s / 60s", "How should mistakes work in Fair Copy?"="Leave with penalty", "Which keys should Fair Copy passages use?"="All keys (Recommended)", "Should Fair Copy get its own sticker shelf?"="Yes, its own shelf". You can now continue with these answers in mind.

<details><summary>2 tool calls</summary>

- **Asked questions** (shown above)
- **Shell:** Ran a command

  ```bash
  cat >> "/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-prototype.md" <<'EOF'

  ## Design decisions (user, 2026-11-19)
  - Layout: **Lively** (drop Plain).
  - Length: full passage **plus timed 30s / 60s** tests.
  - Mistakes: **leave them with a penalty** (no forced Backspace), so this changes the Run-on rules used in the prototype.
  - Keys: **all keys** (real prose), not the Type Case selection.
  - Stickers: **its own Fair Copy shelf**.
  EOF
  ```

</details>

### 🤖 Claude

I've added your choices to the shared hand-over note (`fair-copy-prototype.md`), so the session that started this one has them too:

- **Layout:** Lively. Plain gets dropped.
- **Length:** the full passage, plus timed 30s and 60s tests.
- **Mistakes:** players can leave them, with a penalty, instead of having to fix them with Backspace.
- **Keys:** all keys, so passages are real prose with capitals and punctuation.
- **Stickers:** Fair Copy gets its own shelf.

Two of these change how it plays, so they're worth seeing before anything is finalized:

- **Mistakes:** right now the game blocks you until you fix a mistake. With a penalty, a wrong letter stays where it is, you keep typing, and the mistakes lower your net WPM. That changes how mistakes look on the page.
- **Timed tests:** these need a countdown in the HUD and a way to keep feeding text when someone finishes a passage before time is up.

The prototype doesn't do either yet: it still forces Backspace and only runs full passages. Nothing is committed. The full passage library, Wikipedia download, save-format change and release entry are still waiting.

## 🧑 Prompt

> I don't like the streak popping up in the middle of the text while you type. It feels too similar to a mistake and it's also not necessary

<details><summary>5 tool calls</summary>

- **Edited** `src/render/fairCopyView.ts`
- **Shell:** Ran a command

  ```bash
  sed -i '' "/'fairCopy.streak':/d" src/i18n/en.ts && grep -n "fairCopy.streak" -r src; npm run check 2>&1 | grep -E "error|Tests |failed"
  ```
- **browser_batch** `{"actions":[{"name":"resize_window","input":{"width":960,"height":540}},{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=lively"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"fairCopy.play('It is a
… (618 more characters)`
- **Shell:** Ran a command

  ```bash
  N="/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006"; cp "/Users/[removed]/.claude/projects/-Users-[removed]-projects-inky-keys--claude-worktrees-infallible-elgamal-cca286/68b222fd-ec99-4e3f-8667-ceb97a749a3e/tool-results/mcp-Claude_Browser-blob-1795150854102-ypro19.jpg" "$N/fair-copy-screens/5-lively-day-streak.jpg" && echo "- No streak popup on the text: a long run only gets a quiet cheer from the scribe (the HUD still counts the run)." >> "$N/fair-copy-prototype.md"
  ```
- **SendUserFile** `{"files":["/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-screens/5-lively-day-streak.jpg"],"caption":"After 270 correct keys in a row: no popup on the text, just the scribe cheering under the caret.","status":"normal","d
… (17 more characters)`

</details>

### 🤖 Claude

I've removed the "N in a row!" popup, so nothing appears in the text while you type except your own mistakes, which stay red. A long run now only makes the scribe give a quick cheer (a happy face and a little hop) under the caret, and the run count stays in the HUD at the top left. If you'd rather drop the cheer as well, that's a one-line change.

I also deleted the popup's unused string from `en.ts`. Checks pass, and the new screenshot was taken after 270 correct keys in a row. I've added this change to the hand-over note too. Nothing is committed.

## 🧑 Prompt

> update the prototype with the penalty and timed tests

<details><summary>1 tool call</summary>

- **Read** `src/core/fairCopy.ts`

</details>

### 🤖 Claude

Rewriting the rules module with the new mistake and timing rules.

<details><summary>2 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  p='src/core/config.ts'
  s=open(p).read()
  old='''    /** After a mistake, at most this many more characters go into the buffer before keys are ignored. */
      maxWrongRun: 10,
  '''
  new='''    /** Each mistake left in costs this many characters of net speed (5 = one word, the usual net-WPM rule). */
      errorPenaltyChars: 5,
      /** Lengths of the timed tests, in seconds. */
      timedSeconds: [30, 60],
  '''
  assert old in s
  s=s.replace(old,new)
  open(p,'w').write(s)
  EOF
  ```
- **Wrote** `src/core/fairCopy.ts`

</details>

### 🤖 Claude

Now the tests for the new rules.

<details><summary>2 tool calls</summary>

- **Wrote** `src/core/fairCopy.test.ts`
- **Shell:** Ran a command

  ```bash
  npx vitest run src/core/fairCopy.test.ts 2>&1 | grep -E "✓|×|FAIL|expected|Tests" | head -20
  ```

</details>

### 🤖 Claude

Rules pass. Now rewriting the view: per-letter marks, scrolling lines for timed tests, and a countdown.

<details><summary>2 tool calls</summary>

- **Read** `src/render/fairCopyView.ts`
- **Wrote** `src/render/fairCopyView.ts`

</details>

### 🤖 Claude

Now the dev entry, `main.ts` switch, and strings.

<details><summary>2 tool calls</summary>

- **Wrote** `src/fairCopyPrototype.ts`
- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  p='src/main.ts'
  s=open(p).read()
  old='''  // PROTOTYPE (M31): `?fairCopy=plain|lively` opens the Fair Copy typing test on its own (dev only).
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(location.search);
      const { isFairCopyLayout, runFairCopy } = await import('./fairCopyPrototype');
      const layout = params.get('fairCopy');
      if (isFairCopyLayout(layout)) {'''
  new='''  // PROTOTYPE (M31): `?fairCopy=passage|30|60` opens the Fair Copy typing test on its own (dev only).
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(location.se
  … (2161 more characters)
  ```

</details>

### 🤖 Claude

Checks pass (449 tests). Screenshotting passage mode first.

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"resize_window","input":{"width":960,"height":540}},{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=passage"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"fairCopy.play('It is 
… (747 more characters)`

</details>

### 🤖 Claude

Penalty mode works. One fix: a perfect "A+ / Neat as print!" shouldn't appear with mistakes left in, so mistakes left now drop the grade one letter.

<details><summary>2 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  p='src/render/fairCopyView.ts'
  s=open(p).read()
  old="    const grade = pageGrade({ correct: r.correct, errors: r.errors, leaks: 0 }, 0);"
  new="    // Accuracy grades it; mistakes left on the page cost a letter, like creatures reaching the margin.\n    const grade = pageGrade({ correct: r.correct, errors: r.errors, leaks: r.mistakesLeft }, 0);"
  assert old in s
  s=s.replace(old,new)
  open(p,'w').write(s)
  EOF
  npx tsc --noEmit && echo ok
  ```
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=60&theme=night"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"computer","input":{"action":"screenshot","scale":0.6}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"const T=fa
… (381 more characters)`

</details>

### 🤖 Claude

Timed scrolling and the red countdown work. Letting the 60s run hit the bell, then a 30s test in day mode.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":3}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"fairCopy.settle(2000); [fairCopy.test.finishedAt!==null]"}},{"name":"computer","input":{"action":"screenshot"}},{"name":"navigate","input":{"url":"http://local
… (487 more characters)`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":10}},{"name":"computer","input":{"action":"wait","duration":6}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"fairCopy.settle(2000); [fairCopy.test.finishedAt!==null]"}},{"name":"computer","input":{"action":"s
… (556 more characters)`

</details>

### 🤖 Claude

All six shots are in. Saving them, updating the hand-over note, and running the final check.

<details><summary>2 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  R="/Users/[removed]/.claude/projects/-Users-[removed]-projects-inky-keys--claude-worktrees-infallible-elgamal-cca286/68b222fd-ec99-4e3f-8667-ceb97a749a3e/tool-results"; N="/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006"; D="$N/fair-copy-screens/v2"; mkdir -p "$D" && cp "$R/mcp-Claude_Browser-blob-1795151131563-s4245w.jpg" "$D/1-passage-day-mid.jpg" && cp "$R/mcp-Claude_Browser-blob-1795151131563-n0j5ng.jpg" "$D/2-passage-day-result.jpg" && cp "$R/mcp-Claude_Browser-blob-1795151183382-2dg3od.jpg" "$D/3-passage-night-result
  … (1461 more characters)
  ```
- **SendUserFile** `{"files":["/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-screens/v2/1-passage-day-mid.jpg","/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-sc
… (1016 more characters)`

</details>

### 🤖 Claude

I've updated the prototype so mistakes can be left in at a cost, and added 30-second and 60-second timed tests. `npm run check` passes (449 tests). I've sent 7 screenshots: whole-passage tests and timed tests, in day and night, mid-test and at the end. The Plain layout is gone. The test now opens with `?fairCopy=passage`, `?fairCopy=30` or `?fairCopy=60`, and old `lively`/`plain` links still open the whole-passage test.

**Mistakes left in, with a penalty**
- A wrong key no longer blocks you. It lands on the next letter, shows in red with a wavy underline, and the letter you actually typed appears small above it.
- Backspace is optional. Fixing a mistake removes the penalty, but the wrong key still counts against accuracy.
- Each mistake left on the page costs one word (5 characters) of net speed. The card shows the cost under the big number, for example "−4 WPM for 5 mistakes left in", and has a "Left in" box.
- A passage now ends on its last character, whether it's right or wrong.

**Timed 30s / 60s**
- Passages run one after another, each starting as a new indented paragraph, and the author shown in the heading changes as you move into the next one.
- The page scrolls so the current line is always the second one, with the line you just finished still visible above.
- The HUD counts down, for example "83 WPM · 0:02 left", and turns red for the last 5 seconds.
- At the bell a "Time's up!" card appears showing the test length and how many characters you typed. Keys pressed after the bell don't count.

**The grade is harsh.** Any mistake left in drops the grade a letter, using the same rule as creatures reaching the margin. As the screenshots show, 99% accuracy with two mistakes left in gets a B. The speed penalty alone might be enough.

Hand-over notes and the new screenshots are in the shared notes folder (`fair-copy-prototype.md` and `fair-copy-screens/v2/`). Nothing is committed.

## 🧑 Prompt

> Speed penalty only

<details><summary>4 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  python3 - <<'EOF'
  p='src/render/fairCopyView.ts'
  s=open(p).read()
  old="    // Accuracy grades it; mistakes left on the page cost a letter, like creatures reaching the margin.\n    const grade = pageGrade({ correct: r.correct, errors: r.errors, leaks: r.mistakesLeft }, 0);"
  new="    // Accuracy alone grades it: mistakes left in already cost speed.\n    const grade = pageGrade({ correct: r.correct, errors: r.errors, leaks: 0 }, 0);"
  assert old in s
  s=s.replace(old,new)
  old2="grade === 'A+' ? t('fairCopy.note.neat')"
  new2="grade === 'A+' && r.mistakesLeft === 0 ? t('fairCopy.note.neat')"
  assert o
  … (107 more characters)
  ```
- **browser_batch** `{"actions":[{"name":"resize_window","input":{"width":960,"height":540}},{"name":"navigate","input":{"url":"http://localhost:5183/?fairCopy=passage&passage=1&theme=night"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":
… (315 more characters)`
- **Shell:** Ran a command

  ```bash
  N="/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006"; cp "/Users/[removed]/.claude/projects/-Users-[removed]-projects-inky-keys--claude-worktrees-infallible-elgamal-cca286/68b222fd-ec99-4e3f-8667-ceb97a749a3e/tool-results/mcp-Claude_Browser-blob-1795151847181-clunci.jpg" "$N/fair-copy-screens/v2/3-passage-night-result.jpg" && echo "- Decision: the grade is accuracy only; mistakes left in cost speed but not a letter. \"Neat as print!\" only when nothing is left in." >> "$N/fair-copy-prototype.md"
  ```
- **SendUserFile** `{"files":["/Users/[removed]/Library/Application Support/Claude/side-session-notes/local_6019587e-e06f-4654-a79f-15e860e2c006/fair-copy-screens/v2/3-passage-night-result.jpg"],"caption":"Same run as before (99%, 2 mistakes left in): now A+, with the −2 WPM penalty still shown.","status":"normal","d
… (17 more characters)`

</details>

### 🤖 Claude

The grade now comes from accuracy alone, and mistakes left in only cost speed. I re-ran the same Dickens test as before (99% accuracy, 2 mistakes left in): it now gets an A+ instead of a B, and the card still shows "−2 WPM for 2 mistakes left in".

I also changed one thing you didn't ask for: the "Neat as print!" note now only shows when nothing is left in. Otherwise an A+ with mistakes still on the page would call it neat. With mistakes left, the note points at the slowest key instead, as in the screenshot.

Checks pass. I've added this decision to the hand-over note and replaced the screenshot in `fair-copy-screens/v2/`. Nothing is committed.

## 🧑 Prompt

> commit this

<details><summary>1 tool call</summary>

- **Shell:** Ran a command

  ```bash
  npm run check 2>&1 | grep -E "error|Tests |failed"; npm run build 2>&1 | tail -5; git ls-files .claude/launch.json; grep -n '"transcript"' package.json; git status --short
  ```

</details>

### 🤖 Claude

Build and checks pass. Confirming the prototype stays out of the production bundle, then exporting the transcript.

<details><summary>1 tool call</summary>

- **Shell:** Ran a command

  ```bash
  grep -l "chainPassages\|Huckleberry" dist/assets/*.js 2>/dev/null | head; echo "---"; npm run transcript 2>&1 | tail -8; git status --short docs/transcripts
  ```

</details>

# Datamuse alternatives and targets page atmosphere

Claude Code session started 2026-11-18. 3 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> Let's explore 2 more things.
>
> * First off the datamuse API that we have been using says that it will require API keys starting in February.
>    * Can we explore alternatives to this that are still streamlined for the user, and if nothing exists we might need to consider dropping the word lists feature. I don't really want to modify it to a feature that requires uploading files. That is not intuitive for the target audience.
> * The page behind the targets is pretty lifeless. It would be cool if it felt like our nib was actually protecting something. One thought had was to have a little character like our ink drop profile shape or something similar (maybe a quill) physically writing text onto the page. This would need to be very faint and smaller as to not distract the player. One thought was to either pre-curate stories from literate like from the Gutenberg project that can be written in the backround.
>    * Another thought was to use this written text to character to write the Chapter number on the page itself instead of at the bottom, and the text finishing would coincide with the last target appearing on the page. This may not work due to unpredictable timing.
>
>
> The second idea about the background writing is a thought but it's not necessarily a good idea so please give me some alternatives or shoot it down if you think it would be too disruptive to the play experience

<details><summary>5 tool calls</summary>

- **Shell:** Read word download code and list source folders

  ```bash
  cat src/content/vocabApi.ts && ls src/content src/render src/core && grep -rn "vocabApi\|datamuse" --include=*.ts --include=*.md --include=*.html -il . | grep -v node_modules
  ```
- **Shell:** Find word-list usages and page rendering code

  ```bash
  grep -rln "fetchTopicWords\|datamuse\|Datamuse" src docs *.md index.html public 2>/dev/null; echo ---; grep -n "Topic\|topic\|vocab" docs/REQUIREMENTS.md | head -30; echo ---; grep -n "drawPage\|paper\|background\|chapter\|Chapter" src/render/renderer.ts | head -50; wc -l src/render/*.ts; ls src/content/en
  ```
- **Shell:** Read requirements, page drawing, word list UI

  ```bash
  sed -n 115,135p docs/REQUIREMENTS.md; echo ---; sed -n 80,140p src/render/renderer.ts; echo ---; cat src/ui/wordLists.ts | head -80; echo; grep -n "connect-src" index.html; grep -n -i "chapter\|wave" src/render/hud.ts | head; ls docs; grep -n -i "datamuse" PRIVACY.md CREDITS.md README.md
  ```
- **Web search:** Datamuse API key required February 2027
- **Web search:** free CORS word association API no key related words topic alternative to Datamuse

</details>

### 🤖 Claude

Checking Datamuse's change and alternatives now; next I'll look at what happens when a target gets through, so the background idea ties into the game.

<details><summary>1 tool call</summary>

- **Shell:** Read consequences, HUD chapter label, design notes

  ```bash
  sed -n 1,40p src/core/consequences.ts; echo ---; sed -n 95,130p src/render/hud.ts; echo ---; grep -n -i "page\|paper\|calm\|distract\|motion" docs/DESIGN.md | head -40; grep -n "interface PageState\|page:" -A12 src/core/world.ts | head -40; grep -n "reducedMotion\|reduceMotion" -r src --include=*.ts -l | head -5
  ```

</details>

### ❓ Claude asked

- Datamuse needs an API key from Feb 1, 2027 (100k requests/day per key, shared across every player). Which way should the Word lists feature go?
  - Wikipedia words (Recommended)
  - Bundled topic packs
  - Datamuse with our key
  - Drop the feature
- Background writing: a legible story written behind word targets would compete with reading the targets (text behind text is the worst distractor for a typing game), so I'd shoot that one down. Which alternative do you want planned?
  - Manuscript you defend (Recommended)
  - Chapter heading only
  - Manuscript, no scribe

**Answer:** Your questions have been answered: "Datamuse needs an API key from Feb 1, 2027 (100k requests/day per key, shared across every player). Which way should the Word lists feature go?"="Wikipedia words (Recommended)", "Background writing: a legible story written behind word targets would compete with reading the targets (text behind text is the worst distractor for a typing game), so I'd shoot that one down. Which alternative do you want planned?"="Manuscript you defend (Recommended)". You can now continue with these answers in mind.

<details><summary>6 tool calls</summary>

- **Asked questions** (shown above)
- **Shell:** Find world events, vocab schema, word list, avatar art

  ```bash
  grep -n "type: '" src/core/world.ts | head -40; echo ---; grep -n "VocabList" -A8 src/storage/schema.ts | head -20; echo ---; head -c 300 src/content/en/words.json; echo; grep -n "words" src/content/en/index.ts | head; echo ---; grep -rn -i "inkdrop\|ink drop\|profile" src/ui/*.ts src/render/*.ts | head -8; echo ---; grep -n "case 'breach'\|breach\|reached\|margin" src/render/renderer.ts | head -15; grep -n "PAGE_START\|pageIntro\|page-start\|pageStart" -r src/core/config.ts src/core/world.ts | head
  ```
- **Shell:** Find page geometry and nib position

  ```bash
  grep -rn "MARGIN_X =\|WORLD_WIDTH =\|WORLD_HEIGHT =\|FIRST_LINE_Y =\|LINE_SPACING =\|NIB_X" src/core/config.ts src/render/theme.ts src/core/world.ts | head; grep -n "nib.x =\|nib.position" src/render/renderer.ts | head -3; grep -n "smudge\|stain" src/core/world.ts | head -5
  ```
- **Shell:** Check settings shape and save version

  ```bash
  grep -n "SAVE_VERSION =\|interface Settings" -A14 src/storage/schema.ts | head -40; grep -n "\"version\"" package.json
  ```
- **Shell:** Find where settings like reduced motion live

  ```bash
  grep -n "reducedMotion\|highContrast\|settings:" src/storage/schema.ts | head; grep -rn "reducedMotion:" src/storage/*.ts | head -3
  ```
- **Shell:** Locate the reduced-motion setting

  ```bash
  grep -rln "reducedMotion" src | head; grep -rn "reducedMotion" src/storage src/ui/settings*.ts 2>/dev/null | head -5
  ```

</details>

### 🤖 Claude

Got enough context; writing up the plan now.

<details><summary>2 tool calls</summary>

- **Shell:** Read settings shape

  ```bash
  sed -n 1,40p src/settings.ts
  ```
- **Wrote** `/Users/[removed]/.claude/plans/let-s-explore-2-more-graceful-mochi.md`

</details>

<details><summary><strong>📋 Plan for approval</strong></summary>

# Plan: Wikipedia word lists + "the manuscript you defend"

## Context
1. **Datamuse needs an API key from 1 Feb 2027** (100k requests/day per key, shared by every player). Word lists (`src/content/vocabApi.ts`, UI in `src/ui/wordLists.ts`) would stop working. Decision: keep the same "type a topic → Download words" flow, but source words from the topic's **Wikipedia article** (keyless, CORS via `origin=*`).
2. **The page feels lifeless.** A legible story behind word targets would compete with reading the targets, so that idea is dropped. Decision: a **manuscript you defend**. A tiny ink-drop scribe writes faint, *illegible* scribble lines that fill in with page progress. Escaped targets blot it. The chapter heading is written at page start. Tying the writing to progress (cleared / `params.size`), not time, removes the timing problem: the last stroke lands with the last target.

Two independent pieces. Ship them as two branches/releases: `feat/wiki-words` first (it has a deadline), then `feat/manuscript`.

---

## Part A: Wikipedia word lists (`feat/wiki-words`)

**Request** (in `vocabApi.ts`, replacing `topicUrl`):
`https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1&prop=extracts&explaintext=1&exsectionformat=plain&generator=search&gsrsearch=<topic>&gsrlimit=1`
- `generator=search` + `redirects` makes "dinosaurs", "outer space" and typos land on the right article. Send the `Api-User-Agent: InkyKeys (+repo URL)` header (Wikimedia's guideline for browsers). Keep `credentials: 'omit'`, `no-referrer`, `no-store`.
- Keep `VocabError` reasons. Map no page / disambiguation (`pageprops.disambiguation`, or a very short extract) to `'empty'`.

**Turn article text into words** (a new pure function `wordsFromArticle(text, dictionary, blocklist)` in `vocabApi.ts`, unit tested):
- Tokenise to lowercase `[a-z]{2,14}`, count occurrences.
- Keep only words in the bundled SCOWL dictionary (`src/content/en/words.json` via `loadPack`). This drops names, foreign words and garbage. Pass the dictionary set in, as the blocklist is now.
- Score each word by how much more often it appears in the article than it would in everyday English. Use the word's SCOWL tier as a commonness proxy (tier 10 = very common, so it scores low). Drop the most common tier entirely ("the", "and"). Also keep the topic word itself.
- Sort by score, take up to `GAME_CONFIG.vocab.maxWords` (new; 300). Require ≥ `vocab.minWords` (new; 20), else `'empty'`.
- Existing `cleanWords` / blocklist still runs last.

**Wiring and docs:**
- `index.html` CSP: `connect-src 'self' https://en.wikipedia.org` (remove datamuse).
- `VOCAB_API_ORIGIN` becomes `https://en.wikipedia.org`. Check any service-worker / fetch allowlist that references it.
- Update `PRIVACY.md`, `README.md` (W section), `CREDITS.md` (Wikipedia, CC BY-SA; we take single words, not text), `docs/REQUIREMENTS.md` (decision line at §6/line 298), and i18n strings in `src/i18n/en.ts` that name Datamuse.
- Saved lists (`VocabList`) are unchanged, so there's no save migration. Old Datamuse lists keep working offline.
- Tests: rewrite `vocabApi.test.ts` with a fixture article extract (ranking, dictionary filter, disambiguation → empty, offline, HTTP error).
- Release: 2.15.0, "Word lists now come from Wikipedia".

## Part B: The manuscript (`feat/manuscript`)

**What the player sees:**
- **Header:** at page start, the scribe (a ~28px ink drop with a face, reusing the badge drop shape from `src/ui/art.ts`, redrawn in Pixi) sits in the top band, centred between the inkwell and the score. It writes "Chapter N · Page M" in faint pencil over about 1.2s. The footer page label in `hud.ts` stays; it carries progress and Apprentice key info.
- **Manuscript:** faint (alpha ~0.10–0.14) handwriting-like squiggles on the ruled lines, right of the margin. They fill left→right, top→bottom as targets are cleared. The revealed length eases toward `done / total` (the same numbers `hud.ts:103` computes). On the last target it reaches the end of the final line, and the scribe gives a little flourish/cheer.
- **Motion stays out of the lanes:** the scribe never walks across the play field. Only the stroke end grows. The scribe "writes" (quill bob) in the header whenever progress ticks.
- **Stakes:** on `marginHit`, drop an ink blot on the manuscript in that lane near its written end, and the scribe winces. Blots persist for the page and clear on `reset` / new page.
- The scribe glances toward the margin when a creature is within the existing "worried" distance, using the same check the creatures use for their worried face.
- **Comfort:** reduced motion means no scribe animation, and the reveal jumps per target instead of easing. A new setting **"Page writing: on / off"** in `src/settings.ts` (localStorage, so no save bump). Off shows the plain page.
- Boss pages: progress counts the boss as the final piece. Check `bossSpawned`/`hasBoss` so the last line waits for the boss.

**Code layout:**
- `src/render/manuscript.ts` (new): `buildManuscript(seed, lines)` is a pure, seeded (`src/core/rng.ts`) generator of squiggle polylines per ruled line: word-length bumps, gaps, an occasional drop-cap at the top-left. `revealPath(paths, fraction)` returns the visible portion. Unit test both, like `aim.test.ts`. A `Manuscript` class owns the Pixi `Graphics` and blot layer.
- `src/render/scribe.ts` (new): draws the scribe and its states (writing, glance, wince, cheer, idle blink).
- `src/render/renderer.ts`: add the manuscript layer right after `drawPage(...)` in the `scene.addChild` list (line ~284), below stains and targets. Feed it progress each frame. Route `marginHit` / `reset` / `phase` events to it next to the existing handlers (~line 553).
- Tuning (alpha, ease rate, heading duration, scribble sizes) goes in `src/core/config.ts`, and strings (setting label, heading text) in `src/i18n/en.ts`.
- Respect themes: draw with `COLORS.ink` / `COLORS.pencil` so night mode and parchment work.
- Release: 2.16.0. If it's treated as a milestone, run snapshots and update `docs/progression/README.md`.

## Verification
- `npm run check` and `npm run build` pass for each branch.
- A: in `npm run dev`, press W and download "ocean", "dinosaurs", "volcano", "mercury" (disambiguation) and nonsense. Check that the words look on-topic and the counts are sensible. Confirm the request goes only to en.wikipedia.org (network panel), with no cookies or referrer. Check that offline shows the offline message.
- B: play a page in the browser. Check that the heading writes at the start and the manuscript finishes as the last target dies (also on a boss page). Let a target through and see the blot and wince. Toggle reduced motion and Page writing off. Check night/parchment/graph paper. Screenshot to judge faintness against targets.


</details>

<details><summary>5 tool calls</summary>

- **Presented the plan** (shown above)
- **Edited** `/Users/[removed]/.claude/plans/let-s-explore-2-more-graceful-mochi.md`
- **Wrote** `/Users/[removed]/.claude/projects/-Users-[removed]-projects-inky-keys/memory/verify-designs-after-prototyping.md`
- **Shell:** Read memory index

  ```bash
  cd /Users/[removed]/.claude/projects/-Users-[removed]-projects-inky-keys/memory && cat MEMORY.md
  ```
- **Edited** `/Users/[removed]/.claude/projects/-Users-[removed]-projects-inky-keys/memory/MEMORY.md`

</details>

<details><summary><strong>📋 Plan for approval</strong></summary>

# Plan: Wikipedia word lists + "the manuscript you defend"

## Context
1. **Datamuse needs an API key from 1 Feb 2027** (100k requests/day per key, shared by every player). Word lists (`src/content/vocabApi.ts`, UI in `src/ui/wordLists.ts`) would stop working. Decision: keep the same "type a topic → Download words" flow, but source words from the topic's **Wikipedia article** (keyless, CORS via `origin=*`).
2. **The page feels lifeless.** A legible story behind word targets would compete with reading the targets, so that idea is dropped. Decision: a **manuscript you defend**. A tiny ink-drop scribe writes faint, *illegible* scribble lines that fill in with page progress. Escaped targets blot it. The chapter heading is written at page start. Tying the writing to progress (cleared / `params.size`), not time, removes the timing problem: the last stroke lands with the last target.

Two independent pieces. Ship them as two branches/releases: `feat/wiki-words` first (it has a deadline), then `feat/manuscript`.

---

## Part A: Wikipedia word lists (`feat/wiki-words`)

**Request** (in `vocabApi.ts`, replacing `topicUrl`):
`https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&redirects=1&prop=extracts&explaintext=1&exsectionformat=plain&generator=search&gsrsearch=<topic>&gsrlimit=1`
- `generator=search` + `redirects` makes "dinosaurs", "outer space" and typos land on the right article. Send the `Api-User-Agent: InkyKeys (+repo URL)` header (Wikimedia's guideline for browsers). Keep `credentials: 'omit'`, `no-referrer`, `no-store`.
- Keep `VocabError` reasons. Map no page / disambiguation (`pageprops.disambiguation`, or a very short extract) to `'empty'`.

**Turn article text into words** (a new pure function `wordsFromArticle(text, dictionary, blocklist)` in `vocabApi.ts`, unit tested):
- Tokenise to lowercase `[a-z]{2,14}`, count occurrences.
- Keep only words in the bundled SCOWL dictionary (`src/content/en/words.json` via `loadPack`). This drops names, foreign words and garbage. Pass the dictionary set in, as the blocklist is now.
- Score each word by how much more often it appears in the article than it would in everyday English. Use the word's SCOWL tier as a commonness proxy (tier 10 = very common, so it scores low). Drop the most common tier entirely ("the", "and"). Also keep the topic word itself.
- Sort by score, take up to `GAME_CONFIG.vocab.maxWords` (new; 300). Require ≥ `vocab.minWords` (new; 20), else `'empty'`.
- Existing `cleanWords` / blocklist still runs last.

**Wiring and docs:**
- `index.html` CSP: `connect-src 'self' https://en.wikipedia.org` (remove datamuse).
- `VOCAB_API_ORIGIN` becomes `https://en.wikipedia.org`. Check any service-worker / fetch allowlist that references it.
- Update `PRIVACY.md`, `README.md` (W section), `CREDITS.md` (Wikipedia, CC BY-SA; we take single words, not text), `docs/REQUIREMENTS.md` (decision line at §6/line 298), and i18n strings in `src/i18n/en.ts` that name Datamuse.
- Saved lists (`VocabList`) are unchanged, so there's no save migration. Old Datamuse lists keep working offline.
- Tests: rewrite `vocabApi.test.ts` with a fixture article extract (ranking, dictionary filter, disambiguation → empty, offline, HTTP error).
- Release: 2.15.0, "Word lists now come from Wikipedia".

## Part B: The manuscript (`feat/manuscript`)

**What the player sees:**
- **Header:** at page start, the scribe (a ~28px ink drop with a face, reusing the badge drop shape from `src/ui/art.ts`, redrawn in Pixi) sits in the top band, centred between the inkwell and the score. It writes "Chapter N · Page M" in faint pencil over about 1.2s. The footer page label in `hud.ts` stays; it carries progress and Apprentice key info.
- **Manuscript:** faint (alpha ~0.10–0.14) handwriting-like squiggles on the ruled lines, right of the margin. They fill left→right, top→bottom as targets are cleared. The revealed length eases toward `done / total` (the same numbers `hud.ts:103` computes). On the last target it reaches the end of the final line, and the scribe gives a little flourish/cheer.
- **Motion stays out of the lanes:** the scribe never walks across the play field. Only the stroke end grows. The scribe "writes" (quill bob) in the header whenever progress ticks.
- **Stakes:** on `marginHit`, drop an ink blot on the manuscript in that lane near its written end, and the scribe winces. Blots persist for the page and clear on `reset` / new page.
- The scribe glances toward the margin when a creature is within the existing "worried" distance, using the same check the creatures use for their worried face.
- **Comfort:** reduced motion means no scribe animation, and the reveal jumps per target instead of easing. A new setting **"Page writing: on / off"** in `src/settings.ts` (localStorage, so no save bump). Off shows the plain page.
- Boss pages: progress counts the boss as the final piece. Check `bossSpawned`/`hasBoss` so the last line waits for the boss.

**Code layout:**
- `src/render/manuscript.ts` (new): `buildManuscript(seed, lines)` is a pure, seeded (`src/core/rng.ts`) generator of squiggle polylines per ruled line: word-length bumps, gaps, an occasional drop-cap at the top-left. `revealPath(paths, fraction)` returns the visible portion. Unit test both, like `aim.test.ts`. A `Manuscript` class owns the Pixi `Graphics` and blot layer.
- `src/render/scribe.ts` (new): draws the scribe and its states (writing, glance, wince, cheer, idle blink).
- `src/render/renderer.ts`: add the manuscript layer right after `drawPage(...)` in the `scene.addChild` list (line ~284), below stains and targets. Feed it progress each frame. Route `marginHit` / `reset` / `phase` events to it next to the existing handlers (~line 553).
- Tuning (alpha, ease rate, heading duration, scribble sizes) goes in `src/core/config.ts`, and strings (setting label, heading text) in `src/i18n/en.ts`.
- Respect themes: draw with `COLORS.ink` / `COLORS.pencil` so night mode and parchment work.
- Release: 2.16.0. If it's treated as a milestone, run snapshots and update `docs/progression/README.md`.

## Design check-ins (stop and get feedback before going further)
1. **A, word quality:** once `wordsFromArticle` works, show the word lists for ~6 sample topics before wiring the UI and docs.
2. **B, look prototype:** build the static manuscript + scribe + heading on a page (no events yet). Share screenshots in classic, night and parchment, with live targets on top. Wait for feedback on faintness, scribe look and placement.
3. **B, behaviour prototype:** add the progress reveal, blots, glance/wince/cheer. Share a short play-through (screenshots at start, mid, blot, end). Wait for feedback before the settings toggle, polish and release notes.

## Verification
- `npm run check` and `npm run build` pass for each branch.
- A: in `npm run dev`, press W and download "ocean", "dinosaurs", "volcano", "mercury" (disambiguation) and nonsense. Check that the words look on-topic and the counts are sensible. Confirm the request goes only to en.wikipedia.org (network panel), with no cookies or referrer. Check that offline shows the offline message.
- B: play a page in the browser. Check that the heading writes at the start and the manuscript finishes as the last target dies (also on a boss page). Let a target through and see the blot and wince. Toggle reduced motion and Page writing off. Check night/parchment/graph paper. Screenshot to judge faintness against targets.


</details>

<details><summary>7 tool calls</summary>

- **Presented the plan** (shown above)
- **Shell:** Create branch and read word pack and tests

  ```bash
  git switch -c feat/wiki-words && cat src/content/en/index.ts && cat src/content/vocabApi.test.ts | head -60 && grep -n "fetchTopicWords\|blocklist" src/ui/wordLists.ts | head; grep -rn "datamuse\|Datamuse" src/i18n/en.ts vite.config.* src/sw* 2>/dev/null; grep -n "vocab" src/core/config.ts
  ```
- **Shell:** Read word tiers structure and callers

  ```bash
  grep -n "entriesFromTiers" -B3 -A20 src/content/wordPool.ts | head -50; node -e 'const p=require("./src/content/en/words.json");console.log(p.tiers.map(t=>t.split(" ").length))'; grep -rn "openWordLists" src --include=*.ts | grep -v test | head -3
  ```
- **Shell:** Look at config structure

  ```bash
  grep -n "^export const GAME_CONFIG" -A5 src/core/config.ts; grep -n "^  [a-z][a-zA-Z]*: {" src/core/config.ts | tail -5; tail -15 src/core/config.ts; grep -n "repository\|homepage" package.json
  ```
- **Shell:** Read end of GAME_CONFIG

  ```bash
  sed -n 470,500p src/core/config.ts
  ```
- **Edited** `src/core/config.ts`
- **Wrote** `src/content/vocabApi.ts`

</details>

### 🤖 Claude

The ranking code is written. Next I'll run it against real Wikipedia articles to see how good the words are.

<details><summary>6 tool calls</summary>

- **Shell:** Try the ranking against real Wikipedia topics

  ```bash
  mkdir -p <temp file> && cat > <temp file> <<'EOF'
  import { it } from 'vitest';
  import words from '/Users/[removed]/projects/inky-keys/src/content/en/words.json';
  import bl from '/Users/[removed]/projects/inky-keys/src/content/en/blocklist.json';
  import { Blocklist } from '/Users/[removed]/projects/inky-keys/src/content/blocklist';
  import { fetchTopicWords } from '/Users/[removed]
  … (865 more characters)
  ```
- **Shell:** Run the trial inside the project temporarily

  ```bash
  pkill -f "vitest run --root /" ; cd /Users/[removed]/projects/inky-keys && sed 's#/Users/[removed]/projects/inky-keys/src/#../#' <temp file> | sed "s#'\.\./content/en#'./en#; s#'\.\./content/#'./#" > src/content/zz-trial.test.ts && head -5 src/content/zz-trial.test.ts && timeout 90 npx vitest run src/content/zz-trial.test.ts 2>&1 | grep -E "^(ocean|dino|volc|outer|soccer|cook|merc|qwz)|Error|FAIL" | head -30
  ```
- **Shell:** Rerun trial and show raw output

  ```bash
  timeout 100 npx vitest run src/content/zz-trial.test.ts 2>&1 | tail -30
  ```
- **Shell:** Write trial results to a scratch file

  ```bash
  sed -i '' "s#console.log(\(.*\));#require('fs').appendFileSync('<temp file>', [\1].join(' ') + '\\\\n');#" src/content/zz-trial.test.ts && grep -n appendFile src/content/zz-trial.test.ts | head -2 && rm -f <temp file> timeout 100 npx vitest run src/content/zz-trial.test.ts 2>&1 | grep -E "passed|failed|Error" ; cat <temp file>
  … (47 more characters)
  ```
- **Shell:** Check Wikipedia status with and without user agent

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=search&gsrsearch=ocean&gsrlimit=1&prop=extracts&explaintext=1"; curl -s -o /dev/null -w "%{http_code}\n" -A "InkyKeys/2 (https://github.com/pwbrown/inky-keys)" "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=search&gsrsearch=ocean&gsrlimit=1&prop=extracts&explaintext=1"
  ```
- **Shell:** Rerun trial with a user agent

  ```bash
  sed -i '' "s#fetchTopicWords(topic, dict, block)#fetchTopicWords(topic, dict, block, (u, i) => fetch(u, { ...i, headers: { 'User-Agent': 'InkyKeys/2 (https://github.com/pwbrown/inky-keys)' } }))#" src/content/zz-trial.test.ts && rm -f <temp file> timeout 100 npx vitest run src/content/zz-trial.test.ts 2>&1 | grep -E "passed|failed|Error" ; cat <temp file>
  ```

</details>

### 🤖 Claude

First real results look on-topic (ocean → salinity, tidal, pelagic, seabed…). I'm now cleaning out the leftovers: abbreviations like "mi", prefixes like "non-", and proper nouns like "john".

<details><summary>5 tool calls</summary>

- **Edited** `src/content/vocabApi.ts`
- **Edited** `src/core/config.ts`
- **Shell:** Rerun trial after filtering fixes

  ```bash
  sed -i '' "s/'mercury', 'qwzxv'/'mercury', 'planet mercury', 'horses', 'qwzxv'/; s/slice(0, 40)/slice(0, 45)/" src/content/zz-trial.test.ts && rm -f <temp file> timeout 100 npx vitest run src/content/zz-trial.test.ts 2>&1 | grep -E "failed|Error" ; cat <temp file>
  ```
- **Edited** `src/content/vocabApi.ts`
- **Shell:** Move trial script out of the project

  ```bash
  mv src/content/zz-trial.test.ts <temp file> && git status --short
  ```

</details>

### 🤖 Claude

This is the first design check-in. Wikipedia is a workable replacement for Datamuse: I ran the new ranking against live Wikipedia articles and the words are on-topic. I've stopped before wiring it into the game so you can look at the results first.

**Why Wikipedia:** Datamuse's own page says an API key will be required from **1 Feb 2027**, with a cap of 100k requests a day per key ([Datamuse API](https://www.datamuse.com/api/)). Every player would share that one key. My search turned up no other free, keyless word service that works from a browser; the ones that fit need an API key ([Zyla](https://zylalabs.com/api-marketplace/nlp/word+association+api/809), Words API).

**How it works now:** the game downloads the topic's Wikipedia article in one request. It keeps only words that are in our bundled dictionary and pass the blocklist. It then scores each word by how often it appears in the article against how common it is in everyday English. Names ("John", "Oxford"), prefixes ("non-", "mid-") and plurals that duplicate a singular are filtered out. The top 300 are kept.

First words for some sample topics:

| Topic | Words | First words |
|---|---|---|
| ocean | 287 | salinity, marine, tidal, pelagic, seabed, coastal, algae, trench, littoral |
| dinosaurs | 300 | avian, herbivore, bipedal, femur, reptile, feathers, carnivorous, crest |
| volcano | 213 | magma, eruption, lava, basalt, dormant, crater, cinder, geysers |
| outer space | 247 | spaceflight, interstellar, galaxies, astronaut, lunar, orbit, celestial |
| soccer | 151 | referee, goalkeeper, offside, crossbar, penalty, relegation |
| cooking | 148 | steaming, grilling, braising, starch, cuisine, culinary, chickpeas |
| horses | 287 | foal, mare, stallion, saddle, trot, hooves, pony |
| planet mercury | 227 | perihelion, crater, orbit, flyby, eccentricity |

**Weak spots:**
- **Ambiguous topics:** "mercury" lands on Wikipedia's list of meanings, so it comes back empty. That shows the existing "no usable words" message; "planet mercury" works.
- **Off-topic words:** a few slip through from the article's tangents ("colonialism" for outer space, "robin" for soccer).
- **Hard words:** the lists lean factual and fairly difficult. The game's existing difficulty weighting decides which of them appear on easy pages.
- **"horses":** the word "horse" itself was missing from that list. I've fixed that but haven't rerun the trial.

**Once you're happy with the words**, the remaining Part A work is:
- Pass the dictionary in from the word-list screen.
- Allow only `en.wikipedia.org` in the CSP.
- Rewrite `vocabApi.test.ts`.
- Update the Privacy, README, Credits and Requirements docs and the in-game strings.
- Release as 2.15.0.

After that comes the manuscript prototype, the second check-in, where I'll show you screenshots before going further. I've also saved a note to check designs with you after each prototype.

Nothing is committed. The changes so far are in [vocabApi.ts](src/content/vocabApi.ts) and a new `vocab` block in [config.ts](src/core/config.ts).

## 🧑 Prompt

> Looks good, wire it

<details><summary>3 tool calls</summary>

- **Shell:** Find word list callers and strings

  ```bash
  grep -rn "openWordLists\|blocklist:" src --include=*.ts | grep -v "\.test\." ; grep -rn "openWordLists" src | head; sed -n 85,130p src/ui/wordLists.ts; grep -n "vocab\." src/i18n/en.ts
  ```
- **Shell:** Read the word list caller in main.ts

  ```bash
  sed -n 600,640p src/main.ts; grep -n "loadEnglishPack\|pack\.\|blocklist" src/main.ts | head -20; ls src/ui/*wordLists*
  ```
- **Shell:** Wire the dictionary into the word list screen

  ```bash
  python3 - <<'EOF'
  import re
  p='src/main.ts'; s=open(p).read()
  s=s.replace("""  const openVocab = () => {
      if (dialogOpen || game.phase !== 'ready') return;""","""  /** Word -> tier, for picking a downloaded article's words (built on first use). */
    let vocabDictionary: Dictionary | null = null;
    const openVocab = () => {
      if (dialogOpen || game.phase !== 'ready') return;
      vocabDictionary ??= new Map(pack.words.map((entry) => [entry.word, entry.tier]));""",1)
  s=s.replace("""      lists: store.data.vocab,
        blocklist: pack.blocklist,""","""      lists: store.data.vocab,
        dict
  … (978 more characters)
  ```

</details>

### 🤖 Claude

Now the tests, with a small fixture article.

<details><summary>6 tool calls</summary>

- **Wrote** `src/content/vocabApi.test.ts`
- **Shell:** Run word download and UI tests

  ```bash
  npx vitest run src/content/vocabApi.test.ts src/ui 2>&1 | tail -30
  ```
- **Shell:** Show the ranking test failure

  ```bash
  npx vitest run src/content/vocabApi.test.ts 2>&1 | grep -A15 "FAIL.*ranks" | head -20
  ```
- **Edited** `src/content/vocabApi.ts`
- **Shell:** Fix test helper and rerun

  ```bash
  python3 - <<'EOF'
  p='src/content/vocabApi.test.ts'; s=open(p).read()
  s=s.replace("""    const many: Dictionary = new Map(Array.from({ length: 400 }, (_, i) => [`w${i.toString(36)}abc`, 4]));""","""    const letters = (i: number) => [i % 26, Math.floor(i / 26) % 26].map((n) => String.fromCharCode(97 + n)).join('');
      const many: Dictionary = new Map(Array.from({ length: 400 }, (_, i) => [`word${letters(i)}`, 4]));""")
  open(p,'w').write(s)
  EOF
  npx vitest run src/content/vocabApi.test.ts 2>&1 | grep -E "Tests|FAIL|Assert" 
  ```
- **Shell:** Adjust fixture and rerun tests

  ```bash
  sed -i '' "s/'Salinity varies. John Smith studied it. John wrote a mid-ocean survey of 40 mi. Darn.',/'Salinity varies, as shown by John Smith, and John wrote a mid-ocean survey of 40 mi. Darn.',/" src/content/vocabApi.test.ts && npx vitest run src/content/vocabApi.test.ts 2>&1 | grep -E "Tests|FAIL|Assert"
  ```

</details>

### 🤖 Claude

Tests pass. Now the CSP, docs and strings.

<details><summary>5 tool calls</summary>

- **Shell:** Read doc sections that mention Datamuse

  ```bash
  sed -n 15,20p PRIVACY.md; echo ---; sed -n 18,26p CREDITS.md; echo ---; sed -n 83,87p README.md; echo ---; sed -n 296,300p docs/REQUIREMENTS.md; grep -rn "datamuse" -i vite.config.ts public 2>/dev/null | head; grep -rn "connect-src" -r . --include=*.toml --include=_headers --include=*.json 2>/dev/null | grep -v node_modules | head
  ```
- **Shell:** Update CSP, docs and strings for Wikipedia

  ```bash
  python3 - <<'EOF'
  def rep(p, old, new):
      s=open(p).read()
      assert old in s, (p, old[:40])
      open(p,'w').write(s.replace(old,new,1))
  rep('index.html', "connect-src 'self' https://api.datamuse.com", "connect-src 'self' https://en.wikipedia.org")
  rep('PRIVACY.md', "Pressing **W** opens **Word lists**, where you can download words related to a topic. Only when you click **Download words**, Inky Keys sends the topic you typed, and nothing else, to the free [Datamuse API](https://www.datamuse.com/api/) at `api.datamuse.com`. The request carries no cookies, no referrer and no identifiers. Dat
  … (3908 more characters)
  ```
- **Shell:** Read release entries and releasing guide

  ```bash
  sed -n 1,40p src/core/releases.ts; sed -n 1,40p docs/RELEASING.md
  ```
- **Shell:** Add 2.15.0 release and run checks

  ```bash
  python3 - <<'EOF'
  p='src/core/releases.ts'; s=open(p).read()
  s=s.replace("""export const RELEASES: readonly Release[] = [
  ""","""export const RELEASES: readonly Release[] = [
    {
      version: '2.15.0',
      date: '2026-11-18',
      notes: ['release.2.15.0.wikipedia'],
    },
  """,1)
  open(p,'w').write(s)
  p='src/i18n/en.ts'; s=open(p).read()
  i=s.index("  'release.2.14.0.")
  s=s[:i]+"  'release.2.15.0.wikipedia': 'Word lists now come from Wikipedia: type any topic and get the words that stand out in its article.',\n"+s[i:]
  open(p,'w').write(s)
  EOF
  npm version 2.15.0 --no-git-tag-version >/dev/null && g
  … (64 more characters)
  ```
- **Shell:** Build and check launch config

  ```bash
  npm run build 2>&1 | tail -5; cat .claude/launch.json 2>/dev/null
  ```

</details>

### 🤖 Claude

Check and build pass. Now testing in the real browser, mainly to confirm the browser allows the Wikipedia request (CORS and the CSP).

<details><summary>4 tool calls</summary>

- **preview_start** `{"name":"inky-keys-dev"}`
- **computer** `{"action":"screenshot","scale":0.5}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[268,496],"action_summary":"Opens the Word lists dialog"}},{"name":"find","input":{"query":"Topic"}}]}`
- **computer** `{"action":"screenshot","scale":0.5}`

</details>

### 🤖 Claude

I opened Saves by mistake. Closing it and opening Word lists.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","coordinate":[588,524],"action_summary":"Closes the Saves dialog"}},{"name":"computer","input":{"action":"left_click","coordinate":[268,448],"action_summary":"Opens the Word lists dialog"}},{"name":"find","input":{"query":"Topic"}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_96","action_summary":"Focuses the topic field"}},{"name":"computer","input":{"action":"type","text":"ocean","action_summary":"Types the topic ocean"}},{"name":"computer","input":{"action":"key","text":"Return","action_summary":
… (143 more characters)`

</details>

### 🤖 Claude

It works in the browser. Checking the request itself and the remaining cases.

<details><summary>5 tool calls</summary>

- **read_network_requests** `{"urlPattern":"wikipedia"}`
- **read_console_messages** `{"onlyErrors":true}`
- **javascript_tool** `{"action":"javascript_exec","text":"performance.getEntriesByType('resource').filter(e => !e.name.startsWith(location.origin)).map(e => e.name.slice(0, 120))"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_96","action_summary":"Focuses the topic field"}},{"name":"computer","input":{"action":"type","text":"mercury","action_summary":"Types the topic mercury"}},{"name":"computer","input":{"action":"key","text":"Return","action_summa
… (572 more characters)`
- **computer** `{"action":"screenshot","scale":0.6}`

</details>

### 🤖 Claude

Word lists now come from Wikipedia in the game, and it works in the browser. `npm run check` (413 tests) and `npm run build` pass.

In the dev game, downloading "ocean" saved 288 words, and the only outside request was one to `en.wikipedia.org`. "mercury" and nonsense like "qwzxv" both show the new message: *"No article with enough words for that topic. Try being more specific (e.g. "planet mercury")."* I didn't test the offline message in the browser; a unit test covers it.

What changed on `feat/wiki-words`:
- **[vocabApi.ts](src/content/vocabApi.ts):** fetches the article and ranks its words. Two more fixes since the trial:
  - A rare word that starts a sentence is no longer mistaken for a name.
  - "horses" now includes "horse".
- **[wordLists.ts](src/ui/wordLists.ts) / [main.ts](src/main.ts):** the word-list screen now gets the bundled dictionary, built the first time you open it.
- **[vocabApi.test.ts](src/content/vocabApi.test.ts):** rewritten for Wikipedia. It covers ranking, dropping names and prefixes, the 300-word cap, disambiguation pages and stubs, and failure reasons.
- **Docs and strings:** the CSP now allows only Wikipedia. PRIVACY, README, CREDITS (CC BY-SA, single words only), REQUIREMENTS and the dialog text all say Wikipedia instead of Datamuse.
- **Release:** 2.15.0, with the note "Word lists now come from Wikipedia…".

Lists players downloaded from Datamuse keep working, because the save format didn't change.

When I commit, I'll also export the transcript and scan it before it goes in. After the merge, I'll start the manuscript look prototype on `feat/manuscript` and send you screenshots to check before wiring it to gameplay.

## 🧑 Prompt

> Commit, merge, go on

<details><summary>1 tool call</summary>

- **Shell:** Read scan note and export transcript

  ```bash
  cat /Users/[removed]/.claude/projects/-Users-[removed]-projects-inky-keys/memory/transcript-scan-no-secrets.md; npm run transcript 2>&1 | tail -5; git status --short
  ```

</details>

# French and Spanish language support

Claude Code session started 2026-11-20. 3 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> I want to add support for french and spanish in two different milestones

<details><summary>5 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  grep -n "^#" docs/REQUIREMENTS.md && ls src/i18n src/content site && wc -l docs/REQUIREMENTS.md src/i18n/*.ts && grep -rn "locale\|i18n" docs/REQUIREMENTS.md | head -40
  ```
- **Shell:** Ran a command

  ```bash
  sed -n 100,130p docs/REQUIREMENTS.md && sed -n 178,307p docs/REQUIREMENTS.md && cat src/i18n/index.ts && ls -R src/content/en src/content/layouts site/en | head -50 && grep -rn "vocab\|https://" src/content/vocabApi.ts | head -15 && grep -rln "locale" src --include=*.ts | head -30
  ```
- **Shell:** Ran a command

  ```bash
  grep -rn "setLocale\|navigator.language\|getLocale" src | grep -v test | head; grep -n "^#\|^| [0-9]" docs/progression/README.md | tail -15; head -40 src/core/releases.ts; ls src/content/en; grep -rln "Fair Copy\|fairCopy" src | head; cat src/content/en/index.ts | head -40; grep -n "deadKey\|altGr\|AltGr" -r src/content/layouts | head; grep -rn "\[a-z\]\|a-zA-Z" src --include=*.ts 2>/dev/null | grep -v test | head -20
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "passage\|PASSAGES" src/core/fairCopy.ts | head -10; ls src/core | head -60; grep -n "SAVE_VERSION =" -r src/storage; grep -n "layout\|locale" src/storage/schema.ts | head -15; grep -n "fair\|Fair" docs/REQUIREMENTS.md docs/progression/README.md | head; git log --oneline | sed -n 1,25p
  ```
- **Shell:** Ran a command

  ```bash
  grep -n "plural\|One\b\|_one\|Other" src/i18n/en.ts | head -8; grep -rn "event.key\|e.key\b\|\.code\b" src/main.ts src/core/input.ts src/ui/*.ts 2>/dev/null | head -8; grep -n "Digit\|'1'" src/core/abilities.ts src/main.ts | head -5; sed -n 20,40p src/core/fairCopy.ts; grep -n "connect-src" index.html vite.config.ts 2>/dev/null; grep -n "31\|Fair Copy" docs/REQUIREMENTS.md | head
  ```

</details>

### 🤖 Claude

Mapped the i18n, content-pack, layout and Fair Copy code. Now writing the two milestones into the requirements doc on a branch.

<details><summary>3 tool calls</summary>

- **Shell:** Ran a command

  ```bash
  git switch -c chore/fr-es-milestones && grep -n "^## 14" docs/REQUIREMENTS.md
  ```
- **Edited** `docs/REQUIREMENTS.md`
- **Edited** `docs/REQUIREMENTS.md`

</details>

### 🤖 Claude

I added the two milestones to a new section, **§13d Round 4 milestones (languages)**, in [REQUIREMENTS.md](docs/REQUIREMENTS.md). They're numbered 32 and 33 because Fair Copy was M31 in the git history, even though it isn't in the milestone table yet. The change is on a new branch, `chore/fr-es-milestones`, and isn't committed.

**M32, Français** goes first because it does most of the work both languages need:
- **Language setting:** a new Language setting saved per player. It sets both the menus and the typing words, which needs a save version bump.
- **Menus:** French menu text in `fr.ts`. Plurals use `Intl.PluralRules`, because the current "One/Other" message pairs don't work for French, which treats 0 as singular.
- **Words:** a French set of words, blocklist, holiday words and Fair Copy passages.
- **Accents:** accented letters become their own key group, and dead keys are supported. Typed letters are compared after Unicode normalization, so `^` then `e` counts the same as a single `ê` key.
- **AZERTY layout:** this one needs a code fix. The 1/2/3 power keys check `event.key` ([main.ts:1450](src/main.ts:1450)), and on AZERTY those keys give `&é"` without Shift. They'll need to check which physical key was pressed (`event.code`) instead.
- **Daily Page and challenge links:** both now include the language, so everyone on the same language and layout gets the same page.
- **Downloaded words** come from `fr.wikipedia.org`. That's a second allowed web address in `connect-src`, so the CSP and `PRIVACY.md` both need updating.
- **Web pages:** copies of the static pages go in `site/fr/`.

**M33, Español** builds on that: Spanish menu text and word set, Fair Copy passages that keep `¿ ¡`, typing `ñ` and `á é í ó ú ü`, a Spanish (Spain) keyboard layout, Spanish Wikipedia and `site/es/`.

Other decisions I made that you may want to change:
- Thanksgiving stays English-only. Every language gets the December looks.
- Fair Copy bests and the Bookworm sticker are counted separately for each language.
- Early Apprentice chapters naturally avoid accented words, because a word is only offered when you've selected every key it uses.

I added three open questions to §14:
- **Word lists:** which French and Spanish lists have word frequencies and a license that allows redistribution. Each license needs checking before anything is added.
- **Spanish layout:** Spain first, or Latin American, which is more common in the Americas.
- **Later layouts:** QWERTZ and UK.

## 🧑 Prompt

> Can you look at this url to get some additional guidance and help me develop a full plan for these new features. I also don't fully understand how you would type accents on the keyboard for other languages so maybe the game should incorpoate tips into the learning process. This is a huge milestone so for now let's just plan it out: https://david-bailly.com/portfolio/typing-games-how-and-why/16/

<details><summary>3 tool calls</summary>

- **Agent** `{"description":"Read typing-games article","subagent_type":"web-fetch","prompt":"Read https://david-bailly.com/portfolio/typing-games-how-and-why/16/ (and if it is one page of a multi-page series, also read adjacent pages 15 and 17 if they look relevant, e.g. https://david-bailly.com/portfolio/typin
… (648 more characters)`
- **Agent** `{"description":"Explore input and layouts","subagent_type":"Explore","prompt":"In /Users/[removed]/projects/inky-keys (TypeScript + PixiJS typing game), medium thoroughness. I'm planning French (AZERTY) and Spanish (Spain ISO) support with dead keys and accented letters. Report concisely with file
… (1150 more characters)`
- **Agent** `{"description":"Explore content and teaching","subagent_type":"Explore","prompt":"In /Users/[removed]/projects/inky-keys (TypeScript + PixiJS typing game for kids), medium thoroughness. I'm planning French and Spanish support. Report concisely with file:line references:\n1. Teaching mechanics: bri
… (1222 more characters)`

</details>

### ❓ Claude asked

- The article recommends letting players pick the menu language and the typing language separately (e.g. English menus, French words for a learner). Should Inky Keys do that, or use one Language setting for both?
  - Separate (Recommended)
  - One setting
- Accents take extra key presses (e.g. ^ then e). How strict should the game be about them?
  - Taught, then required (Recommended)
  - Always required
  - Optional, off by default
- Many players will type French/Spanish on a US keyboard, where accents work differently per system (Mac: Option+e then e; Windows: US-International layout). Which keyboards should the accent tips cover?
  - Native + US keyboards (Recommended)
  - Native layouts only
- How should accent typing be taught in the game?
  - Accent chapters
  - Just-in-time hints
  - Accent help card
  - Accent practice page

**Answer:** Your questions have been answered: "The article recommends letting players pick the menu language and the typing language separately (e.g. English menus, French words for a learner). Should Inky Keys do that, or use one Language setting for both?"="Separate (Recommended)", "Accents take extra key presses (e.g. ^ then e). How strict should the game be about them?"="Taught, then required (Recommended)", "Many players will type French/Spanish on a US keyboard, where accents work differently per system (Mac: Option+e then e; Windows: US-International layout). Which keyboards should the accent tips cover?"="Native + US keyboards (Recommended)", "How should accent typing be taught in the game?"="Accent chapters,Just-in-time hints,Accent help card,Accent practice page". You can now continue with these answers in mind.

<details><summary>1 tool call</summary>

- **Asked questions** (shown above)

</details>

### ❓ Claude asked

- The best French and Spanish word lists with frequencies (e.g. Lexique for French) tend to be CC BY-SA, which means the bundled words.json for those languages would be share-alike (the code stays MIT). Is that acceptable?
  - CC BY-SA is fine (Recommended)
  - Permissive only
- Who checks the French and Spanish translations of ~750 menu strings, briefings and web pages?
  - Claude drafts, native review
  - Claude drafts, ship it

**Answer:** Your questions have been answered: "The best French and Spanish word lists with frequencies (e.g. Lexique for French) tend to be CC BY-SA, which means the bundled words.json for those languages would be share-alike (the code stays MIT). Is that acceptable?"="CC BY-SA is fine (Recommended)", "Who checks the French and Spanish translations of ~750 menu strings, briefings and web pages?"="Claude drafts, native review". You can now continue with these answers in mind.

<details><summary>2 tool calls</summary>

- **Asked questions** (shown above)
- **Wrote** `/Users/[removed]/.claude/plans/can-you-look-at-cryptic-oasis.md`

</details>

<details><summary><strong>📋 Plan for approval</strong></summary>

# Plan: French and Spanish, with accent typing taught in the game

## Context

Inky Keys is English-only. You want French and then Spanish. You also want the game to teach how to type accents, because it isn't obvious: on a French AZERTY keyboard `é` is its own key but `ê` is `^` then `e`, and on a US Mac it's Option+i then e.

David Bailly's *Typing games: how and why?* (page 16, "Bringing the game to a larger audience") shaped these decisions:
- **Separate languages.** Let players choose the menu language and the typing language separately.
- **Accents cost extra key presses.** Count key presses rather than letters when judging difficulty, and keep the rare accents (`ï`, `ê`) out of fast play until they've been taught.
- **Keep the accents.** Letting `e` count for `é` "defeats the purpose" of learning to type a language. Offer it only as an accessibility option.
- **Mechanics tied to a key's position break on other keyboards.** Inky Keys has exactly this problem: the 1/2/3 power keys need Shift on AZERTY.

**Your decisions**
- A separate **Menu language** (one per device) and **Words language** (one per player).
- Accents are **taught first, then required**. A per-player **Forgiving accents** setting lets `e` count for `é`.
- Tips cover **AZERTY, Spanish ISO and US keyboards** (Mac Option keys, Windows/Chromebook US-International).
- Teaching uses four things: **accent chapters**, **just-in-time hints**, an **accent help card** and an **Accents practice preset**.
- **CC BY-SA word lists are fine.**
- **Claude drafts the translations; a native speaker reviews them before each language ships.**

**What the code exploration found.** The game can't receive an accented letter yet:
- [keyboard.ts:45](src/input/keyboard.ts:45) drops every key press that has Alt/AltGr/Option held or that is mid-composition.
- `"Dead"` keys fall through `isPrintable` (:26).
- Nothing listens for composition events.

There are also ASCII assumptions:
- [build-words.ts:78](scripts/build-words.ts:78) filters with `/^[a-z]+$/`.
- `vocabApi.ts:77` extracts words with `[A-Za-z]+`.
- The custom word lists in `schema.ts:281` and the English vowel and rare-letter sets.

The layout format has no AltGr level, no dead keys and no ISO keys.

## Shape: three milestones, not two

The keyboard groundwork is big enough to ship on its own, and it is useful without French words (a French child can learn English on AZERTY). Splitting it out keeps each milestone testable.

| # | Milestone | Ships |
|---|---|---|
| 32 | **Keys beyond A–Z** | Dead keys, AltGr and Option work. AZERTY and Spanish (Spain) layouts, with English words. The 1/2/3 keys work on any layout. |
| 33 | **Français** | The menu and words languages, the whole accent-teaching system, French menus, words, passages and pages. |
| 34 | **Español** | Spanish menus, words, passages and pages, plus `ñ`, `ü` and `¿ ¡`, reusing everything from M33. |

The first implementation step rewrites §13d of `docs/REQUIREMENTS.md` (the uncommitted draft on `chore/fr-es-milestones`) to match this plan. Each milestone gets its own `feat/` branch, release entries and a version bump, and ends with `npm run snapshots -- m<N>` and an entry in `docs/progression/README.md`.

---

## M32: Keys beyond A–Z (input and layouts)

### 1. A text sink for typed characters (`src/input/keyboard.ts`)
- **Take characters from text input, not `keydown`.** During play and Fair Copy, focus a visually hidden `<textarea>` with `autocapitalize`, autocorrect and spellcheck off, and `inputmode="text"`. Read characters from its `beforeinput` events (`insertText`, and `compositionend` data). This handles dead keys, AltGr, Option and the composition behaviour of Safari and Chrome on macOS the same way everywhere. Clear the sink after each character.
- **Keep `keydown` for control keys and shortcuts:** Enter, Backspace, arrows, Escape and the shortcuts (`preventDefault` only on those).
- **Dead keys:**
  - A `keydown` with `key === "Dead"` is never a miss.
  - It raises a new `onDeadKey(code)` event so the HUD can show the waiting accent (a small `^` beside the nib) and the hint system knows the player started an accent.
  - A dead key followed by a letter it can't combine with produces two characters (`^z`), and that counts as a miss.
- **Spike first.** A dev-only test page logs `keydown`/`beforeinput`/`composition` events. Check it on macOS (Chrome, Safari, Firefox) with US, French and Spanish input sources, which you can add in System Settings → Keyboard. If the sink misbehaves anywhere, fall back to `keydown` plus `compositionend` on the sink.
- **Normalize** everything to NFC at the point where characters enter: typed characters, word lists, passages and downloaded words.

### 2. Shortcuts that follow the physical key
- The power keys at [main.ts:1450](src/main.ts:1450) and the difficulty picker (`input.ts:295`, `menu.ts:1309`) match `event.code` (`Digit1–4`, `Numpad1–4`), so they work on AZERTY without Shift.
- On AZERTY, `é` (Digit2) is a typeable letter. A Digit2 press therefore counts as a power key only when the character it makes isn't one of the selected keys. The rule already at `main.ts:1496` is extended to cover this.

### 3. Layout format (`src/content/layouts/`)
- **`LayoutKey`** (`types.ts:13`) gains:
  - optional `altGr` and `altGrShift`
  - `dead?: { base?: true; shift?: true; altGr?: true }`, which marks dead-key levels
  - a per-layout `compose` table (`'^' → { a:'â', e:'ê', … }`)
- **`LayoutId`** gains `'fr-azerty'` and `'es-iso'`.
- **ISO builder.** A new `iso.ts` beside `ansi.ts` adds `IntlBackslash` (`<` `>` left of Z/W) and ISO Enter. `handsArt.ts` gets ISO row offsets and a modifier row (Shift, AltGr/Option) so it can draw a press that uses a modifier.
- **AZERTY (France, PC):**
  - home row `q s d f g h j k l m`
  - number row `& é " ' ( - è _ ç à ) =`, with Shift giving the digits
  - `^` and `¨` as dead keys on BracketLeft
  - `ù` on Quote
  - AltGr for `€ @ # { [ | \`
  - The Mac French layout's number-row symbols differ. Store them as a `mac` override on the keys that differ, chosen by the platform setting in step 5. Letters and accents are the same on both.
- **Spanish (Spain) ISO:**
  - `ñ` on Semicolon
  - dead `´` and `¨` on Quote
  - dead `` ` `` and `^` on BracketLeft
  - `ç` on Backslash
  - `' ?` and `¡ ¿` right of 0
  - AltGr for `@ # € [ ] { } \ |`
- **Apprentice course.** Each new layout gets a `lessonPlan` (`ansi.ts:76`) of 27 chapters (26 letters and space), keeping the rule at `types.ts:38`. Accented letters, including `ñ`, are taught in the separate accent chapters in M33.
- **Fix the regions in `keySelection.ts`:**
  - The capitals region currently keeps any letter key that has a `shift` value (:31). That pulls AZERTY digits in, so it needs the shift character to be a letter.
  - `numberSymbols` and `lettersPunctuation` use a US string (:79–81). Build them from the layout instead.
- **Settings** lists the two new layouts. The Type Case and the hands guide follow.

### 4. Matching by code point
- `typeChar`/`lockOn` (`input.ts:232–333`) and `registerError` (:68) move from UTF-16 indexes to code-point arrays, as `editBuffer` already does. The same goes for `wordDifficulty` lengths in `wordPool.ts`.

### 5. Platform setting (device-wide, `src/settings.ts`)
- A setting **"Accent keys for: Mac / Windows or Chromebook"**, set from `navigator.userAgentData?.platform ?? navigator.platform`. This reads nothing over the network.
- It chooses the Mac or PC variant of a layout, and in M33 which US-keyboard method the tips show.

**Release:** AZERTY and Spanish keyboards, AltGr symbols, and power keys without Shift. No save version change: layout ids are checked with a fallback already (`layouts/index.ts:16`).

---

## M33: Français (languages and accent teaching)

### 1. Two language settings
- **Menu language** (`Settings`, device-wide):
  - The default comes from `navigator.language` and falls back to English.
  - It replaces the bare `setLocale(navigator.language)` call at `main.ts:97`.
  - Changing it re-renders the current menu screen and sets `<html lang>`.
- **Words language** (per player, in `SaveData`, next to `layout`):
  - New players get the menu language.
  - Changing it takes effect from the next page.
- **Save version 16:**
  - adds `wordsLanguage: 'en'`
  - adds `accents: { forgiving: false; seen: string[] }`
  - adds `apprentice.accentStars: Record<lang, number[]>`
  - The migration pattern is the one at `schema.ts:495`/`:524`.

### 2. Translation plumbing (`src/i18n/`)
- `locales` registry with `fr`. `fr.ts` is typed `Record<MessageKey, string>` so a missing key fails typecheck; `release.*` keys are allowed to be missing and fall back to English per key, as `t()` already does at :25.
- A `tCount(key, n)` helper using `Intl.PluralRules`, with `.one` and `.other` keys. The three `=== 1` call sites move to it: `fairCopySession.ts:190`, `fairCopyView.ts:467` and `stickerToast.ts:28`. This matters for French, where 0 is singular.
- **Menu shortcut letters become translatable** (e.g. `menu.key.settings`), so French menus get mnemonic letters that don't clash. "Réglages" and "Recommencer" both start with R. Keycap labels (`menu.ts:718–730`) also move into `t()`.
- **Fit.** French is about 25% longer than English. Check every menu at 320 px width and at the largest text size.

### 3. Content packs per language
- **Registry.** `src/content/packs.ts` holds `loadPack(lang)`, which lazily imports `./en`, `./fr` or `./es`. `ContentPack` moves out of `en/index.ts`, and `main.ts:182` calls the registry.
- **`scripts/build-words.ts` takes a language** (`npm run words:build -- fr`):
  - Each language has its own alphabet: French uses a–z plus `à â ç é è ê ë î ï ô ù û ü`.
  - Drop words containing `œ`, `æ` or `ÿ`. They're rare and hard to type, as the article advises.
  - Use the `naughty-words` `fr` list, a hand-reviewed French `ALLOW` list, and frequency tiers from the chosen CC BY-SA source. **Lexique** is the first candidate; confirm its license before use.
  - Credit the source in `CREDITS.md`, with a note that `src/content/fr/words.json` is CC BY-SA.
- **Blocklist** (`blocklist.ts:28`). `normalizeForCheck` also removes accents (NFD, then strip combining marks) so `pùte`-style spellings are caught. Endings (`INFLECTIONS`) are set per language.
- **Difficulty by key presses.** `wordDifficulty` adds the extra key presses each accent needs on the player's layout and platform, using `howToType` from step 4 below. A new `GAME_CONFIG.accents` holds the extra weight and a few seconds of creature slowdown per extra press.
- **Capitals.** `styleWord` (`contentSource.ts:113`) never capitalizes a word whose first letter is an accented capital that can't be typed on the player's setup (e.g. `É` on Windows AZERTY).
- **Holidays.** `fr/holidays.ts` has December words (Noël). Thanksgiving looks and words stay English-only: looks follow the menu language, words follow the words language.
- **Downloaded words** (`vocabApi.ts`):
  - Use the Wikipedia origin for the words language (`fr.wikipedia.org`) and extract words with `\p{L}+`.
  - Add the origin to the CSP `connect-src` in `index.html`.
  - Update `PRIVACY.md` and the CLAUDE.md line that names the single allowed origin.

### 4. "How to type" data (`src/core/accents.ts`, pure and unit tested)
- `howToType(char, layout, platform): KeyStep[] | null`. A `KeyStep` is `{ code, shift?, altGr?, option?, label }`. The steps come from:
  - **AZERTY and Spanish ISO:** the layout's direct keys and its `compose` table. For example, `ê` is `[BracketLeft]`, then `[KeyE]`.
  - **US keyboard, Mac:** Option+e then a letter gives `á é í ó ú`; Option+\` gives grave; Option+i gives circumflex; Option+u gives `ë ï ü`; Option+n then n gives `ñ`; Option+c gives `ç`; Option+1 gives `¡`; Option+Shift+/ gives `¿`.
  - **US keyboard, Windows or Chromebook (US-International):** `'` then a letter for acute; `` ` `` for grave; Shift+6 for circumflex; Shift+' for diaeresis; Shift+\` then n for `ñ`, or AltGr+n; AltGr+, for `ç`; AltGr+1 for `¡`; AltGr+/ for `¿`. The help card explains how to turn US-International on.
- **Detecting US-International on Windows.** If a Windows player on US QWERTY tries an accent and no `Dead` key arrives, the hint says US-International may be off and links to the help card.

### 5. Accent teaching
- **Accent chapters.** A second part of the Contents page, "Accents", unlocks once the base letters are learned (after the letters chapter).
  - Stars are stored per words language (`apprentice.accentStars`). The 27-chapter course and its saved chapter numbers stay as they are.
  - French chapters:
    1. `é`
    2. `è à ù`
    3. `ç`
    4. circumflex `â ê î ô û`
    5. `ë ï ü`
  - Each chapter adds its letters to the keys and uses the existing intro card (`overlay.ts:195`). That card currently shows one key per finger, so it gets a numbered, animated key sequence from `howToType`: "1 press ^, 2 press e". With reduced motion on, it shows the numbered steps without animation.
- **Just-in-time hints.**
  - The first time a player meets a letter that has no accent lesson yet (`accents.seen`) in Free Write, Fair Copy or the Daily Page, an `accent` mechanic shows a short briefing. It goes through the existing `mechanics.ts` and `briefingDialog.ts` flow, which already has guided slow spawns.
  - After a miss on an accented letter, that creature shows a small key-sequence tag.
  - A waiting dead key shows beside the nib.
- **Accent help card.** A dialog showing every accented letter in the words language with the steps for the player's layout and platform, drawn as keycaps. You can open it from How to play, the Type Case, the pause menu and every accent hint. It's also a static page, `site/fr/accents/`.
- **Accents practice preset.** In `keySelection.ts`: "Letters + accents". It adds an `accents` region (the accented letters of the words language), and word picks lean toward accented words (`GAME_CONFIG.accents.practiceWeight`).
- **Type Case.** An "Accents" strip under the keyboard picture, so accented letters on US layouts (which have no key of their own) can be turned on and off.
- **Forgiving accents** (per player, off by default).
  - Matching compares letters with their accents removed, but the creature still shows the accented word.
  - It's mentioned in the For parents and teachers page.
  - The Daily Page records whether it was on, and copied results show a small mark when it was.

### 6. Language-aware modes
- **Daily Page.**
  - The seed becomes `daily:${id}:${layout}:${lang}` for languages other than English. English seeds stay exactly as they are ([daily.ts:23](src/core/daily.ts:23)).
  - French Daily Pages include the common accents (not `ë ï ü`).
  - There's still one counted go per day, whichever language you play in.
- **Challenge links** (`challenge.ts:26`). An optional `w` field holds the words language. A link without it means English, so the link version stays `v:1`.
- **Fair Copy** (`fairCopy.ts:24`).
  - `Passage` gains `lang`. French passages are public-domain Gutenberg texts (e.g. Verne, Hugo, Dumas, Perrault, La Fontaine).
  - They keep accents but use plain punctuation: straight quotes, no guillemets, no non-breaking space before `; : ! ?`.
  - Passages are dealt from the words language.
  - Bests are kept per language, and Bookworm (`stickers.ts:145`) is earned by copying every passage in any one language.
- **Fonts.** Check that the bundled Atkinson Hyperlegible has `ç`, accented capitals, `ñ`, `¿`, `¡` and `€`.

### 7. Web pages (`scripts/site-pages.ts`)
- `loadPages` loops over the locales and builds `/fr/…` URLs, with `hreflang` alternates, a `sitemap.xml` entry for each locale, and the nav, footer and `<html lang>` text for each locale.
- `site/fr/` is a copy of `site/en/` plus a translated Privacy page.
- The `<noscript>` text stays English.

**Release:** French, with release notes in both languages. **Native-speaker review of `fr.ts`, the pages and the passages has to happen before the release tag.**

---

## M34: Español

Mostly content, because M33 built the system.
- `es.ts` with the menu shortcut letters.
- An `es` pack:
  - alphabet a–z plus `á é í ó ú ü ñ`
  - `naughty-words` `es` list
  - a CC BY-SA frequency source; a Hunspell `es` dictionary plus a subtitle frequency list are candidates, with licenses to confirm
- Navidad holiday words and `es.wikipedia.org` (CSP and PRIVACY).
- **Accent chapters:**
  1. `ñ`
  2. `á é`
  3. `í ó ú`
  4. `ü`
  5. `¿ ¡`, used on punctuation pages and in Fair Copy
- Fair Copy passages that keep `¿ ¡` (e.g. Cervantes, Bécquer, Galdós, Darío).
- `site/es/` and the `es` help card page.
- Native-speaker review before release.
- Latin American layout as a possible later layout file (open question in §14).

---

## Critical files
- **Input:** `src/input/keyboard.ts`, `src/core/input.ts`, `src/core/editing.ts`, `src/main.ts` (shortcuts, `setLocale`, pack loading), `src/fairCopySession.ts`
- **Layouts:** `src/content/layouts/{types,ansi,iso(new),fr-azerty(new),es-iso(new),index}.ts`, `src/render/handsArt.ts`, `src/ui/typeCase.ts`, `src/core/keySelection.ts`
- **Content:** `src/content/{packs(new),contentSource,wordPool,generator,blocklist,contentFilter,vocabApi}.ts`, `src/content/{fr,es}/`, `scripts/build-words.ts`
- **Teaching:** `src/core/accents.ts` (new), `src/core/mechanics.ts`, `src/core/campaign.ts`, `src/render/overlay.ts`, `src/ui/briefingDialog.ts`, a new accent help dialog in `src/ui/`
- **i18n:** `src/i18n/{index,en,fr,es}.ts`, `src/ui/menu.ts`, `src/settings.ts`
- **State:** `src/storage/schema.ts` (v16), `src/core/{daily,challenge,fairCopy,stickers}.ts`, `src/core/config.ts` (`GAME_CONFIG.accents`)
- **Site and policy:** `scripts/site-pages.ts`, `site/{fr,es}/`, `index.html` (CSP), `PRIVACY.md`, `CREDITS.md`, `CLAUDE.md`, `docs/REQUIREMENTS.md`, `docs/DESIGN.md` (accent hint visuals)

## Verification
- **Unit tests** (in `npm run check`):
  - `howToType` for every accented letter × layout × platform
  - NFC matching and decomposed input
  - dead key followed by a wrong letter counts as a miss
  - forgiving matching
  - capitals region on AZERTY
  - English Daily seeds unchanged
  - challenge links with and without `w`
  - the v15→v16 migration
  - blocklist accent folding
  - French and Spanish pack tests modelled on `en/pack.test.ts`
  - a test that fails if `fr`/`es` is missing a non-release key
- **In the browser** (`npm run dev`, built-in browser pane):
  - Switch macOS input sources to French and Spanish (and back to US with Option combinations).
  - Play an Apprentice chapter, an accent chapter, Free Write with the Accents preset, the Daily Page and Fair Copy.
  - Confirm dead keys show the waiting accent, AltGr/Option symbols arrive, and 1/2/3 fire on AZERTY.
  - Check menus at phone width in French and Spanish.
  - Windows testing (AltGr, US-International) needs a Windows machine or a tester. It's listed as a release-check item.
- **Production build** (`npm run build && npm run preview`): the offline service worker precaches the new packs and `/fr/`, `/es/` pages; the CSP allows only the intended Wikipedia origins; Lighthouse scores hold.
- **Each milestone ends with** `npm run snapshots -- m<N>` and a `docs/progression/README.md` entry.


</details>

<details><summary>1 tool call</summary>

- **Presented the plan** (shown above)

</details>

### 🤖 Claude

Since you asked only for a plan for now, I'll write the approved plan into the requirements doc and stop before any code.

<details><summary>1 tool call</summary>

- **Shell:** Ran a command

  ```bash
  git branch --show-current && grep -n "^## 13d\|^## 14\|^### Languages" docs/REQUIREMENTS.md
  ```

</details>

### 🤖 Claude

I'll replace lines 298–317 with the new section using a short script, since the old text is already in this conversation.

<details><summary>1 tool call</summary>

- **Shell:** Ran a command

  ```bash
  cat > <temp file> <<'EOF'
  ## 13d. Round 4 milestones (languages)

  Milestone 31 was Fair Copy (2.23.0–2.27.0). French and Spanish come in three milestones: the keyboard groundwork ships first, on its own (a French child can learn English words on AZERTY), then French builds the language system and accent teaching, then Spanish adds a second language on top. The guidance follows David Bailly's *Typing games: how and why?* (the "Bringing the game to a larger audience" section): let pl
  … (7321 more characters)
  ```

</details>

### 🤖 Claude

The plan is written into §13d of [REQUIREMENTS.md](docs/REQUIREMENTS.md), with the open questions updated in §14. It's on branch `chore/fr-es-milestones`, not committed, and no game code has changed. The full plan is also in `/Users/[removed]/.claude/plans/can-you-look-at-cryptic-oasis.md`.

**What the article changed:** it argues for letting players pick the menu language and the typing language separately. It also points out that an accent can take more than one key press, so difficulty should count presses. Letting `e` count for `é` defeats the point of learning a language's typing, so that's only an accessibility option. And anything tied to a key's position breaks on other keyboards, which is already true of the 1/2/3 power keys on AZERTY.

**Why it's three milestones instead of two:** the game can't receive an accented letter at all yet. [keyboard.ts:45](src/input/keyboard.ts:45) drops anything typed with Option or AltGr held, and it drops dead keys. Fixing that is a milestone of its own:

- **M32, Keys beyond A–Z:** typing goes through a hidden text field so dead keys, AltGr and Option all work. It adds the AZERTY and Spanish keyboard layouts and makes the power keys work without Shift, still with English words.
- **M33, Français:** a separate menu language and words language, French menus, words and passages, and the whole accent-teaching system.
- **M34, Español:** mostly new content, because M33 builds the system.

**How accents get typed** (the game shows these steps):

| Keyboard | Example |
|---|---|
| French AZERTY | `é` has its own key; `ê` is `^` then `e` |
| Spanish | `ñ` has its own key; `á` is `´` then `a` |
| US keyboard, Mac | Option+e then e gives `é`; Option+n then n gives `ñ` |
| US keyboard, Windows or Chromebook | needs the US-International layout turned on, then `'` then e gives `é` |

**How the game teaches them:**
- **Accent chapters:** a second part of the Contents page, each chapter opening with the key presses numbered and animated on the keyboard picture.
- **Hints when they're needed:** a short briefing the first time an untaught accent shows up. After a miss on an accented letter, its key steps appear on that creature.
- **Help card:** shows every accented letter and how to type it on the player's own keyboard. It's also a web page.
- **Practice:** a "Letters + accents" preset.
- **Forgiving accents:** an option, off by default, that lets `e` count for `é`.

**Still open:**
- Which word lists to use, with each license checked before anything is added.
- Whether the hidden text field works the same in every browser. That's a quick test at the start of M32, but Windows needs a Windows machine or a tester.
- Who the native-speaker reviewer will be.
- Whether Spanish starts with the Spain layout or the Latin American one.

## 🧑 Prompt

> commit this

<details><summary>1 tool call</summary>

- **Shell:** Ran a command

  ```bash
  npm run transcript 2>&1 | tail -5 && git status --short
  ```

</details>

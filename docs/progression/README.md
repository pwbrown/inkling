# How Inkling grew

Screenshots of Inkling at the end of every milestone, from the first moving blob to today. Each one comes from a real build of that milestone's commit, played in headless Chrome by `npm run snapshots` (see [Keeping this up to date](#keeping-this-up-to-date)).

The first half puts **the same screen side by side** across versions, so you can see what changed. The second half goes **milestone by milestone**, saying what each one added.

A note on the pictures: an auto-typer plays the pages, so the grades are all A+. The **lineup** shots are staged. They swap the creatures on screen for one of each kind (a drip, a Blotling, a crimson, a violet, a Run-on and a Misprint), so creature looks can be compared even in versions where those creatures only show up chapters later.

## Side by side

### Creatures on the page

| M1 | M2 | M3 |
|---|---|---|
| <img src="m01/play.png" width="280" alt="M1: one placeholder blob labelled 'page'"> | <img src="m02/play.png" width="280" alt="M2: single-letter ink drips"> | <img src="m03/play.png" width="280" alt="M3: Blotlings carrying words"> |
| One placeholder blob with a word. No typing yet. | **Drips:** letters to type, plus the ink bar and score. | **Blotlings:** real words built from your keys. |

| M8 | M11 | M14 and later |
|---|---|---|
| <img src="m08/lineup.png" width="280" alt="M8 lineup: flat navy shapes, Run-on and Misprint as text"> | <img src="m11/lineup.png" width="280" alt="M11 lineup: creatures with faces, crimson and violet colors, centipede Run-on, stamp Misprint"> | <img src="m14/lineup.png" width="280" alt="M14 lineup: spiky horned crimson, crowned violet"> |
| Run-ons and Misprints arrive, but every target is still a flat shape. | **Faces and bodies:** eyes, legs, a centipede Run-on, a stamp Misprint. Crimson and violet variants. | **Distinct variants:** crimson gets spikes and horns, violet a crown, a third eye and a wavy hem. |

### Font

| M9 | M10 |
|---|---|
| <img src="m09/menu.png" width="420" alt="M9 menu in the system font"> | <img src="m10/menu.png" width="420" alt="M10 menu in Atkinson Hyperlegible"> |
| System font. | **Atkinson Hyperlegible** everywhere, so `l I 1 \|` and `0 O` look different. |

### First screen

| M2 | M4 | M5 | M8 |
|---|---|---|---|
| <img src="m02/start.png" width="210" alt="M2 start card"> | <img src="m04/start.png" width="210" alt="M4 New notebook with difficulty"> | <img src="m05/start.png" width="210" alt="M5 New notebook showing the keys"> | <img src="m08/start.png" width="210" alt="M8 New notebook with four shortcuts"> |
| "Press Enter to start". | **Difficulty** picker. | Shows **your keys**, with Change keys (K). | Shortcuts pile up: keys, word lists, saves, settings. |

| M9 | M12 | M13 | M14 | Latest |
|---|---|---|---|---|
| <img src="m09/menu.png" width="170" alt="M9 main menu"> | <img src="m12/menu.png" width="170" alt="M12 menu with Apprentice and Practice"> | <img src="m13/menu.png" width="170" alt="M13 menu with Desk and rank"> | <img src="m14/menu.png" width="170" alt="M14 menu with player badge and About"> | <img src="latest/menu.png" width="170" alt="Latest menu"> |
| A real **main menu** with a logo replaces the card. | **Apprentice** and **Practice** replace New notebook and Choose keys. | **Desk** button, and your rank and ink along the bottom. | **Player** badge and **About**. The course is now 27 chapters long. | New tagline, and "Save data" is now **Manage saves**. |

### Type Case (choosing keys)

| M5 | M7 | M10 | Latest |
|---|---|---|---|
| <img src="m05/type-case.png" width="210" alt="M5 Type Case, wooden keyboard"> | <img src="m07/type-case.png" width="210" alt="M7 Type Case with mastery bars"> | <img src="m10/type-case.png" width="210" alt="M10 Type Case in the new font"> | <img src="latest/type-case.png" width="210" alt="Latest Type Case styled as a typewriter"> |
| Wooden keyboard with two-part keys, presets and groups. | **Mastery bars** under each key that fill as you practice. | New font. | **Typewriter:** black enamel, gold pinstripe, round chrome keys. A **My Apprentice keys** preset. |

### End of a page

| M2 | M7 | M12 | M13 | Latest |
|---|---|---|---|---|
| <img src="m02/page-done.png" width="170" alt="M2 page complete card"> | <img src="m07/page-done.png" width="170" alt="M7 graded page with A+"> | <img src="m12/page-done.png" width="170" alt="M12 page with stars"> | <img src="m13/page-done.png" width="170" alt="M13 page with ink and level up"> | <img src="latest/page-done.png" width="170" alt="Latest page complete"> |
| Score, WPM and accuracy. | A **red-pen grade** and a teacher's note. | **Stars** (1 to 3). | **Ink** earned, level-ups and unlocks. | Same card as M13, here without a level-up. |

### Starting a chapter

| M12 | Latest |
|---|---|
| <img src="m12/chapter-intro.png" width="420" alt="M12 chapter card listing 8 home-row keys"> | <img src="latest/chapter-intro.png" width="420" alt="Latest chapter card with hands on a keyboard"> |
| Chapter 1 of 10 teaches the whole home row at once, finger by finger. | Chapter 1 of 27 teaches just `f` and `j`, with a **hands guide**: the finger shaded, the key circled in red pen. |

### Settings and pause

| M7 settings | Latest settings | M9 pause | Latest pause |
|---|---|---|---|
| <img src="m07/settings.png" width="210" alt="M7 settings"> | <img src="latest/settings.png" width="210" alt="Latest settings"> | <img src="m09/pause.png" width="210" alt="M9 pause menu"> | <img src="latest/pause.png" width="210" alt="Latest pause menu"> |
| Text size, colors, motion, sound. | The same options in the new font. | Resume, Restart page, Settings, Quit. | Adds **Practice these keys** (from M14). |

## Milestone by milestone

### M1: Scaffold

<img src="m01/play.png" width="420" alt="M1: one blob crossing a notebook page">

The notebook page, the red margin, the Nib, and one placeholder creature drifting across. Underneath: Vite, TypeScript, PixiJS and a fixed-timestep game loop.

### M2: Core loop

<img src="m02/play.png" width="420" alt="M2 gameplay with letter drips">

**New:** typing. Letter drips stream in, the Nib locks onto the nearest match, misses drain the **ink** bar, and a combo multiplier builds your score. A start card and a "Page complete" card frame each page.

### M3: Word pages

<img src="m03/play.png" width="420" alt="M3 Blotlings with words">

**New:** Blotlings, word-carrying creatures. Words come from a bundled 56,000-word list, filtered to only the keys you're practicing, with a profanity guard. Pages alternate drips and Blotlings.

### M4: Chapters and difficulty

<img src="m04/start.png" width="420" alt="M4 New notebook card with four difficulties">

**New:** Relaxed, Normal, Hard and Expert, and a notebook made of chapters of pages, each a little harder. The footer shows chapter and page.

### M5: Type Case

<img src="m05/type-case.png" width="420" alt="M5 Type Case keyboard">

**New:** pick exactly which keys to practice on a full keyboard. Click the top or bottom half of a key for its Shift or plain character. Presets (Home row, All letters, Code symbols…) and groups (left hand, top row…).

### M6: Saves and offline play

<img src="m06/saves.png" width="420" alt="M6 Save data dialog">

**New:** progress saved in the browser, with backups you can export and import. Works offline as an installable app. First deploy to GitHub Pages.

### M7: Grades, mastery, settings and sound

<img src="m07/page-done.png" width="420" alt="M7 graded page">

**New:** a red-pen grade on every page, mastery bars on the Type Case, a Settings dialog (text size, high contrast and night themes, motion, volume) and sound effects.

### M8: Run-ons, Misprints and word lists

<img src="m08/lineup.png" width="420" alt="M8 lineup with Run-on and Misprint">

**New:** Run-ons (phrases where mistakes stay until you Backspace them) and Misprints (typos you fix with the arrow keys). Tab switches targets. A Word lists dialog can download words about a topic you choose.

<img src="m08/word-lists.png" width="420" alt="M8 Word lists dialog">

### M9: Menus

<img src="m09/menu.png" width="420" alt="M9 main menu">

**Changed:** the start card becomes a **main menu** with a logo. **New:** a difficulty step before a new notebook, a pause menu (Resume, Restart page, Settings, Quit to menu) and How to play.

| New notebook | Pause |
|---|---|
| <img src="m09/new-notebook.png" width="320" alt="M9 new notebook difficulty step"> | <img src="m09/pause.png" width="320" alt="M9 pause menu"> |

### M10: Readability

<img src="m10/menu.png" width="420" alt="M10 menu in Atkinson Hyperlegible">

**Changed:** every bit of text switches to the bundled Atkinson Hyperlegible fonts. Run-ons get shorter and arrive later.

### M11: Creatures

<img src="m11/lineup.png" width="420" alt="M11 creature lineup">

**Changed:** targets become creatures. Drips bob, Blotlings scurry on legs, Run-ons are centipedes, Misprints hop like stamps. Their eyes follow the Nib and they look worried near the margin. **New:** crimson (two words) and violet (three words) variants, and invisible-ink ghosts.

### M12: Apprentice campaign

| Contents | Chapter card |
|---|---|
| <img src="m12/contents.png" width="320" alt="M12 Contents page"> | <img src="m12/chapter-intro.png" width="320" alt="M12 chapter intro"> |

**New:** **Apprentice**, a 10-chapter course that teaches keys in order, with a card per chapter showing which finger types each new key. Pages earn 1–3 stars, and the Contents page shows them. **Practice** is the endless mode with your own keys.

### M13: Rewards

| Desk | Page with ink |
|---|---|
| <img src="m13/desk.png" width="320" alt="M13 Desk with pens, inks and paper"> | <img src="m13/page-done.png" width="320" alt="M13 page complete with ink and level up"> |

**New:** **ink** (experience) from every page, levels and ranks from Scribbler to Master Inkling, and a **Desk** to equip unlocked pens, splatter inks and paper. The Blotter power and the Spill boss arrive too. A playtest round after this rebuilt Apprentice for beginners (27 chapters, starting with `f` and `j`) and added ink shots from the Nib.

### M14: Players and creature looks

| Who's writing? | Desk |
|---|---|
| <img src="m14/players.png" width="320" alt="M14 player picker"> | <img src="m14/desk.png" width="320" alt="M14 Desk with picture tiles"> |

**New:** several players can share one browser, each with their own save. The Desk shows pictures of each pen and ink. Crimson and violet creatures get their own shapes (see the lineup above), and beaten creatures show x x eyes.

### Since M14 (latest)

| Chapter card | Type Case |
|---|---|
| <img src="latest/chapter-intro.png" width="320" alt="Latest chapter card with hands"> | <img src="latest/type-case.png" width="320" alt="Latest Type Case typewriter"> |

**New:** a per-player word filter (Family friendly, Older kids, Grown-ups), Blotlings from chapter 1 using made-up strings like `fjf`, the **hands guide** on chapter cards, and the **typewriter** Type Case. "Save data" became "Manage saves".

## Keeping this up to date

At the end of each milestone, run:

```bash
npm run snapshots -- m15
```

That writes a standard set of shots to `docs/progression/m15/` (menu, desk, players, settings, how-to-play, practice, type-case, lineup, pause, contents, chapter-intro, play, page-done). Then:

1. Run `npm run snapshots -- latest` too, so the "Latest" column matches.
2. Add a section under **Milestone by milestone** with one or two shots and what's **New** or **Changed**.
3. If the milestone visibly changes a screen in **Side by side**, add a column there. If it adds a new screen, add a step to `TOUR` in `scripts/snapshots.ts` so later milestones capture it as well.
4. Commit only the shots the page uses, to keep the repo small.

The script runs the Vite dev server and headless Chrome (set `CHROME_PATH` if Chrome isn't found) and needs Node 22 or later.

# Inkling

> [!NOTE]
> **This project is almost entirely AI-generated ("vibe coded").** Unlike my other repositories, which I wrote by hand, nearly all of Inkling's code and documentation was written by an AI coding assistant (Claude) from my direction, with me setting the goals, reviewing and steering. I built it this way to quickly create a typing-practice game for my kids, something that would otherwise have taken me months on my own. Please read the code with that in mind.

A browser-based, offline-first typing game inspired by *Typer Shark*. Ink-blot creatures crawl across a notebook page carrying words, characters, digits or symbols, and you type them before they reach the margin. What makes it different is that **you choose exactly which keys to practice**, and the game builds all of its content from only those keys, so it grows with you as you learn.

No servers and no analytics. Everything stays on your device (see [PRIVACY.md](PRIVACY.md)), and the game works offline after the first visit.

- Requirements: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- Design: [docs/DESIGN.md](docs/DESIGN.md)

## How to play

Type the character on each ink drip before it reaches the red margin. Each drip that gets through drains your ink well, and the game ends when it runs dry. Correct keys in a row build a score multiplier, up to ×4.

| Key | Action |
|---|---|
| Characters | Hit the matching target closest to the margin |
| Backspace / Delete | Erase mistakes in a Run-on; fix a Misprint |
| ← → / Home / End | Move the cursor in a Misprint |
| Tab | Switch to the next target (nearest the margin first) |
| Esc | Pause: **Resume**, **Restart page**, **Settings** or **Quit to menu** (the game also pauses when the window loses focus) |
| Enter | While playing: fire the **Blotter** (when charged). On a card: begin, turn the page, or retry the chapter after running out of ink |
| R / M | After running out of ink: **Retry chapter** or go to the **Main menu** |

The **main menu** has buttons for everything: **Continue** (C), **New notebook** (N, then pick a difficulty with 1–4 or the arrow keys), **Choose keys** (K), **Word lists** (W), **Settings** (S), **Save data** (B) and **How to play** (H). Use the arrow keys or Tab and Enter, or the mouse.

A notebook is a series of **chapters**, each made of a few **pages**. Each page is either all **drips** (single characters) or all **Blotlings** (words). Pages speed up slightly within a chapter, each chapter is a bit harder than the last, and finishing a chapter tops up your ink. Pick Relaxed, Normal, Hard or Expert when you start a notebook. All of these numbers live in `src/core/config.ts`. 

### Choosing keys

The **Type Case** shows a keyboard where every key has two halves: its plain character below and its Shift character on top. Click a half, or press that key on your real keyboard, to add or remove it. You can also start from a preset (Home row, All letters, Numbers, Code symbols…), toggle whole groups (digits, top row, left hand…), or save your own presets. New players start on the home row (`a s d f g h j k l ;`).

The game builds everything from your keys: drips use them directly, and word pages use real words that only need those letters. Selected capitals and punctuation show up in words too. If too few words fit, made-up strings are mixed in, and the Type Case warns you when that will happen.

### Apprentice and Practice

- **Apprentice** is a typing course for beginners, 27 chapters long.
  - Chapter 1 teaches just `f` and `j`, the keys with bumps. Each later chapter adds **one** key: the rest of the home row (`d k s l a ; g h`), then space, then `e i r u t y o w n m c v b x p q z`.
  - **Pacing:** difficulty climbs a quarter as fast as in Practice. The first 8 chapters are extra gentle, with slower, sparser creatures and shorter pages, easing off as you go.
  - **What appears when:** the first chapters are drips only, then short words, then phrases once space is learned. Tougher variants arrive from chapter 5, and the Spill from chapter 7.
  - **Introductions:** every chapter opens with a card showing its new key and which finger types it. The new key comes up three times as often as the others.
  - **Stars and progress:** each page earns 1–3 stars from its grade. Clearing a chapter opens the next one on the **Contents** page, where you can replay any open chapter. Finishing the last chapter completes the notebook.
- **Practice** uses exactly the keys you choose in the Type Case, with endless chapters.

### Ink, ranks and your desk

- **Ink:** every page you finish earns ink (XP): a tenth of its score, plus 15 per star. Completing the Apprentice notebook adds 250.
- **Ranks:** ink raises your level, and you rise from Scribbler through Doodler, Scribe, Penman, Calligrapher and Illuminator to Master Inkling.
- **Unlocks:** levels unlock things for your **Desk** (D on the main menu): pens (fountain nib, quill, brush, gold nib), splatter ink colors and paper (ruled, graph, parchment).

### Powers and bosses

- **The Blotter:** every 25 correct keys in a row charges it, up to 2 charges, shown as drops by the ink bar. Press **Enter** while playing to blot every creature on the page for half points.
- **The Spill:** from chapter 7, the last page of each Apprentice chapter starts with the Spill, a big, slow boss that needs three words in a row. It costs double ink if it reaches the margin and splits into three small Blotlings when blotted. The Blotter can't touch it.

### Ink shots

Every correct key flicks a drop of ink from your pen at the letter you typed. The pen aims ahead of the moving creature so the drop meets the letter, and a creature you finish stays on the page until the last drop lands. A wrong key still fires, but the drop misses and splats on the page. The locked creature is always drawn in front of any it overlaps.

### Target types

- **Drips:** a single character.
- **Blotlings:** a word.
- **Run-ons** (from chapter 4): a phrase. Mistakes stay, struck through in red, until you erase them with Backspace. They need the space key, so without it those pages become word pages.
- **Misprints** (from chapter 5): a crooked rubber stamp with a misspelled word and the correct spelling pencilled above. Fix it with the arrow keys, Backspace, Delete and typing. Edits that bring it closer to right score, and edits that make it worse count as mistakes.
- **Tougher ink:** some drips and Blotlings come in **crimson**, which need two words (or characters), or **violet**, which need three. Dots above them show how many are left. You can switch to other creatures between words, and they never repeat a word back to back. **Ghosts** in invisible ink hide their text until they're halfway across the page. In Practice they start in chapters 2 and 3; in Apprentice they start later.

### Word lists

Press **W** to download words about a topic (e.g. *ocean*). Inkling asks the free [Datamuse](https://www.datamuse.com/api/) service for related words, sending only your topic. It keeps the clean single words, saves them on your device, and favours the ones your keys can type on word pages. Lists can be switched off or deleted. This is the only feature that uses the network, and only when you ask.

### After each page

Each page is graded in red pen (A+ to F) from your accuracy, dropping a letter if ink reached the margin. The page also circles the keys you missed most, adds a teacher's note, and lists any keys you newly mastered.

### Mastery

In the Type Case, a bar under each key fills as you practice it, and mastered keys get a gold edge. A key is mastered after 50 correct presses at 94% accuracy or better. Once most of your keys are mastered, the Type Case suggests the next two to learn, in the order typing courses usually teach them.

### Settings

- **Text size:** Normal, Large or Larger. The larger sizes use every other line on the page.
- **Colors:** Classic paper, High contrast or Night.
- **Motion:** match your system, reduced, or full.
- **Sound effects:** volume and mute. The sounds are synthesized in the browser, so there are no audio files.

Settings are stored in your browser's localStorage.

### Saving

Your keys, presets, difficulty, best scores, per-key typing stats and notebook progress are saved in your browser (IndexedDB). Progress is saved at the start of each page, so **C** resumes from the page you reached. Drips show the keys you miss most a little more often.

## Development

Requires Node 20+ (CI uses Node 24).

```bash
npm install
npm run dev        # start the dev server
npm run check      # typecheck + lint + tests
npm run build      # production build into dist/
npm run words:build  # regenerate the bundled word pack and blocklist
npm run preview    # serve the production build locally
```

Build for a GitHub Pages project site with `INKLING_BASE=/inkling/ npm run build`.

### Deploying

The game is published to **https://pwbrown.github.io/inkling/** by `.github/workflows/deploy.yml`, which builds and deploys to GitHub Pages on every push to `main`. You can also run it by hand from **Actions → Deploy → Run workflow**. One-time setup: **Settings → Pages → Source: GitHub Actions**. The build is a static site, so any static host works too: serve the `dist/` folder from `npm run build` over HTTPS, with `INKLING_BASE` set to the path it's served from.

The service worker is only registered in production builds. Use `npm run build && npm run preview` to try offline mode locally.

`npm run icons` (or `python3 scripts/make-icons.py`) redraws the app icons.

### Project layout

| Path | What lives there |
|---|---|
| `src/core/` | Pure game logic (loop, world, typing/targeting, stats, tuning config). No DOM or Pixi, so it's unit tested with Vitest. |
| `src/content/` | Word pool, fallback string generator, profanity guard, and per-locale content packs (`en/`). |
| `scripts/` | Build-time tools: the word pack and the app icons. |
| `src/storage/` | Save format and migrations, IndexedDB storage, and progress tracking. |
| `src/ui/` | DOM screens: the main and pause menus, How to play, and the Type Case, Word lists, Save data and Settings dialogs. |
| `src/audio/` | Synthesized sound effects (Web Audio API). |
| `src/input/` | DOM keyboard listener that turns key presses into game actions. |
| `src/i18n/` | UI strings and the `t()` lookup (English only for now). |
| `src/render/` | PixiJS rendering: page, targets, Nib, effects, HUD and overlays. Reads game state, never changes it. |
| `src/main.ts` | Wires the fixed-timestep loop to the renderer. |

## License

Code is [MIT](LICENSE). Bundled third-party content (word list, blocklist) and its licenses are listed in [CREDITS.md](CREDITS.md).

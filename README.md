# Inkling

A browser-based, offline-first typing game inspired by *Typer Shark*. Ink-blot creatures crawl across a notebook page carrying words, characters, digits or symbols, and you type them before they reach the margin. What makes it different is that **you choose exactly which keys to practice**, and the game builds all of its content from only those keys, so it grows with you as you learn.

No servers and no analytics. Everything stays on your device.

- Requirements: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- Design: [docs/DESIGN.md](docs/DESIGN.md)

## How to play

Type the character on each ink drip before it reaches the red margin. Each drip that gets through drains your ink well, and the game ends when it runs dry. Correct keys in a row build a score multiplier, up to ×4.

| Key | Action |
|---|---|
| Characters | Hit the matching target closest to the margin |
| ↑ ↓ or 1–4 | Choose a difficulty on the new-notebook screen (or click one) |
| Enter | Start a notebook, turn the page, or return to the new-notebook screen after running out of ink |
| Esc | Pause or resume (the game also pauses when the window loses focus) |

A notebook is a series of **chapters**, each made of a few **pages**. Each page is either all **drips** (single characters) or all **Blotlings** (words). Pages speed up slightly within a chapter, each chapter is a bit harder than the last, and finishing a chapter tops up your ink. Pick Relaxed, Normal, Hard or Expert when you start a notebook. All of these numbers live in `src/core/config.ts`. Until key selection arrives, you practice the home row: `a s d f g h j k l ;`, so Blotlings carry home-row words like *flask* and *glass*.

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

### Project layout

| Path | What lives there |
|---|---|
| `src/core/` | Pure game logic (loop, world, typing/targeting, stats, tuning config). No DOM or Pixi, so it's unit tested with Vitest. |
| `src/content/` | Word pool, fallback string generator, profanity guard, and per-locale content packs (`en/`). |
| `scripts/` | Build-time tools, such as generating the word pack. |
| `src/input/` | DOM keyboard listener that turns key presses into game actions. |
| `src/i18n/` | UI strings and the `t()` lookup (English only for now). |
| `src/render/` | PixiJS rendering: page, targets, Nib, effects, HUD and overlays. Reads game state, never changes it. |
| `src/main.ts` | Wires the fixed-timestep loop to the renderer. |

## License

Code is [MIT](LICENSE). Bundled third-party content (word list, blocklist) and its licenses are listed in [CREDITS.md](CREDITS.md).

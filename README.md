# Inkling

A browser-based, offline-first typing game inspired by *Typer Shark*. Ink-blot creatures crawl across a notebook page carrying words, characters, digits or symbols, and you type them before they reach the margin. What makes it different is that **you choose exactly which keys to practice**, and the game builds all of its content from only those keys, so it grows with you as you learn.

No servers and no analytics. Everything stays on your device.

- Requirements: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- Design: [docs/DESIGN.md](docs/DESIGN.md)

## Development

Requires Node 20+ (CI uses Node 24).

```bash
npm install
npm run dev        # start the dev server
npm run check      # typecheck + lint + tests
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Build for a GitHub Pages project site with `INKLING_BASE=/inkling/ npm run build`.

### Project layout

| Path | What lives there |
|---|---|
| `src/core/` | Pure game logic (loop, world state). No DOM or Pixi, so it's unit tested with Vitest. |
| `src/render/` | PixiJS rendering. Reads game state, never changes it. |
| `src/main.ts` | Wires the fixed-timestep loop to the renderer. |

## License

Code is [MIT](LICENSE). Asset licenses will be listed in `CREDITS.md` as assets are added.

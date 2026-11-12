// Lets PixiJS run under our strict CSP (no 'unsafe-eval'). REQUIREMENTS §9.
import 'pixi.js/unsafe-eval';
import './style.css';
import { createContentSource } from './content/contentSource';
import { loadEnglishPack } from './content/en';
import { DEFAULT_KEYS } from './core/config';
import { autoPause, confirm, moveSelection, selectDifficulty, togglePause, typeChar } from './core/input';
import { FixedStepLoop } from './core/loop';
import { createWorld, stepWorld, type World } from './core/world';
import { setLocale } from './i18n';
import { bindKeyboard } from './input/keyboard';
import { createRenderer } from './render/renderer';

async function main(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app element missing');

  setLocale(navigator.language);

  // Assigned once the word pack loads; the overlay's click handlers only run after that.
  let world: World | null = null;
  const start = () => {
    if (!world) return;
    confirm(world);
    loop.reset();
  };

  const [pack, renderer] = await Promise.all([
    loadEnglishPack(),
    createRenderer(host, {
      onPick: (difficulty) => world && selectDifficulty(world, difficulty),
      onConfirm: start,
    }),
  ]);
  // The Type Case (milestone 5) will supply the player's keys here.
  const content = createContentSource({ keys: DEFAULT_KEYS, words: pack.words, blocklist: pack.blocklist });
  const game = createWorld({ content });
  world = game;
  const loop = new FixedStepLoop((stepMs) => stepWorld(game, stepMs));

  bindKeyboard(window, {
    onChar: (char) => typeChar(game, char),
    onConfirm: start,
    onNavigate: (delta) => moveSelection(game, delta),
    onPause: () => {
      togglePause(game);
      loop.reset();
    },
  });

  // Pause when the player looks away (REQUIREMENTS §10).
  window.addEventListener('blur', () => autoPause(game));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoPause(game);
    loop.reset();
  });

  renderer.app.ticker.add((ticker) => {
    const alpha = loop.advance(ticker.deltaMS);
    renderer.sync(game, alpha, ticker.deltaMS);
  });

  if (import.meta.env.DEV) {
    // Handy for poking at state from the console during development.
    (window as unknown as { inkling: unknown }).inkling = { world: game, loop, renderer, pack, createContentSource };
  }
}

main().catch((error: unknown) => {
  console.error(error);
});

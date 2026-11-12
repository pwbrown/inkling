// Lets PixiJS run under our strict CSP (no 'unsafe-eval'). REQUIREMENTS §9.
import 'pixi.js/unsafe-eval';
import './style.css';
import { createContentSource } from './content/contentSource';
import { loadEnglishPack } from './content/en';
import { DEFAULT_KEYS } from './core/config';
import { autoPause, confirm, togglePause, typeChar } from './core/input';
import { FixedStepLoop } from './core/loop';
import { createWorld, stepWorld } from './core/world';
import { setLocale } from './i18n';
import { bindKeyboard } from './input/keyboard';
import { createRenderer } from './render/renderer';

async function main(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app element missing');

  setLocale(navigator.language);

  const [pack, renderer] = await Promise.all([loadEnglishPack(), createRenderer(host)]);
  // The Type Case (milestone 5) will supply the player's keys here.
  const content = createContentSource({ keys: DEFAULT_KEYS, words: pack.words, blocklist: pack.blocklist });
  const world = createWorld({ content });
  const loop = new FixedStepLoop((stepMs) => stepWorld(world, stepMs));

  bindKeyboard(window, {
    onChar: (char) => typeChar(world, char),
    onConfirm: () => {
      confirm(world);
      loop.reset();
    },
    onPause: () => {
      togglePause(world);
      loop.reset();
    },
  });

  // Pause when the player looks away (REQUIREMENTS §10).
  window.addEventListener('blur', () => autoPause(world));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoPause(world);
    loop.reset();
  });

  renderer.app.ticker.add((ticker) => {
    const alpha = loop.advance(ticker.deltaMS);
    renderer.sync(world, alpha, ticker.deltaMS);
  });

  if (import.meta.env.DEV) {
    // Handy for poking at state from the console during development.
    (window as unknown as { inkling: unknown }).inkling = { world, loop, renderer, pack, createContentSource };
  }
}

main().catch((error: unknown) => {
  console.error(error);
});

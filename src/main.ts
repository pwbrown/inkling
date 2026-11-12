// Lets PixiJS run under our strict CSP (no 'unsafe-eval'). REQUIREMENTS §9.
import 'pixi.js/unsafe-eval';
import './style.css';
import { FixedStepLoop } from './core/loop';
import { createWorld, stepWorld } from './core/world';
import { createRenderer } from './render/renderer';

async function main(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app element missing');

  const world = createWorld();
  const renderer = await createRenderer(host);
  const loop = new FixedStepLoop((stepMs) => stepWorld(world, stepMs));

  renderer.app.ticker.add((ticker) => {
    const alpha = loop.advance(ticker.deltaMS);
    renderer.sync(world, alpha);
  });

  // Don't let time pile up while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loop.reset();
  });

  if (import.meta.env.DEV) {
    // Handy for poking at state from the console during development.
    (window as unknown as { inkling: unknown }).inkling = { world, loop, renderer };
  }
}

main().catch((error: unknown) => {
  console.error(error);
});

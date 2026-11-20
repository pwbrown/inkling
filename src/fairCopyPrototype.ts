/**
 * PROTOTYPE (M31): Fair Copy on its own, behind the dev-only switch
 * `?fairCopy=passage|30|60` (optional `&theme=night`, `&passage=0..2`).
 * Not reachable from the menu, and nothing is saved.
 */
import { Application, Container } from 'pixi.js';
import { GAME_CONFIG } from './core/config';
import { PASSAGES, backspace, chainPassages, createFairCopy, isFinished, tick, typeKey, type FairCopy } from './core/fairCopy';
import { WORLD_HEIGHT, WORLD_WIDTH } from './core/world';
import { bindKeyboard } from './input/keyboard';
import { FairCopyView } from './render/fairCopyView';
import { COLORS } from './render/theme';

/** A timed test's length in seconds, or null for one passage. */
export type FairCopyMode = number | null;

/** Reads the `?fairCopy=` value: `passage` (or the old `lively`/`plain`), or a timed length. Undefined if it's not a Fair Copy link. */
export function fairCopyMode(value: string | null): FairCopyMode | undefined {
  if (value === 'passage' || value === 'lively' || value === 'plain') return null;
  const seconds = Number(value);
  return (GAME_CONFIG.fairCopy.timedSeconds as readonly number[]).includes(seconds) ? seconds : undefined;
}

/** More text than anyone types in a timed test: 250 WPM for the longest one. */
const timedChars = (seconds: number) => Math.ceil((250 * 5 * seconds) / 60);

export async function runFairCopy(host: HTMLElement, seconds: FairCopyMode, reducedMotion: boolean, firstPassage = 0): Promise<void> {
  const app = new Application();
  await app.init({ background: COLORS.desk, antialias: true, resizeTo: host, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2) });
  app.canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(app.canvas);
  const stage = new Container();
  app.stage.addChild(stage);
  const fit = () => {
    const { width, height } = app.screen;
    const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    stage.scale.set(scale);
    stage.position.set((width - WORLD_WIDTH * scale) / 2, (height - WORLD_HEIGHT * scale) / 2);
  };
  fit();
  app.renderer.on('resize', fit);

  let index = ((firstPassage % PASSAGES.length) + PASSAGES.length) % PASSAGES.length;
  let test!: FairCopy;
  let view!: FairCopyView;
  const begin = (next: number) => {
    index = next % PASSAGES.length;
    const { text, spans } =
      seconds === null ? { text: PASSAGES[index]!.text, spans: [{ passage: PASSAGES[index]!, start: 0 }] } : chainPassages(index, timedChars(seconds));
    test = createFairCopy(text, seconds === null ? null : seconds * 1000);
    view?.root.destroy({ children: true });
    view = new FairCopyView(text, { spans, seconds }, reducedMotion);
    stage.addChild(view.root);
  };
  begin(index);

  bindKeyboard(window, {
    onChar: (char) => view.react(test, typeKey(test, char, performance.now())),
    onConfirm: () => {
      if (isFinished(test)) begin(index + 1);
    },
    // Esc starts this test again.
    onPause: () => begin(index),
    onSpecial: (key) => {
      if (key === 'Backspace') view.react(test, backspace(test, performance.now()));
      return true;
    },
  });

  app.ticker.add((ticker) => {
    const now = performance.now();
    view.react(test, tick(test, now));
    view.sync(test, now, ticker.deltaMS);
  });

  // For screenshots: type `keys` as if at `msPerKey` ("\b" is Backspace), carrying on from the last key.
  (window as unknown as { fairCopy: unknown }).fairCopy = {
    play(keys: string, msPerKey = 220) {
      const chars = [...keys];
      let now = test.lastKeyAt ?? performance.now() - chars.length * msPerKey;
      for (const ch of chars) {
        now += msPerKey * (0.7 + Math.random() * 0.6);
        view.react(test, ch === '\b' ? backspace(test, now) : typeKey(test, ch, now));
      }
    },
    /** Run `ms` of animation now (a hidden preview pane barely ticks). */
    settle(ms = 2000) {
      for (let t = 0; t < ms; t += 50) view.sync(test, performance.now(), 50);
    },
    /** Move the clock on as if `ms` had passed since the first key (for the timed tests). */
    age(ms: number) {
      if (test.startedAt !== null) test.startedAt -= ms;
      if (test.lastKeyAt !== null) test.lastKeyAt -= ms;
    },
    get test() {
      return test;
    },
  };
}

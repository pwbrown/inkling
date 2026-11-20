/**
 * Fair Copy, the typing-speed test (M31), running on the game's own canvas.
 * While a session is open it owns the keyboard: the game's handler is
 * suspended (main.ts) and this one takes over until the player leaves.
 *
 * Rules are in core/fairCopy.ts, drawing in render/fairCopyView.ts. Nothing
 * is saved yet.
 */
import type { Application } from 'pixi.js';
import { Container } from 'pixi.js';
import { GAME_CONFIG } from './core/config';
import { PASSAGES, backspace, chainPassages, createFairCopy, fairCopyResult, isFinished, tick, typeKey, type FairCopy, type FairCopyEvent, type FairCopyResult } from './core/fairCopy';
import { WORLD_HEIGHT, WORLD_WIDTH } from './core/world';
import { formatNumber, t } from './i18n';
import { bindKeyboard } from './input/keyboard';
import { FairCopyView } from './render/fairCopyView';

/** A timed test's length in seconds, or null for one passage. */
export type FairCopyMode = number | null;

/** Reads a `?fairCopy=` value (dev links): `passage`, or a timed length. Undefined if it isn't one. */
export function fairCopyMode(value: string | null): FairCopyMode | undefined {
  if (value === 'passage' || value === 'lively' || value === 'plain') return null;
  const seconds = Number(value);
  return (GAME_CONFIG.fairCopy.timedSeconds as readonly number[]).includes(seconds) ? seconds : undefined;
}

/** More text than anyone types in a timed test: 250 WPM for its length. */
const timedChars = (seconds: number) => Math.ceil((250 * 5 * seconds) / 60);

export interface FairCopyOptions {
  mode: FairCopyMode;
  /** Which passage to start with. */
  passage: number;
  reducedMotion: boolean;
  /** The player left (Esc, or M on the result card). */
  onExit(): void;
  /** A result, for screen readers. */
  announce(text: string): void;
  /** The test ended: its result, for stickers. */
  onFinished?(result: FairCopyResult, seconds: number | null): void;
  /** Sound hooks: a key went down right or wrong, or the test ended. */
  onEvents?(events: readonly FairCopyEvent[]): void;
}

export class FairCopySession {
  private readonly root = new Container();
  private test!: FairCopy;
  private view!: FairCopyView;
  private index: number;
  private readonly unbind: () => void;
  private readonly fit = () => {
    const { width, height } = this.app.screen;
    const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    this.root.scale.set(scale);
    this.root.position.set((width - WORLD_WIDTH * scale) / 2, (height - WORLD_HEIGHT * scale) / 2);
  };

  constructor(
    private readonly app: Application,
    private readonly options: FairCopyOptions,
  ) {
    this.index = ((options.passage % PASSAGES.length) + PASSAGES.length) % PASSAGES.length;
    // On top of the game's scene, which carries on drawing (idle) underneath.
    app.stage.addChild(this.root);
    this.fit();
    app.renderer.on('resize', this.fit);
    this.begin(this.index);

    // Added on the next turn, so the key that opened Fair Copy from the menu isn't typed into it.
    let ready = false;
    setTimeout(() => (ready = true), 0);
    this.unbind = bindKeyboard(
      window,
      {
        onChar: (char) => {
          if (!isFinished(this.test)) return this.react(typeKey(this.test, char, performance.now()));
          // Result card shortcuts, after a moment so typing carried past the end doesn't trigger them.
          if (!this.cardReady()) return;
          const lower = char.toLowerCase();
          if (lower === 'r') this.begin(this.index);
          else if (lower === 'm') this.options.onExit();
        },
        onConfirm: () => {
          if (isFinished(this.test) && this.cardReady()) this.begin(this.index + 1);
        },
        onPause: () => this.options.onExit(),
        onSpecial: (key) => {
          if (key === 'Backspace') this.react(backspace(this.test, performance.now()));
          // Swallow the rest, so arrows and Tab don't scroll or move focus mid-test.
          return true;
        },
      },
      () => !ready,
    );
  }

  /** Call every frame. */
  update(frameMs: number): void {
    const now = performance.now();
    this.react(tick(this.test, now));
    this.view.sync(this.test, now, frameMs);
  }

  destroy(): void {
    this.unbind();
    this.app.renderer.off('resize', this.fit);
    this.root.destroy({ children: true });
  }

  /** Dev helpers for screenshots (main.ts exposes them in development). */
  devHelpers() {
    return {
      /** Type `keys` as if at `msPerKey` ("\b" is Backspace), carrying on from the last key. */
      play: (keys: string, msPerKey = 220) => {
        const chars = [...keys];
        let now = this.test.lastKeyAt ?? performance.now() - chars.length * msPerKey;
        for (const ch of chars) {
          now += msPerKey * (0.7 + Math.random() * 0.6);
          this.react(ch === '\b' ? backspace(this.test, now) : typeKey(this.test, ch, now));
        }
      },
      /** Run `ms` of animation now (a hidden preview pane barely ticks). */
      settle: (ms = 2000) => {
        for (let t = 0; t < ms; t += 50) this.view.sync(this.test, performance.now(), 50);
      },
      /** Move the clock on as if `ms` more had passed. */
      age: (ms: number) => {
        if (this.test.startedAt !== null) this.test.startedAt -= ms;
        if (this.test.lastKeyAt !== null) this.test.lastKeyAt -= ms;
      },
      test: () => this.test,
    };
  }

  private cardReady(): boolean {
    const end = this.test.finishedAt;
    return end !== null && performance.now() - end >= GAME_CONFIG.menu.shortcutDelayMs;
  }

  private begin(next: number): void {
    this.index = next % PASSAGES.length;
    const seconds = this.options.mode;
    const passage = PASSAGES[this.index]!;
    const { text, spans } = seconds === null ? { text: passage.text, spans: [{ passage, start: 0 }] } : chainPassages(this.index, timedChars(seconds));
    this.test = createFairCopy(text, seconds === null ? null : seconds * 1000);
    this.view?.root.destroy({ children: true });
    this.view = new FairCopyView(text, { spans, seconds }, this.options.reducedMotion, {
      onNext: () => this.begin(this.index + 1),
      onAgain: () => this.begin(this.index),
      onMenu: () => this.options.onExit(),
    });
    this.root.addChild(this.view.root);
  }

  private react(events: FairCopyEvent[]): void {
    if (events.length === 0) return;
    this.view.react(this.test, events);
    this.options.onEvents?.(events);
    if (events.includes('finished')) {
      const r = fairCopyResult(this.test, performance.now());
      this.options.onFinished?.(r, this.options.mode);
      this.options.announce(
        t(r.mistakesLeft === 1 ? 'fairCopy.announceOne' : 'fairCopy.announce', {
          wpm: formatNumber(Math.round(r.netWpm)),
          accuracy: formatNumber(Math.round(r.accuracy * 100)),
          left: formatNumber(r.mistakesLeft),
        }),
      );
    }
  }
}

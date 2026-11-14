/**
 * Small motion helpers for the renderer: easing curves, frame-rate-independent
 * smoothing, color blending and a list of one-shot tweens.
 */

export type Ease = (t: number) => number;

export const linear: Ease = (t) => t;
export const outCubic: Ease = (t) => 1 - (1 - t) ** 3;
/** Overshoots a little, then settles: good for things popping in. */
export const outBack: Ease = (t) => {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};
/** Springs past the end and wobbles back. */
export const outElastic: Ease = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 2 ** (-10 * t) * Math.sin(((t * 10 - 0.75) * 2 * Math.PI) / 3) + 1;
};

/** Exponential smoothing that behaves the same at any frame rate. */
export function approach(current: number, goal: number, rate: number, dtMs: number): number {
  return goal + (current - goal) * Math.exp(-rate * (dtMs / 1000));
}

/** Blend two colors: t = 0 gives a, t = 1 gives b. */
export function mix(a: number, b: number, t: number): number {
  const ch = (c: number, shift: number) => (c >> shift) & 0xff;
  const lerp = (shift: number) => Math.round(ch(a, shift) + (ch(b, shift) - ch(a, shift)) * t) << shift;
  return lerp(16) | lerp(8) | lerp(0);
}

/**
 * A "punch": 1 right after it's triggered, easing back to 0 over `durationMs`.
 * Used for scale kicks on the score, the combo label and creatures.
 */
export class Punch {
  private leftMs = 0;
  constructor(private readonly durationMs: number) {}

  hit(): void {
    this.leftMs = this.durationMs;
  }

  /** Advance and return the current strength, 1..0. */
  update(dtMs: number): number {
    this.leftMs = Math.max(0, this.leftMs - dtMs);
    const t = this.leftMs / this.durationMs;
    return t * t;
  }
}

interface Tween {
  elapsedMs: number;
  delayMs: number;
  durationMs: number;
  ease: Ease;
  apply: (value: number) => void;
}

/** One-shot tweens from 0 to 1, each calling `apply` with the eased value. */
export class Tweens {
  private items: Tween[] = [];

  add(durationMs: number, apply: (value: number) => void, ease: Ease = outCubic, delayMs = 0): void {
    apply(ease(0));
    this.items.push({ elapsedMs: 0, delayMs, durationMs, ease, apply });
  }

  update(dtMs: number): void {
    this.items = this.items.filter((tween) => {
      tween.elapsedMs += dtMs;
      const t = Math.min(1, Math.max(0, (tween.elapsedMs - tween.delayMs) / tween.durationMs));
      tween.apply(tween.ease(t));
      return t < 1;
    });
  }

  clear(): void {
    this.items = [];
  }
}

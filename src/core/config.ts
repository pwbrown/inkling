/**
 * Tunable gameplay numbers. All in one place so balancing never means hunting
 * through logic (REQUIREMENTS §4). Milestone 4 replaces `pageParams` with the
 * full campaign/level/wave difficulty model.
 */

/**
 * Default practice keys until the Type Case (key selection) arrives in
 * milestone 5: the home row, the usual first lesson (DESIGN §4).
 */
export const DEFAULT_KEYS: readonly string[] = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'];

/** Placeholder words for Blotlings until the word pool lands in milestone 3. */
export const PLACEHOLDER_WORDS: readonly string[] = ['ink', 'quill', 'page', 'nib', 'blot', 'margin'];

export type TargetKind = 'drip' | 'blotling';

export const GAME_CONFIG = {
  /** Size of the ink reservoir (the player's health). */
  maxInk: 100,
  /** Ink lost when a target of each kind reaches the margin. */
  inkLoss: { drip: 10, blotling: 20 } satisfies Record<TargetKind, number>,
  points: {
    /** Per correct character, before the combo multiplier. */
    perChar: 10,
    /** Bonus for finishing a target, before the combo multiplier. */
    perTarget: 25,
  },
  combo: {
    /** Correct keys in a row needed to raise the multiplier by 1. */
    step: 10,
    maxMultiplier: 4,
  },
  page: {
    /** Targets per page (wave). */
    size: 20,
    /** Time between spawns on page 1. */
    spawnIntervalMs: 1300,
    /** Most targets on screen at once. */
    maxOnScreen: 6,
    /** Base target speed on page 1, in logical px per second. */
    speed: 85,
    /** Each target's speed varies randomly by up to ±this fraction. */
    speedJitter: 0.15,
    /** Per-page increases (a preview of the milestone 4 difficulty curve). */
    speedStep: 0.08,
    intervalStep: 0.07,
  },
  /** A lane can't take a new target until the last one has moved this far in. */
  laneClearancePx: 160,
} as const;

export interface PageParams {
  kind: TargetKind;
  size: number;
  spawnIntervalMs: number;
  maxOnScreen: number;
  speed: number;
}

/** Parameters for page `index` (0-based). */
export function pageParams(index: number): PageParams {
  const p = GAME_CONFIG.page;
  return {
    kind: 'drip',
    size: p.size,
    spawnIntervalMs: p.spawnIntervalMs / (1 + p.intervalStep * index),
    maxOnScreen: p.maxOnScreen,
    speed: p.speed * (1 + p.speedStep * index),
  };
}

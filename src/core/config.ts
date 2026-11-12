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
  /** Base page settings per target type, for page 1 of that type. */
  pages: {
    drip: {
      /** Targets per page (wave). */
      size: 20,
      /** Time between spawns. */
      spawnIntervalMs: 1300,
      /** Most targets on screen at once. */
      maxOnScreen: 6,
      /** Speed in logical px per second. */
      speed: 85,
    },
    blotling: {
      size: 12,
      spawnIntervalMs: 2600,
      maxOnScreen: 4,
      speed: 55,
    },
  } satisfies Record<TargetKind, { size: number; spawnIntervalMs: number; maxOnScreen: number; speed: number }>,
  /** Page types cycle in this order (milestone 4 replaces this with level plans). */
  pageCycle: ['drip', 'blotling'] as TargetKind[],
  /** Each target's speed varies randomly by up to ±this fraction. */
  speedJitter: 0.15,
  /** Per-page increases (a preview of the milestone 4 difficulty curve). */
  speedStep: 0.08,
  intervalStep: 0.07,
  /** Word difficulty (0..1) on the first page, and how much it rises per page. */
  complexityStart: 0.15,
  complexityStep: 0.1,
  /** Empty space to keep behind the last target in a lane before spawning another. */
  laneGapPx: 100,
} as const;

export interface PageParams {
  kind: TargetKind;
  size: number;
  spawnIntervalMs: number;
  maxOnScreen: number;
  speed: number;
  /** Word difficulty, 0 (easiest) to 1 (hardest). */
  complexity: number;
}

/** Parameters for page `index` (0-based). */
export function pageParams(index: number): PageParams {
  const cycle = GAME_CONFIG.pageCycle;
  const kind = cycle[index % cycle.length] ?? 'drip';
  const base = GAME_CONFIG.pages[kind];
  return {
    kind,
    size: base.size,
    spawnIntervalMs: base.spawnIntervalMs / (1 + GAME_CONFIG.intervalStep * index),
    maxOnScreen: base.maxOnScreen,
    speed: base.speed * (1 + GAME_CONFIG.speedStep * index),
    complexity: Math.min(1, GAME_CONFIG.complexityStart + GAME_CONFIG.complexityStep * index),
  };
}

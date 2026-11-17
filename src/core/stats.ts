/** Per-session typing stats and the numbers derived from them. */
export interface Stats {
  /** Correct keystrokes. */
  correct: number;
  /** Wrong keystrokes. */
  errors: number;
  score: number;
  /** Current run of correct keystrokes. */
  combo: number;
  bestCombo: number;
  /** Points lost to wrong keys. */
  penalty: number;
  /**
   * Where the points came from, for the breakdown on the graded page:
   * score = basePoints + comboPoints + bonusPoints − penalty.
   */
  basePoints: number;
  /** Extra from the combo multiplier. */
  comboPoints: number;
  /** Extra from the Highlighter's double points. */
  bonusPoints: number;
  /** Targets destroyed. */
  destroyed: number;
  /** Targets that reached the margin. */
  leaks: number;
  /** Time spent actually playing (not paused or on menus). */
  playMs: number;
  /**
   * How often each character was missed. Only ever stored locally
   * (REQUIREMENTS §9). It feeds weak-key focus and the graded page later.
   */
  missedKeys: Record<string, number>;
  /** How often each character was typed correctly. Local only, like missedKeys. */
  hitKeys: Record<string, number>;
}

export function createStats(): Stats {
  return { correct: 0, errors: 0, score: 0, combo: 0, bestCombo: 0, penalty: 0, basePoints: 0, comboPoints: 0, bonusPoints: 0, destroyed: 0, leaks: 0, playMs: 0, missedKeys: {}, hitKeys: {} };
}

/** Accuracy from 0 to 1. Returns 1 before any keys are pressed. */
export function accuracy(stats: Pick<Stats, 'correct' | 'errors'>): number {
  const total = stats.correct + stats.errors;
  return total === 0 ? 1 : stats.correct / total;
}

/** Words per minute, using the standard 5 characters per word. */
export function wpm(stats: Pick<Stats, 'correct' | 'playMs'>): number {
  if (stats.playMs <= 0) return 0;
  return stats.correct / 5 / (stats.playMs / 60_000);
}

/** The `count` most-missed characters, most missed first. */
export function topMissedKeys(stats: Pick<Stats, 'missedKeys'>, count = 3): string[] {
  return Object.entries(stats.missedKeys)
    .filter(([, misses]) => misses > 0)
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .slice(0, count)
    .map(([key]) => key);
}

/** Add points to `stats`: `per` points, times the combo multiplier, times a bonus factor (the Highlighter). */
export function earnPoints(stats: Stats, per: number, multiplier = 1, factor = 1): void {
  stats.score += per * multiplier * factor;
  stats.basePoints += per;
  stats.comboPoints += per * (multiplier - 1);
  stats.bonusPoints += per * multiplier * (factor - 1);
}

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
  /** Targets destroyed. */
  destroyed: number;
  /** Time spent actually playing (not paused or on menus). */
  playMs: number;
  /**
   * How often each character was missed. Only ever stored locally
   * (REQUIREMENTS §9). It feeds weak-key focus and the graded page later.
   */
  missedKeys: Record<string, number>;
}

export function createStats(): Stats {
  return { correct: 0, errors: 0, score: 0, combo: 0, bestCombo: 0, destroyed: 0, playMs: 0, missedKeys: {} };
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

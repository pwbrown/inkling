/**
 * "Ready for more?" (M29): when a Free Write player is doing really well, the
 * game suggests the Everything keys (numbers and symbols too) or the next
 * difficulty. Only after a whole chapter of top grades, never before chapter
 * 5, and not again for a few chapters after an answer. Pure, so the rules are
 * easy to test; main.ts shows the card and saves the answer.
 * Tuning is in GAME_CONFIG.nudges.
 */
import { DIFFICULTIES, GAME_CONFIG, type Difficulty } from './config';
import type { Grade } from './grade';

export type NudgeKind = 'everything' | 'harder';

/** Per player, in the save (added in version 13). */
export interface NudgeState {
  /** "Don't suggest this again". */
  off: boolean;
  /** Chapters to wait before suggesting again (after an answer). */
  wait: number;
}

export const DEFAULT_NUDGES: NudgeState = { off: false, wait: 0 };

export interface ChapterResult {
  mode: string;
  /** The chapter just finished, 0-based. */
  chapter: number;
  /** Every page of the chapter, in order (a chapter continued part-way has fewer). */
  grades: readonly Grade[];
  pages: number;
  difficulty: Difficulty;
  /** The keys played, and every key the Everything preset has on this layout. */
  keys: readonly string[];
  everything: readonly string[];
}

/** The next difficulty up, or null on Expert. */
export function harderThan(difficulty: Difficulty): Difficulty | null {
  return DIFFICULTIES[DIFFICULTIES.indexOf(difficulty) + 1] ?? null;
}

/** What to suggest after this chapter (empty: nothing). Doesn't look at the wait; see `afterChapter`. */
export function nudgesFor(result: ChapterResult, state: NudgeState): NudgeKind[] {
  const cfg = GAME_CONFIG.nudges;
  if (state.off || state.wait > 0) return [];
  if (result.mode !== 'practice' || result.chapter + 1 < cfg.fromChapter) return [];
  if (result.grades.length < result.pages || !result.grades.every((g) => cfg.grades.includes(g))) return [];
  const have = new Set(result.keys);
  const out: NudgeKind[] = [];
  if (result.everything.some((k) => !have.has(k))) out.push('everything');
  if (harderThan(result.difficulty)) out.push('harder');
  return out;
}

/** A Free Write chapter ended: count down the wait. */
export function afterChapter(state: NudgeState): NudgeState {
  return { ...state, wait: Math.max(0, state.wait - 1) };
}

/** The player answered a suggestion (took it or not): wait a few chapters, or stop for good. */
export function answered(state: NudgeState, never = false): NudgeState {
  return { off: state.off || never, wait: GAME_CONFIG.nudges.waitChapters };
}

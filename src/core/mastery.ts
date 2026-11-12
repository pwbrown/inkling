/**
 * Key mastery: how well the player knows each key, from their saved hit and
 * miss counts (DESIGN §4). Drives the Type Case's ink fill and the
 * Apprentice-style "ready to learn…" suggestions.
 */
import { GAME_CONFIG } from './config';

export interface KeyCounts {
  hits: number;
  misses: number;
}

export type MasteryLevel = 'unfamiliar' | 'practicing' | 'mastered';

const RANK: Record<MasteryLevel, number> = { unfamiliar: 0, practicing: 1, mastered: 2 };

export function keyAccuracy(stat: KeyCounts | undefined): number {
  if (!stat) return 0;
  const total = stat.hits + stat.misses;
  return total === 0 ? 0 : stat.hits / total;
}

export function masteryLevel(stat: KeyCounts | undefined): MasteryLevel {
  const m = GAME_CONFIG.mastery;
  if (!stat || stat.hits < m.practicingHits) return 'unfamiliar';
  return stat.hits >= m.masteredHits && keyAccuracy(stat) >= m.masteredAccuracy ? 'mastered' : 'practicing';
}

/**
 * How full of ink a key's sort is, 0..1. Grows with practice, held back by
 * low accuracy, and only reaches 1 when the key is mastered.
 */
export function masteryProgress(stat: KeyCounts | undefined): number {
  if (!stat) return 0;
  const m = GAME_CONFIG.mastery;
  if (masteryLevel(stat) === 'mastered') return 1;
  const practice = Math.min(1, stat.hits / m.masteredHits);
  const accuracy = Math.min(1, keyAccuracy(stat) / m.masteredAccuracy);
  // Just short of full until it's actually mastered.
  return Math.min(0.95, practice * accuracy);
}

/** Keys whose mastery level went up between two sets of stats. */
export function improvedKeys(
  before: Readonly<Record<string, KeyCounts>>,
  after: Readonly<Record<string, KeyCounts>>,
  level: MasteryLevel = 'mastered',
): string[] {
  return Object.keys(after).filter(
    (key) => masteryLevel(after[key]) === level && RANK[masteryLevel(before[key])] < RANK[level],
  );
}

/**
 * Order letters are usually taught in: home keys, then reaching out a row
 * at a time, common letters first.
 */
export const LESSON_ORDER = 'fjdksla;ghrueiwotyqpvmcnbx,z./' as const;

/**
 * Keys to suggest learning next (DESIGN §4, "Apprentice path"): only once most
 * of the current keys are mastered and none is still unfamiliar.
 */
export function suggestNextKeys(selection: readonly string[], stats: Readonly<Record<string, KeyCounts>>): string[] {
  const m = GAME_CONFIG.mastery;
  if (selection.length === 0) return [];
  const levels = selection.map((key) => masteryLevel(stats[key]));
  if (levels.includes('unfamiliar')) return [];
  const mastered = levels.filter((l) => l === 'mastered').length / levels.length;
  if (mastered < m.suggestWhenMastered) return [];

  const chosen = new Set(selection);
  return [...LESSON_ORDER].filter((key) => !chosen.has(key)).slice(0, m.suggestCount);
}

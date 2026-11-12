/**
 * Bridges the running game and the save: per-key stats, records, and
 * saving/resuming a notebook. Pure functions, so they're easy to test.
 */
import type { Difficulty } from '../core/config';
import type { Stats } from '../core/stats';
import { createPage, isLastPageOfChapter, resetWorld, setPhase, type PageState, type World } from '../core/world';
import type { KeyStat, SaveData, SavedNotebook } from './schema';

/** Add a page's (or notebook's) per-key hits and misses to the saved totals. */
export function mergeKeyStats(save: SaveData, stats: Pick<Stats, 'hitKeys' | 'missedKeys'>): void {
  const stat = (ch: string): KeyStat => (save.keyStats[ch] ??= { hits: 0, misses: 0 });
  for (const [ch, n] of Object.entries(stats.hitKeys)) stat(ch).hits += n;
  for (const [ch, n] of Object.entries(stats.missedKeys)) stat(ch).misses += n;
}

/** Update best score and furthest chapter. Returns true for a new best score. */
export function recordResult(save: SaveData, difficulty: Difficulty, score: number, chapter: number): boolean {
  const { bestScore, furthestChapter } = save.records;
  furthestChapter[difficulty] = Math.max(furthestChapter[difficulty] ?? 0, chapter);
  if (score > (bestScore[difficulty] ?? 0)) {
    bestScore[difficulty] = score;
    return true;
  }
  return false;
}

/** The page after this one: the next page, or the first page of the next chapter. */
export function nextPagePosition(page: PageState): { chapter: number; page: number } {
  return isLastPageOfChapter(page) ? { chapter: page.chapter + 1, page: 0 } : { chapter: page.chapter, page: page.index + 1 };
}

/**
 * Snapshot a notebook so it can be continued from the start of a page.
 * `at` defaults to the current page; pass the next page once one is cleared.
 */
export function snapshotNotebook(
  world: World,
  at: { chapter: number; page: number } = { chapter: world.page.chapter, page: world.page.index },
  now = new Date(),
): SavedNotebook {
  const s = world.stats;
  return {
    difficulty: world.difficulty,
    chapter: at.chapter,
    page: at.page,
    ink: world.ink,
    score: s.score,
    correct: s.correct,
    errors: s.errors,
    destroyed: s.destroyed,
    bestCombo: s.bestCombo,
    playMs: s.playMs,
    savedAt: now.toISOString(),
  };
}

/** Resume a saved notebook at the start of its page. */
export function continueNotebook(world: World, saved: SavedNotebook): void {
  resetWorld(world, saved.difficulty);
  world.page = createPage(saved.difficulty, saved.chapter, saved.page, world.content);
  world.ink = Math.min(world.maxInk, Math.max(1, saved.ink));
  Object.assign(world.stats, {
    score: saved.score,
    correct: saved.correct,
    errors: saved.errors,
    destroyed: saved.destroyed,
    bestCombo: saved.bestCombo,
    playMs: saved.playMs,
  });
  setPhase(world, 'playing');
}

/**
 * How much more often to show each key as a drip: keys you miss more come up
 * more (REQUIREMENTS §6, "weight toward most-missed keys"). A key you've
 * never missed has weight 1; a key you miss half the time gets about 3.
 */
export function keyWeights(keyStats: Readonly<Record<string, KeyStat>>, keys: readonly string[]): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const key of keys) {
    const stat = keyStats[key];
    // The +5 keeps a couple of early misses from swinging things wildly.
    const missRate = stat ? stat.misses / (stat.hits + stat.misses + 5) : 0;
    weights[key] = 1 + 4 * missRate;
  }
  return weights;
}

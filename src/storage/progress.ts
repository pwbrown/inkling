/**
 * Bridges the running game and the save: per-key stats, records, and
 * saving/resuming a notebook. Pure functions, so they're easy to test.
 */
import { APPRENTICE_CHAPTERS, starKey } from '../core/campaign';
import { GAME_CONFIG, type Difficulty } from '../core/config';
import type { Stats } from '../core/stats';
import {
  beginPage,
  createPage,
  isLastPageOfChapter,
  markPageStart,
  resetWorld,
  useApprenticeKeys,
  type PageState,
  type World,
} from '../core/world';
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
  /** Ink and stats to record; defaults to the current ones. */
  from: { ink: number; stats: World['stats'] } = { ink: world.ink, stats: world.stats },
): SavedNotebook {
  const s = from.stats;
  return {
    mode: world.mode,
    difficulty: world.difficulty,
    chapter: at.chapter,
    page: at.page,
    ink: from.ink,
    score: s.score,
    correct: s.correct,
    errors: s.errors,
    destroyed: s.destroyed,
    bestCombo: s.bestCombo,
    playMs: s.playMs,
    charges: world.charges,
    eraser: world.eraser,
    shield: world.shield,
    savedAt: now.toISOString(),
  };
}

/** Resume a saved notebook at the start of its page. */
export function continueNotebook(world: World, saved: SavedNotebook): void {
  resetWorld(world, saved.difficulty);
  world.mode = saved.mode;
  if (saved.mode === 'apprentice') useApprenticeKeys(world, saved.chapter);
  world.page = createPage(saved.difficulty, saved.chapter, saved.page, world.content, saved.mode);
  world.ink = Math.min(world.maxInk, Math.max(1, saved.ink));
  Object.assign(world.stats, {
    score: saved.score,
    correct: saved.correct,
    errors: saved.errors,
    destroyed: saved.destroyed,
    bestCombo: saved.bestCombo,
    playMs: saved.playMs,
  });
  world.charges = Math.min(GAME_CONFIG.abilities.maxCharges, saved.charges);
  world.eraser = saved.eraser && world.abilities.includes('eraser');
  world.shield = saved.shield && world.abilities.includes('blottingPaper');
  markPageStart(world);
  // Mid-chapter, "Retry chapter" goes back to this resume point.
  if (saved.page > 0) world.chapterStart = structuredClone(world.pageStart);
  beginPage(world);
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

/**
 * Record a cleared Apprentice page: keep the best stars for it, and open the
 * next chapter once a chapter's last page is cleared.
 */
export function recordApprenticePage(save: SaveData, chapter: number, page: number, stars: 1 | 2 | 3, lastPage: boolean): void {
  const key = starKey(chapter, page);
  save.apprentice.stars[key] = Math.max(save.apprentice.stars[key] ?? 0, stars);
  if (lastPage) {
    save.apprentice.unlocked = Math.min(APPRENTICE_CHAPTERS, Math.max(save.apprentice.unlocked, chapter + 2));
    if (chapter >= APPRENTICE_CHAPTERS - 1) save.apprentice.completed = true;
  }
}

/**
 * The Apprentice campaign (DESIGN §4): the notebook is a typing course. Each
 * chapter teaches one or two new keys, learned like runes, on top of every
 * key from earlier chapters. Finishing the last chapter completes the
 * notebook. Practice mode keeps the free key choice and endless chapters.
 */
import type { Grade } from './grade';
import { GAME_CONFIG, type PageParams, type TargetKind } from './config';

export type GameMode = 'apprentice' | 'practice';

export interface Lesson {
  /** Keys introduced in this chapter. */
  newKeys: string[];
}

/**
 * The lessons. A beginner starts with just F and J (the keys with bumps),
 * then learns one key per chapter: the rest of the home row, space, then the
 * letters in roughly the order typing courses teach them.
 */
export const LESSONS: readonly Lesson[] = [
  { newKeys: ['f', 'j'] },
  ...[...'dksla;gh', ' ', ...'eirutyownmcvbxpqz'].map((key) => ({ newKeys: [key] })),
];

export const APPRENTICE_CHAPTERS = LESSONS.length;

/** Every key learned by the end of `chapter` (0-based), in teaching order. */
export function apprenticeKeys(chapter: number): string[] {
  return LESSONS.slice(0, Math.min(chapter, LESSONS.length - 1) + 1).flatMap((l) => l.newKeys);
}

/** The keys a chapter introduces. */
export function newKeysFor(chapter: number): string[] {
  return [...(LESSONS[Math.min(chapter, LESSONS.length - 1)]?.newKeys ?? [])];
}

/** First chapter (0-based) where space is known, so phrases are possible. */
const SPACE_CHAPTER = LESSONS.findIndex((l) => l.newKeys.includes(' '));

/**
 * Pages in an Apprentice chapter. Every chapter opens with drips, where the
 * new key comes up often. The first few chapters are all drips; short
 * "words" join once there are enough keys. Pages are only ever drips or
 * Blotlings: Run-ons (once space is learned) and Misprints are sprinkled
 * into Blotling pages instead (GAME_CONFIG.sprinkles).
 */
export function apprenticePlan(chapter: number): TargetKind[] {
  const keys = apprenticeKeys(chapter).length;
  if (keys <= 5) return ['drip', 'drip', 'drip'];
  if (keys <= 8) return ['drip', 'drip', 'blotling'];
  if (chapter < SPACE_CHAPTER + 6) return ['drip', 'blotling', 'drip', 'blotling'];
  return ['drip', 'blotling', 'blotling', 'drip', 'blotling'];
}

/** Chapter (0-based) where space is learned. */
export { SPACE_CHAPTER };

/**
 * Hard and Expert ease in over the first Apprentice chapters: page settings
 * start partway between Normal and the chosen difficulty and reach it by
 * `profileEaseChapters`. `normal` is the same page at Normal difficulty.
 */
export function easeDifficulty(params: PageParams, normal: PageParams, chapter: number): PageParams {
  const a = GAME_CONFIG.apprentice;
  const weight = Math.min(1, a.profileEaseFloor + (1 - a.profileEaseFloor) * (chapter / a.profileEaseChapters));
  if (weight >= 1) return params;
  const mix = (n: number, d: number) => n + (d - n) * weight;
  return {
    ...params,
    speed: mix(normal.speed, params.speed),
    spawnIntervalMs: mix(normal.spawnIntervalMs, params.spawnIntervalMs),
    maxOnScreen: Math.round(mix(normal.maxOnScreen, params.maxOnScreen)),
    complexity: mix(normal.complexity, params.complexity),
    inkLoss: Math.round(mix(normal.inkLoss, params.inkLoss)),
  };
}

/**
 * Apprentice chapters are many and small, so difficulty climbs much more
 * slowly than in Practice: speed, spawn rate, word length and tougher
 * variants follow this "effective" chapter rather than the real one.
 */
export function effectiveChapter(chapter: number): number {
  return Math.floor(chapter * GAME_CONFIG.apprentice.pace);
}

/**
 * Extra-gentle settings for a beginner's first chapters: slower, sparser,
 * shorter pages, easing off over the first `easeChapters` chapters.
 */
export function easeForBeginners(params: PageParams, chapter: number): PageParams {
  const a = GAME_CONFIG.apprentice;
  const ease = Math.max(0, 1 - chapter / a.easeChapters);
  if (ease === 0) return params;
  return {
    ...params,
    speed: params.speed * (1 - a.easeSpeed * ease),
    spawnIntervalMs: params.spawnIntervalMs * (1 + a.easeInterval * ease),
    maxOnScreen: Math.max(1, params.maxOnScreen - Math.round(a.easeOnScreen * ease)),
    size: Math.max(6, Math.round(params.size * (1 - a.easeSize * ease))),
  };
}

/** Whether a chapter's last page brings the Spill (not for beginners). */
export function hasSpill(chapter: number): boolean {
  return chapter >= GAME_CONFIG.boss.fromApprenticeChapter;
}

/** How much more often a chapter's new keys appear than the others. */
export const NEW_KEY_WEIGHT = 3;

/** Stars for a page grade: A+ or A earn 3, B or C earn 2, anything else 1. */
export function starsForGrade(grade: Grade): 1 | 2 | 3 {
  return grade === 'A+' || grade === 'A' ? 3 : grade === 'B' || grade === 'C' ? 2 : 1;
}

/** Key used to store a page's best stars. */
export function starKey(chapter: number, page: number): string {
  return `${chapter}-${page}`;
}

/** Stars earned in a chapter and the most possible. */
export function chapterStars(stars: Readonly<Record<string, number>>, chapter: number): { earned: number; max: number } {
  const pages = apprenticePlan(chapter).length;
  let earned = 0;
  for (let page = 0; page < pages; page++) earned += stars[starKey(chapter, page)] ?? 0;
  return { earned, max: pages * 3 };
}

/** Stars earned across the whole notebook and the most possible. */
export function totalStars(stars: Readonly<Record<string, number>>): { earned: number; max: number } {
  let earned = 0;
  let max = 0;
  for (let c = 0; c < APPRENTICE_CHAPTERS; c++) {
    const s = chapterStars(stars, c);
    earned += s.earned;
    max += s.max;
  }
  return { earned, max };
}

/** Stars as text, e.g. ★★☆ for 2 of 3. */
export function starText(earned: number, max = 3): string {
  return '★'.repeat(earned) + '☆'.repeat(Math.max(0, max - earned));
}

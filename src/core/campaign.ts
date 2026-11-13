/**
 * The Apprentice campaign (DESIGN §4): the notebook is a typing course. Each
 * chapter teaches one or two new keys, learned like runes, on top of every
 * key from earlier chapters. Finishing the last chapter completes the
 * notebook. Practice mode keeps the free key choice and endless chapters.
 */
import type { Grade } from './grade';
import type { TargetKind } from './config';

export type GameMode = 'apprentice' | 'practice';

export interface Lesson {
  /** Keys introduced in this chapter. */
  newKeys: string[];
}

/**
 * The lessons, in the order typing courses usually teach them: home keys,
 * then reaching out one row at a time, common letters first. Space arrives
 * with chapter 3 so Run-ons (phrases) become possible.
 */
export const LESSONS: readonly Lesson[] = [
  { newKeys: [...'fjdksla;'] },
  { newKeys: ['g', 'h'] },
  { newKeys: ['r', 'u', ' '] },
  { newKeys: ['e', 'i'] },
  { newKeys: ['w', 'o'] },
  { newKeys: ['t', 'y'] },
  { newKeys: ['q', 'p'] },
  { newKeys: ['v', 'm'] },
  { newKeys: ['c', 'n'] },
  { newKeys: ['b', 'x', 'z'] },
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

/**
 * Pages in an Apprentice chapter. Each opens with drips, where the new keys
 * come up often, before using them in words; Run-ons arrive once space is
 * learned and Misprints a little after.
 */
export function apprenticePlan(chapter: number): TargetKind[] {
  if (chapter === 0) return ['drip', 'drip', 'blotling'];
  if (chapter < 3) return ['drip', 'blotling', 'drip', 'blotling'];
  if (chapter < 5) return ['drip', 'blotling', 'runon', 'blotling'];
  return ['drip', 'blotling', 'misprint', 'runon', 'blotling'];
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

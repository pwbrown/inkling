/**
 * The graded page (DESIGN §6): a teacher's red-pen grade and a margin note
 * for the summary after each page.
 */
import { GAME_CONFIG } from './config';
import { accuracy, topMissedKeys, type Stats } from './stats';

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

const ORDER: Grade[] = ['A+', 'A', 'B', 'C', 'D', 'F'];

/**
 * Grade from accuracy, then one letter lower for any leak and another if more
 * than a quarter of the page got through. A+ means near-perfect with no leaks.
 */
export function pageGrade(stats: Pick<Stats, 'correct' | 'errors' | 'leaks'>, pageSize: number): Grade {
  const acc = accuracy(stats);
  if (stats.leaks === 0 && acc >= 0.98 && stats.correct > 0) return 'A+';
  const base = GAME_CONFIG.grades.find((g) => acc >= g.minAccuracy)?.grade ?? 'F';
  let index = ORDER.indexOf(base as Grade);
  if (stats.leaks > 0) index++;
  if (pageSize > 0 && stats.leaks / pageSize > 0.25) index++;
  return ORDER[Math.min(index, ORDER.length - 1)]!;
}

export type NoteKind = 'perfect' | 'watchKey' | 'leaks' | 'good';

/** Which teacher's note to write, and the key to mention if any. */
export function teacherNote(stats: Stats, grade: Grade): { kind: NoteKind; key?: string } {
  if (grade === 'A+') return { kind: 'perfect' };
  const [worst] = topMissedKeys(stats, 1);
  if (worst !== undefined && (stats.missedKeys[worst] ?? 0) >= 2) return { kind: 'watchKey', key: worst };
  if (stats.leaks > 0) return { kind: 'leaks' };
  return { kind: 'good' };
}

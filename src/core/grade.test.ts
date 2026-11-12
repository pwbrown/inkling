import { describe, expect, it } from 'vitest';
import { pageGrade, teacherNote } from './grade';
import { createStats } from './stats';

const stats = (correct: number, errors: number, leaks = 0) => ({ ...createStats(), correct, errors, leaks });

describe('pageGrade', () => {
  it('grades by accuracy', () => {
    expect(pageGrade(stats(100, 0), 20)).toBe('A+');
    expect(pageGrade(stats(96, 4), 20)).toBe('A');
    expect(pageGrade(stats(91, 9), 20)).toBe('B');
    expect(pageGrade(stats(85, 15), 20)).toBe('C');
    expect(pageGrade(stats(72, 28), 20)).toBe('D');
    expect(pageGrade(stats(50, 50), 20)).toBe('F');
  });

  it('drops a letter for any leak, and another when many get through', () => {
    expect(pageGrade(stats(100, 0, 1), 20)).toBe('B');
    expect(pageGrade(stats(100, 0, 6), 20)).toBe('C');
    expect(pageGrade(stats(50, 50, 10), 20)).toBe('F');
  });

  it('does not give an A+ for a page with no typing', () => {
    expect(pageGrade(stats(0, 0, 0), 20)).not.toBe('A+');
  });
});

describe('teacherNote', () => {
  it('praises a perfect page', () => {
    expect(teacherNote(stats(100, 0), 'A+')).toEqual({ kind: 'perfect' });
  });

  it('names a key missed more than once', () => {
    const s = { ...stats(90, 3), missedKeys: { j: 2, k: 1 } };
    expect(teacherNote(s, 'A')).toEqual({ kind: 'watchKey', key: 'j' });
  });

  it('mentions leaks, or else says well done', () => {
    expect(teacherNote(stats(100, 0, 2), 'B')).toEqual({ kind: 'leaks' });
    expect(teacherNote({ ...stats(97, 1), missedKeys: { a: 1 } }, 'A')).toEqual({ kind: 'good' });
  });
});

import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from './config';
import { DEFAULT_NUDGES, afterChapter, answered, harderThan, nudgesFor, type ChapterResult } from './nudges';

const letters = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', ' '];
const everything = [...letters, ...'1234567890!@#'];
const result = (over: Partial<ChapterResult> = {}): ChapterResult => ({
  mode: 'practice',
  chapter: GAME_CONFIG.nudges.fromChapter - 1,
  grades: ['A', 'A+', 'A', 'A'],
  pages: 4,
  difficulty: 'normal',
  keys: letters,
  everything,
  ...over,
});

describe('ready for more? (nudges)', () => {
  it('offers more keys and a harder difficulty after a whole chapter of top grades', () => {
    expect(nudgesFor(result(), DEFAULT_NUDGES)).toEqual(['everything', 'harder']);
  });

  it('waits until chapter 5', () => {
    expect(nudgesFor(result({ chapter: 3 }), DEFAULT_NUDGES)).toEqual([]);
    expect(nudgesFor(result({ chapter: 4 }), DEFAULT_NUDGES)).not.toEqual([]);
  });

  it('needs every page of the chapter at A or better', () => {
    expect(nudgesFor(result({ grades: ['A', 'B', 'A+', 'A'] }), DEFAULT_NUDGES)).toEqual([]);
    expect(nudgesFor(result({ grades: ['A', 'A'] }), DEFAULT_NUDGES)).toEqual([]);
  });

  it('is only for Free Write', () => {
    expect(nudgesFor(result({ mode: 'apprentice' }), DEFAULT_NUDGES)).toEqual([]);
    expect(nudgesFor(result({ mode: 'daily' }), DEFAULT_NUDGES)).toEqual([]);
  });

  it('only offers what is left', () => {
    expect(nudgesFor(result({ keys: everything }), DEFAULT_NUDGES)).toEqual(['harder']);
    expect(nudgesFor(result({ difficulty: 'expert' }), DEFAULT_NUDGES)).toEqual(['everything']);
    expect(nudgesFor(result({ keys: everything, difficulty: 'expert' }), DEFAULT_NUDGES)).toEqual([]);
  });

  it('waits a few chapters after an answer, and stops when asked', () => {
    let state = answered(DEFAULT_NUDGES);
    for (let i = 0; i < GAME_CONFIG.nudges.waitChapters; i++) {
      expect(nudgesFor(result(), state)).toEqual([]);
      state = afterChapter(state);
    }
    expect(nudgesFor(result(), state)).not.toEqual([]);
    expect(nudgesFor(result(), answered(DEFAULT_NUDGES, true))).toEqual([]);
    expect(nudgesFor(result(), afterChapter(afterChapter(afterChapter(afterChapter(answered(DEFAULT_NUDGES, true))))))).toEqual([]);
  });

  it('knows the next difficulty', () => {
    expect(harderThan('relaxed')).toBe('normal');
    expect(harderThan('hard')).toBe('expert');
    expect(harderThan('expert')).toBeNull();
  });
});

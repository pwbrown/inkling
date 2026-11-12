import { describe, expect, it } from 'vitest';
import { accuracy, topMissedKeys, wpm } from './stats';

describe('stats', () => {
  it('accuracy is 100% before any keystrokes', () => {
    expect(accuracy({ correct: 0, errors: 0 })).toBe(1);
  });

  it('accuracy is correct over total', () => {
    expect(accuracy({ correct: 9, errors: 1 })).toBeCloseTo(0.9);
  });

  it('wpm uses five characters per word', () => {
    expect(wpm({ correct: 50, playMs: 60_000 })).toBeCloseTo(10);
    expect(wpm({ correct: 50, playMs: 0 })).toBe(0);
  });

  it('lists the most-missed keys first, ties alphabetically', () => {
    expect(topMissedKeys({ missedKeys: { a: 1, k: 3, d: 3, f: 0 } }, 3)).toEqual(['d', 'k', 'a']);
  });
});

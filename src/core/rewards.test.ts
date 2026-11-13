import { describe, expect, it } from 'vitest';
import { RANKS, UNLOCKS, inkForLevel, inkForPage, isUnlocked, levelForInk, levelProgress, newUnlocks, rankForLevel } from './rewards';

describe('levels', () => {
  it('start at level 1 and need more ink each level', () => {
    expect(inkForLevel(1)).toBe(0);
    expect(inkForLevel(2)).toBe(200);
    expect(inkForLevel(3)).toBe(600);
    expect(inkForLevel(4) - inkForLevel(3)).toBeGreaterThan(inkForLevel(3) - inkForLevel(2));
    expect(levelForInk(0)).toBe(1);
    expect(levelForInk(199)).toBe(1);
    expect(levelForInk(200)).toBe(2);
    expect(levelForInk(10000)).toBeGreaterThan(9);
  });

  it('report progress within a level', () => {
    expect(levelProgress(300)).toEqual({ level: 2, into: 100, needed: 400 });
  });

  it('earn ink from score and stars', () => {
    expect(inkForPage(940)).toBe(94);
    expect(inkForPage(940, 3)).toBe(139);
    expect(inkForPage(-5)).toBe(0);
  });
});

describe('ranks and unlocks', () => {
  it('rank up with level', () => {
    expect(rankForLevel(1)).toBe('scribbler');
    expect(rankForLevel(5)).toBe('scribe');
    expect(rankForLevel(99)).toBe('master');
    expect(RANKS[0]?.from).toBe(1);
  });

  it('start with one of each cosmetic unlocked', () => {
    for (const slot of Object.keys(UNLOCKS) as (keyof typeof UNLOCKS)[]) {
      expect(Object.values(UNLOCKS[slot])).toContain(1);
    }
    expect(isUnlocked('nib', 'classic', 1)).toBe(true);
    expect(isUnlocked('nib', 'gold', 13)).toBe(false);
  });

  it('spread unlocks out: never more than one per level, and none for most levels', () => {
    const levels = Object.values(UNLOCKS).flatMap((items) => Object.values(items)).filter((l) => l > 1);
    expect(new Set(levels).size).toBe(levels.length);
    expect(Math.max(...levels)).toBeGreaterThanOrEqual(14);
  });

  it('list what a level-up unlocks', () => {
    expect(newUnlocks(1, 4)).toEqual([
      { slot: 'nib', item: 'quill' },
      { slot: 'splatter', item: 'crimson' },
    ]);
    expect(newUnlocks(5, 5)).toEqual([]);
    expect(newUnlocks(2, 3)).toEqual([]);
  });
});

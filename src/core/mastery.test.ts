import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from './config';
import { LESSON_ORDER, improvedKeys, masteryLevel, masteryProgress, suggestNextKeys } from './mastery';

const m = GAME_CONFIG.mastery;
const mastered = { hits: m.masteredHits, misses: 0 };
const practicing = { hits: m.practicingHits, misses: 0 };

describe('masteryLevel', () => {
  it('starts unfamiliar, then practicing, then mastered', () => {
    expect(masteryLevel(undefined)).toBe('unfamiliar');
    expect(masteryLevel({ hits: m.practicingHits - 1, misses: 0 })).toBe('unfamiliar');
    expect(masteryLevel(practicing)).toBe('practicing');
    expect(masteryLevel(mastered)).toBe('mastered');
  });

  it('needs good accuracy to count as mastered', () => {
    expect(masteryLevel({ hits: 200, misses: 40 })).toBe('practicing');
  });
});

describe('masteryProgress', () => {
  it('fills with practice, capped below full until mastered', () => {
    expect(masteryProgress(undefined)).toBe(0);
    const half = masteryProgress({ hits: m.masteredHits / 2, misses: 0 });
    expect(half).toBeGreaterThan(0.4);
    expect(half).toBeLessThan(0.6);
    expect(masteryProgress({ hits: 500, misses: 100 })).toBeLessThan(1);
    expect(masteryProgress(mastered)).toBe(1);
  });
});

describe('improvedKeys', () => {
  it('lists keys that just reached mastery', () => {
    const before = { a: { hits: m.masteredHits - 1, misses: 0 }, s: mastered };
    const after = { a: mastered, s: mastered, d: practicing };
    expect(improvedKeys(before, after)).toEqual(['a']);
    expect(improvedKeys(before, after, 'practicing')).toEqual(['d']);
  });
});

describe('suggestNextKeys', () => {
  const home = [...'asdfghjkl;'];
  const allMastered = Object.fromEntries(home.map((k) => [k, mastered]));

  it('suggests the next keys in lesson order once the current ones are mastered', () => {
    const next = suggestNextKeys(home, allMastered);
    expect(next).toEqual([...'ru']);
    expect(next.every((k) => LESSON_ORDER.includes(k))).toBe(true);
  });

  it('waits while any key is still unfamiliar or too few are mastered', () => {
    expect(suggestNextKeys(home, { ...allMastered, a: { hits: 1, misses: 0 } })).toEqual([]);
    const someMastered = Object.fromEntries(home.map((k, i) => [k, i < 5 ? mastered : practicing]));
    expect(suggestNextKeys(home, someMastered)).toEqual([]);
  });

  it('suggests nothing when every lesson key is already selected', () => {
    const everything = [...LESSON_ORDER];
    const stats = Object.fromEntries(everything.map((k) => [k, mastered]));
    expect(suggestNextKeys(everything, stats)).toEqual([]);
  });
});

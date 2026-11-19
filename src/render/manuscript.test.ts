import { describe, expect, it } from 'vitest';
import { MARGIN_X, WORLD_WIDTH } from '../core/world';
import { blotSpot, buildManuscript, revealWords, totalLength } from './manuscript';

const baselines = [120, 168, 216, 264];

describe('manuscript', () => {
  it('is the same for the same seed and different for another', () => {
    expect(buildManuscript(7, { baselines })).toEqual(buildManuscript(7, { baselines }));
    expect(buildManuscript(8, { baselines })).not.toEqual(buildManuscript(7, { baselines }));
  });

  it('stays between the margin and the right edge, near its lines', () => {
    const words = buildManuscript(3, { baselines });
    expect(words.length).toBeGreaterThan(10);
    for (const word of words) {
      for (let i = 0; i < word.points.length; i += 2) {
        expect(word.points[i]).toBeGreaterThan(MARGIN_X);
        expect(word.points[i]).toBeLessThan(WORLD_WIDTH);
        const y = word.points[i + 1]!;
        expect(baselines.some((b) => y > b - 30 && y < b + 12)).toBe(true);
      }
    }
  });

  it('reveals nothing at 0, everything at 1, and more as it goes', () => {
    const words = buildManuscript(1, { baselines });
    const total = totalLength(words);
    expect(revealWords(words, 0)).toEqual([]);
    expect(totalLength(revealWords(words, 1))).toBeCloseTo(total);
    let last = 0;
    for (const f of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const shown = totalLength(revealWords(words, f));
      expect(shown).toBeCloseTo(total * f, 3);
      expect(shown).toBeGreaterThan(last);
      last = shown;
    }
  });

  it('drops a blot within the writing on its line, or near the start of an empty line', () => {
    const words = revealWords(buildManuscript(5, { baselines }), 0.4);
    const onFirst = words.filter((w) => w.line === 0).flatMap((w) => w.points.filter((_, i) => i % 2 === 0));
    for (const roll of [0, 0.5, 0.999]) {
      const x = blotSpot(words, 0, 100, () => roll);
      expect(x).toBeGreaterThanOrEqual(Math.min(...onFirst));
      expect(x).toBeLessThanOrEqual(Math.max(...onFirst));
    }
    // The last line has nothing written yet at 40%.
    expect(words.some((w) => w.line === 3)).toBe(false);
    expect(blotSpot(words, 3, 100, () => 0)).toBe(100);
    expect(blotSpot(words, 3, 100, () => 0.999)).toBeLessThan(100 + 120);
  });
});

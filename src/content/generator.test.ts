import { describe, expect, it } from 'vitest';
import { Blocklist } from './blocklist';
import { generateString, generatedLength } from './generator';

/** Small seeded PRNG (mulberry32) for repeatable "random" tests. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const none = new Blocklist([]);

describe('generator', () => {
  it('grows string length with difficulty', () => {
    expect(generatedLength(0, () => 0)).toBe(2);
    expect(generatedLength(1, () => 0)).toBe(6);
  });

  it('only uses the given keys', () => {
    const random = seeded(1);
    for (let i = 0; i < 200; i++) {
      const text = generateString(['1', '2', '3', '#'], 0.5, random, none);
      expect([...text].every((ch) => '123#'.includes(ch))).toBe(true);
    }
  });

  it('never makes triple letters', () => {
    const random = seeded(2);
    for (let i = 0; i < 200; i++) expect(generateString(['a', 'b'], 1, random, none)).not.toMatch(/(.)\1\1/);
  });

  it('never returns a blocked string', () => {
    const blocklist = new Blocklist(['dad', 'sad']);
    const random = seeded(3);
    for (let i = 0; i < 500; i++) {
      const text = generateString(['a', 's', 'd'], 0.6, random, blocklist);
      expect(blocklist.blocksString(text)).toBe(false);
    }
  });

  it('handles a single key', () => {
    expect(generateString(['k'], 1, () => 0, none)).toBe('kkk');
  });
});

import { describe, expect, it } from 'vitest';
import { hashSeed, mulberry32, seeded } from './rng';

const take = (random: () => number, n: number) => Array.from({ length: n }, random);

describe('rng', () => {
  it('repeats the same sequence for the same seed', () => {
    expect(take(mulberry32(42), 5)).toEqual(take(mulberry32(42), 5));
    expect(take(mulberry32(42), 5)).not.toEqual(take(mulberry32(43), 5));
  });

  it('stays in [0, 1)', () => {
    for (const x of take(mulberry32(7), 1000)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('hashes strings stably', () => {
    expect(hashSeed('daily:1:us-qwerty')).toBe(hashSeed('daily:1:us-qwerty'));
    expect(hashSeed('a')).not.toBe(hashSeed('b'));
  });

  it('gives each salt its own stream', () => {
    expect(take(seeded(1, 'spawn', 0), 3)).toEqual(take(seeded(1, 'spawn', 0), 3));
    expect(take(seeded(1, 'spawn', 0), 3)).not.toEqual(take(seeded(1, 'spawn', 1), 3));
  });
});

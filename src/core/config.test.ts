import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, pageParams } from './config';

describe('pageParams', () => {
  it('cycles page types', () => {
    expect(pageParams(0).kind).toBe('drip');
    expect(pageParams(1).kind).toBe('blotling');
    expect(pageParams(2).kind).toBe('drip');
  });

  it('gets faster, busier and wordier page by page', () => {
    const first = pageParams(0);
    const later = pageParams(2);
    expect(later.kind).toBe(first.kind);
    expect(later.speed).toBeGreaterThan(first.speed);
    expect(later.spawnIntervalMs).toBeLessThan(first.spawnIntervalMs);
    expect(later.complexity).toBeGreaterThan(first.complexity);
  });

  it('caps word complexity at 1', () => {
    expect(pageParams(1000).complexity).toBe(1);
  });

  it('uses the per-type base settings', () => {
    expect(pageParams(1).size).toBe(GAME_CONFIG.pages.blotling.size);
  });
});

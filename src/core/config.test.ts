import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, GAME_CONFIG, TARGET_KINDS, chapterPlan, pageParams } from './config';

describe('chapterPlan', () => {
  it('uses the configured chapters, then repeats the last one', () => {
    const last = GAME_CONFIG.chapters.at(-1);
    expect(chapterPlan(0)).toEqual(GAME_CONFIG.chapters[0]);
    expect(chapterPlan(99)).toEqual(last);
  });
});

describe('pageParams', () => {
  it('takes the page type from the chapter plan', () => {
    const plan = chapterPlan(0);
    plan.forEach((kind, page) => expect(pageParams('normal', 0, page).kind).toBe(kind));
  });

  it('starts at the base settings on Normal, chapter 1, page 1', () => {
    const kind = chapterPlan(0)[0]!;
    const base = GAME_CONFIG.base[kind];
    const p = pageParams('normal', 0, 0);
    expect(p.speed).toBe(base.speed);
    expect(p.spawnIntervalMs).toBe(base.spawnIntervalMs);
    expect(p.maxOnScreen).toBe(base.maxOnScreen);
    expect(p.size).toBe(base.size);
    expect(p.inkLoss).toBe(base.inkLoss);
  });

  it('gets slightly harder page by page within a chapter', () => {
    // Pages 0 and 1 of chapter 1 are both drips.
    const a = pageParams('normal', 0, 0);
    const b = pageParams('normal', 0, 1);
    expect(b.kind).toBe(a.kind);
    expect(b.speed).toBeGreaterThan(a.speed);
    expect(b.spawnIntervalMs).toBeLessThan(a.spawnIntervalMs);
    expect(b.complexity).toBeGreaterThan(a.complexity);
    // "Slightly": a page step is smaller than a chapter step.
    expect(b.speed / a.speed).toBeLessThan(pageParams('normal', 1, 0).speed / a.speed);
  });

  it('gets harder chapter by chapter', () => {
    // Both are the first page of their chapter, and both drips.
    const a = pageParams('normal', 0, 0);
    const b = pageParams('normal', 1, 0);
    expect(b.kind).toBe(a.kind);
    expect(b.speed).toBeGreaterThan(a.speed);
    expect(b.size).toBeGreaterThan(a.size);
    expect(b.complexity).toBeGreaterThan(a.complexity);
  });

  it('orders difficulties from easiest to hardest', () => {
    const params = DIFFICULTIES.map((d) => pageParams(d, 0, 0));
    for (let i = 1; i < params.length; i++) {
      const [easier, harder] = [params[i - 1]!, params[i]!];
      expect(harder.speed).toBeGreaterThan(easier.speed);
      expect(harder.spawnIntervalMs).toBeLessThan(easier.spawnIntervalMs);
      expect(harder.inkLoss).toBeGreaterThan(easier.inkLoss);
      expect(harder.maxOnScreen).toBeGreaterThanOrEqual(easier.maxOnScreen);
      expect(harder.complexity).toBeGreaterThanOrEqual(easier.complexity);
    }
  });

  it('respects the limits deep into a hard campaign', () => {
    for (const kind of TARGET_KINDS) {
      const limits = GAME_CONFIG.limits[kind];
      for (let chapter = 0; chapter < 60; chapter++) {
        for (let page = 0; page < chapterPlan(chapter).length; page++) {
          const p = pageParams('expert', chapter, page);
          if (p.kind !== kind) continue;
          expect(p.speed).toBeLessThanOrEqual(limits.maxSpeed);
          expect(p.spawnIntervalMs).toBeGreaterThanOrEqual(limits.minSpawnIntervalMs);
          expect(p.maxOnScreen).toBeLessThanOrEqual(limits.maxOnScreen);
          expect(p.size).toBeLessThanOrEqual(limits.maxSize);
          expect(p.complexity).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('swaps in a Blotling page when the keys cannot make the planned type', () => {
    const runonPage = chapterPlan(2).indexOf('runon');
    expect(pageParams('normal', 2, runonPage).kind).toBe('runon');
    expect(pageParams('normal', 2, runonPage, (k) => k !== 'runon').kind).toBe('blotling');
  });

  it('introduces Run-ons and Misprints in later chapters only', () => {
    expect(chapterPlan(0)).not.toContain('runon');
    expect(chapterPlan(1)).not.toContain('misprint');
    expect(chapterPlan(3)).toEqual(expect.arrayContaining(['runon', 'misprint']));
  });

  it('keeps Relaxed playable: at least one target on screen and complexity ≥ 0', () => {
    const p = pageParams('relaxed', 0, 0);
    expect(p.maxOnScreen).toBeGreaterThanOrEqual(1);
    expect(p.complexity).toBeGreaterThanOrEqual(0);
  });
});

import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, GAME_CONFIG, TARGET_KINDS, chapterPlan, pageParams, sprinkleChances } from './config';

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
    plan.forEach((kind, page) => expect(pageParams('normal', 0, page).kind).toBe(kind === 'symbols' ? 'drip' : kind));
  });

  it('keeps letters and symbols on separate drip pages', () => {
    expect(pageParams('normal', 0, 0, () => true, ['drip']).pool).toBe('letters');
    const symbols = pageParams('normal', 0, 0, () => true, ['symbols']);
    expect(symbols).toMatchObject({ kind: 'drip', pool: 'symbols' });
    expect(pageParams('normal', 0, 0, () => true, ['blotling']).pool).toBe('all');
  });

  it('starts at the base settings on Normal, chapter 1, page 1', () => {
    const kind = chapterPlan(0)[0]!;
    const base = GAME_CONFIG.base[kind === 'symbols' ? 'drip' : kind];
    const p = pageParams('normal', 0, 0);
    expect(p.speed).toBe(base.speed);
    expect(p.spawnIntervalMs).toBe(base.spawnIntervalMs);
    expect(p.maxOnScreen).toBe(base.maxOnScreen);
    expect(p.size).toBe(base.size);
    expect(p.inkLoss).toBe(base.inkLoss);
  });

  it('gets slightly harder page by page within a chapter', () => {
    // Two drip pages in a row.
    const drips = ['drip', 'drip'] as const;
    const a = pageParams('normal', 0, 0, () => true, drips);
    const b = pageParams('normal', 0, 1, () => true, drips);
    expect(b.kind).toBe(a.kind);
    expect(b.speed).toBeGreaterThan(a.speed);
    expect(b.spawnIntervalMs).toBeLessThan(a.spawnIntervalMs);
    expect(b.complexity).toBeGreaterThan(a.complexity);
    // "Slightly": a page step is smaller than a chapter step.
    expect(b.speed / a.speed).toBeLessThan(pageParams('normal', 1, 0, () => true, drips).speed / a.speed);
  });

  it('gets harder chapter by chapter', () => {
    // The first page of each chapter, both drips.
    const a = pageParams('normal', 0, 0, () => true, ['drip']);
    const b = pageParams('normal', 1, 0, () => true, ['drip']);
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

  it('swaps in a Scrawler page when the keys cannot make the planned type', () => {
    expect(pageParams('normal', 3, 0, () => true, ['runon']).kind).toBe('runon');
    expect(pageParams('normal', 3, 0, (k) => k !== 'runon', ['runon']).kind).toBe('blotling');
  });

  it('only plans drip, symbol and Scrawler pages, mostly Scrawlers', () => {
    for (let chapter = 0; chapter < GAME_CONFIG.chapters.length + 2; chapter++) {
      const plan = chapterPlan(chapter);
      expect(plan.every((k) => k === 'drip' || k === 'symbols' || k === 'blotling')).toBe(true);
      // Scrawlers outnumber letter drips, and every chapter ends on words.
      expect(plan.filter((k) => k === 'blotling').length).toBeGreaterThan(plan.filter((k) => k === 'drip').length);
      expect(plan.at(-1)).toBe('blotling');
    }
  });

  it('sprinkles Run-ons from chapter 4, on Scrawler pages only', () => {
    expect(sprinkleChances('blotling', 2)).toEqual({ runon: 0 });
    expect(sprinkleChances('blotling', 3).runon).toBeGreaterThan(0);
    expect(sprinkleChances('drip', 9)).toEqual({ runon: 0 });
    expect(sprinkleChances('blotling', 9, false, (k) => k !== 'runon').runon).toBe(0);
    const late = sprinkleChances('blotling', 99);
    expect(late.runon).toBeLessThanOrEqual(GAME_CONFIG.sprinkles.runon.max);
  });

  it('starts Apprentice sprinkles after space is learned', () => {
    expect(sprinkleChances('blotling', 9, true).runon).toBe(0);
    expect(sprinkleChances('blotling', 10, true).runon).toBeGreaterThan(0);
  });

  it('keeps Relaxed playable: at least one target on screen and complexity ≥ 0', () => {
    const p = pageParams('relaxed', 0, 0);
    expect(p.maxOnScreen).toBeGreaterThanOrEqual(1);
    expect(p.complexity).toBeGreaterThanOrEqual(0);
  });
});

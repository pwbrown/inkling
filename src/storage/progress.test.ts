import { describe, expect, it } from 'vitest';
import { createContentSource } from '../content/contentSource';
import { createStats } from '../core/stats';
import { createPage, createWorld } from '../core/world';
import {
  continueNotebook,
  recordApprenticePage,
  keyWeights,
  mergeKeyStats,
  nextPagePosition,
  recordResult,
  snapshotNotebook,
} from './progress';
import { defaultSave } from './schema';

describe('mergeKeyStats', () => {
  it('adds hits and misses to the saved totals', () => {
    const save = defaultSave();
    save.keyStats.a = { hits: 5, misses: 1 };
    const stats = createStats();
    stats.hitKeys = { a: 3, s: 2 };
    stats.missedKeys = { a: 1, d: 4 };
    mergeKeyStats(save, stats);
    expect(save.keyStats).toEqual({ a: { hits: 8, misses: 2 }, s: { hits: 2, misses: 0 }, d: { hits: 0, misses: 4 } });
  });
});

describe('recordResult', () => {
  it('tracks best score and furthest chapter per difficulty', () => {
    const save = defaultSave();
    expect(recordResult(save, 'hard', 500, 2)).toBe(true);
    expect(recordResult(save, 'hard', 300, 4)).toBe(false);
    expect(save.records.bestScore.hard).toBe(500);
    expect(save.records.furthestChapter.hard).toBe(4);
    expect(save.records.bestScore.normal).toBeUndefined();
  });
});

describe('notebook snapshots', () => {
  it('points at the next page, or the next chapter after the last page', () => {
    const page = createPage('normal', 0, 0);
    expect(nextPagePosition(page)).toEqual({ chapter: 0, page: 1 });
    const last = createPage('normal', 0, page.pageCount - 1);
    expect(nextPagePosition(last)).toEqual({ chapter: 1, page: 0 });
  });

  it('continues a notebook where the snapshot left off', () => {
    const played = createWorld({ difficulty: 'hard' });
    played.page = createPage('hard', 1, 2);
    played.ink = 45;
    played.stats.score = 1234;
    played.stats.correct = 300;
    played.stats.playMs = 90_000;
    const saved = snapshotNotebook(played, nextPagePosition(played.page), new Date('2026-01-01'));
    expect(saved).toMatchObject({ difficulty: 'hard', chapter: 1, page: 3, ink: 45, score: 1234 });

    const resumed = createWorld();
    continueNotebook(resumed, saved);
    expect(resumed.phase).toBe('playing');
    expect(resumed.difficulty).toBe('hard');
    expect(resumed.page.chapter).toBe(1);
    expect(resumed.page.index).toBe(3);
    expect(resumed.ink).toBe(45);
    expect(resumed.stats.score).toBe(1234);
    expect(resumed.stats.playMs).toBe(90_000);
    expect(resumed.targets).toEqual([]);
  });

  it('never resumes with an empty ink well', () => {
    const world = createWorld();
    continueNotebook(world, { ...snapshotNotebook(world), ink: 0 });
    expect(world.ink).toBeGreaterThan(0);
  });
});

describe('keyWeights', () => {
  it('weights keys you miss more, starting at 1', () => {
    const weights = keyWeights({ a: { hits: 95, misses: 0 }, s: { hits: 50, misses: 50 } }, ['a', 's', 'd']);
    expect(weights.a).toBe(1);
    expect(weights.d).toBe(1);
    expect(weights.s).toBeGreaterThan(2.5);
    expect(weights.s).toBeLessThan(5);
  });
});

describe('recordApprenticePage', () => {
  it('keeps the best stars per page and opens the next chapter after the last page', () => {
    const save = defaultSave();
    recordApprenticePage(save, 0, 0, 2, false);
    recordApprenticePage(save, 0, 0, 1, false);
    expect(save.apprentice.stars['0-0']).toBe(2);
    expect(save.apprentice.unlocked).toBe(1);
    recordApprenticePage(save, 0, 2, 3, true);
    expect(save.apprentice.unlocked).toBe(2);
    expect(save.apprentice.completed).toBe(false);
  });

  it('marks the notebook complete after the last chapter', () => {
    const save = defaultSave();
    recordApprenticePage(save, 9, 4, 3, true);
    expect(save.apprentice.completed).toBe(true);
    expect(save.apprentice.unlocked).toBe(10);
  });
});

describe('continuing an Apprentice notebook', () => {
  it('restores the mode and the chapter keys', () => {
    const played = createWorld({ makeContent: (keys) => createContentSource({ keys }) });
    played.mode = 'apprentice';
    played.page = createPage('normal', 4, 1, played.content, 'apprentice');
    const saved = snapshotNotebook(played);
    expect(saved.mode).toBe('apprentice');

    const resumed = createWorld({ makeContent: (keys) => createContentSource({ keys }) });
    continueNotebook(resumed, saved);
    expect(resumed.mode).toBe('apprentice');
    expect(resumed.page.chapter).toBe(4);
    expect(resumed.keys).toContain('w');
  });
});

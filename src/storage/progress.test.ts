import { describe, expect, it } from 'vitest';
import { createContentSource } from '../content/contentSource';
import { US_QWERTY } from '../content/layouts';
import { APPRENTICE_CHAPTERS, apprenticeKeys } from '../core/campaign';
import { createStats } from '../core/stats';
import { createPage, createWorld } from '../core/world';
import { GAME_CONFIG } from '../core/config';
import {
  chapterBest,
  continueNotebook,
  currentStreak,
  pageBestKey,
  awardStickers,
  recordBossBeaten,
  recordDaily,
  recordPageBest,
  recordFairCopy,
  stickerFacts,
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
    recordApprenticePage(save, APPRENTICE_CHAPTERS - 1, 4, 3, true);
    expect(save.apprentice.completed).toBe(true);
    expect(save.apprentice.unlocked).toBe(APPRENTICE_CHAPTERS);
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
    expect(resumed.keys).toEqual(apprenticeKeys(US_QWERTY, 4));
  });
});

describe('page bests', () => {
  it('keeps the best score per page', () => {
    const save = defaultSave();
    const key = pageBestKey('apprentice', 'normal', 2, 1);
    expect(key).toBe('apprentice:normal:2-1');
    expect(recordPageBest(save, key, 300)).toEqual({ previous: 0, isNew: true });
    expect(recordPageBest(save, key, 200)).toEqual({ previous: 300, isNew: false });
    expect(recordPageBest(save, key, 450)).toEqual({ previous: 300, isNew: true });
    expect(save.records.pageBest[key]).toBe(450);
  });

  it('adds up a chapter’s page bests', () => {
    const save = defaultSave();
    expect(chapterBest(save, 'normal', 0, 3)).toBeNull();
    recordPageBest(save, pageBestKey('apprentice', 'normal', 0, 0), 100);
    recordPageBest(save, pageBestKey('apprentice', 'normal', 0, 2), 50);
    recordPageBest(save, pageBestKey('apprentice', 'hard', 0, 1), 999);
    expect(chapterBest(save, 'normal', 0, 3)).toBe(150);
  });
});

describe('recordDaily', () => {
  const result = (score: number) => ({ score, grades: ['A' as const], wpm: 40, accuracy: 95, finished: true });

  it('counts only the first result of a day', () => {
    const save = defaultSave();
    expect(recordDaily(save, 3, result(500))).toBe(true);
    expect(recordDaily(save, 3, result(900))).toBe(false);
    expect(save.daily.results[3]!.score).toBe(500);
    expect(save.daily.best).toBe(500);
  });

  it('keeps a streak of days in a row, and the longest', () => {
    const save = defaultSave();
    recordDaily(save, 1, result(1));
    recordDaily(save, 2, result(1));
    recordDaily(save, 3, result(1));
    expect(save.daily.streak).toBe(3);
    expect(currentStreak(save.daily, 3)).toBe(3);
    expect(currentStreak(save.daily, 4)).toBe(3);
    // A missed day breaks it.
    expect(currentStreak(save.daily, 5)).toBe(0);
    recordDaily(save, 5, result(1));
    expect(save.daily.streak).toBe(1);
    expect(save.daily.bestStreak).toBe(3);
  });

  it('drops the oldest results', () => {
    const save = defaultSave();
    const keep = GAME_CONFIG.daily.keepResults;
    for (let id = 1; id <= keep + 5; id++) recordDaily(save, id, result(id));
    expect(Object.keys(save.daily.results)).toHaveLength(keep);
    expect(save.daily.results[1]).toBeUndefined();
    expect(save.daily.best).toBe(keep + 5);
    expect(save.daily.streak).toBe(keep + 5);
  });
});

describe('awardStickers', () => {
  it('dates new stickers, marks them unseen and never repeats them', () => {
    const save = defaultSave();
    save.profile.ink = 1_000_000;
    const now = new Date('2026-11-18T10:00:00Z');
    const first = awardStickers(save, stickerFacts(save), now);
    expect(first).toEqual(['scribe', 'calligrapher', 'master']);
    expect(save.stickers.earned.scribe).toBe(now.toISOString());
    expect(save.stickers.unseen).toEqual(first);
    expect(awardStickers(save, stickerFacts(save), now)).toEqual([]);
  });

  it('remembers each boss kind once', () => {
    const save = defaultSave();
    recordBossBeaten(save, 'squid');
    recordBossBeaten(save, 'squid');
    expect(save.stickers.bossesBeaten).toEqual(['squid']);
    expect(awardStickers(save, stickerFacts(save))).toEqual(['firstBoss']);
  });
});

describe('recordFairCopy', () => {
  it('counts every test and keeps the fastest of each kind', () => {
    const save = defaultSave();
    const at = new Date('2026-11-20T10:00:00Z');
    expect(recordFairCopy(save, null, { netWpm: 50, accuracy: 0.95 }, at)).toEqual({ previous: null, isNew: true });
    expect(recordFairCopy(save, null, { netWpm: 45, accuracy: 1 }, at)).toEqual({ previous: { wpm: 50, accuracy: 0.95, at: at.toISOString() }, isNew: false });
    // Timed tests have bests of their own.
    expect(recordFairCopy(save, 30, { netWpm: 40, accuracy: 0.9 }, at).isNew).toBe(true);
    expect(recordFairCopy(save, null, { netWpm: 55, accuracy: 0.9 }, at).isNew).toBe(true);
    expect(save.fairCopy.tests).toBe(4);
    expect(Object.fromEntries(Object.entries(save.fairCopy.best).map(([k, b]) => [k, b.wpm]))).toEqual({ passage: 55, '30': 40 });
  });

  it('remembers each passage copied out, once', () => {
    const save = defaultSave();
    recordFairCopy(save, null, { netWpm: 40, accuracy: 1 }, new Date(), 'twain-huck');
    recordFairCopy(save, null, { netWpm: 30, accuracy: 1 }, new Date(), 'twain-huck');
    recordFairCopy(save, 30, { netWpm: 30, accuracy: 1 });
    expect(save.fairCopy.copied).toEqual(['twain-huck']);
    expect(stickerFacts(save).passagesCopied).toEqual(['twain-huck']);
  });

  it("doesn't keep a zero as a best", () => {
    const save = defaultSave();
    expect(recordFairCopy(save, 60, { netWpm: 0, accuracy: 0 }).isNew).toBe(false);
    expect(save.fairCopy.best).toEqual({});
  });
});

import { describe, expect, it } from 'vitest';
import { DEFAULT_KEYS } from '../core/config';
import { SAVE_VERSION, SaveFormatError, defaultSave, fromExport, migrate, toExport } from './schema';

describe('save schema', () => {
  it('starts new players on the home row and Normal', () => {
    const save = defaultSave();
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.keys).toEqual([...DEFAULT_KEYS]);
    expect(save.difficulty).toBe('normal');
    expect(save.notebook).toBeNull();
  });

  it('round-trips a valid save unchanged', () => {
    const save = defaultSave();
    save.keys = ['a', 'B', '!', ' '];
    save.keyStats = { a: { hits: 10, misses: 2 } };
    save.customPresets = [{ id: 'p1', name: 'Mine', chars: ['a', 'b'] }];
    save.records.bestScore.hard = 1200;
    expect(migrate(structuredClone(save))).toEqual(save);
  });

  it('upgrades version 1 saves, adding empty word lists', () => {
    const save = migrate({ version: 1, keys: ['q'], difficulty: 'hard' });
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.vocab).toEqual([]);
    expect(save.keys).toEqual(['q']);
    expect(save.difficulty).toBe('hard');
  });

  it('upgrades version 2 saves: Apprentice progress starts fresh, old notebooks are Practice', () => {
    const save = migrate({ version: 2, notebook: { difficulty: 'hard', chapter: 1, page: 2, ink: 50 } });
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.apprentice).toEqual({ unlocked: 1, stars: {}, completed: false });
    expect(save.notebook?.mode).toBe('practice');
  });

  it('keeps valid Apprentice progress and drops bad entries', () => {
    const save = migrate({ version: 5, apprentice: { unlocked: 99, stars: { '0-1': 3, '2-0': 7, bad: 2 }, completed: true } });
    expect(save.apprentice).toEqual({ unlocked: 27, stars: { '0-1': 3 }, completed: true });
  });

  it('upgrades version 3 saves with no ink and default cosmetics', () => {
    const save = migrate({ version: 3, keys: ['q'] });
    expect(save.profile).toEqual({ ink: 0, cosmetics: { nib: 'classic', splatter: 'ink', paper: 'ruled' } });
  });

  it('keeps known cosmetics and replaces unknown ones', () => {
    const save = migrate({ version: 4, profile: { ink: 420, cosmetics: { nib: 'quill', splatter: 'rainbow', paper: 'graph' } } });
    expect(save.profile).toEqual({ ink: 420, cosmetics: { nib: 'quill', splatter: 'ink', paper: 'graph' } });
  });

  it('upgrades version 4 saves with a fresh Apprentice course, keeping Practice', () => {
    const appr = migrate({
      version: 4,
      apprentice: { unlocked: 5, stars: { '0-0': 3 }, completed: false },
      notebook: { mode: 'apprentice', difficulty: 'normal', chapter: 3, page: 1, ink: 50 },
      profile: { ink: 300, cosmetics: { nib: 'quill' } },
    });
    expect(appr.apprentice).toEqual({ unlocked: 1, stars: {}, completed: false });
    expect(appr.notebook).toBeNull();
    expect(appr.profile.ink).toBe(300);

    const prac = migrate({ version: 4, notebook: { mode: 'practice', difficulty: 'hard', chapter: 2, page: 0, ink: 70 } });
    expect(prac.notebook?.chapter).toBe(2);
  });

  it('upgrades version 5 saves to the family-friendly word filter, and keeps a valid choice', () => {
    expect(migrate({ version: 5, keys: ['a'] }).contentLevel).toBe('family');
    expect(migrate({ version: 6, contentLevel: 'olderKids' }).contentLevel).toBe('olderKids');
    expect(migrate({ version: 6, contentLevel: 'anything' }).contentLevel).toBe('family');
  });

  it('keeps valid word lists and drops bad ones', () => {
    const save = migrate({
      version: 2,
      vocab: [
        { id: 'a', topic: 'ocean', words: ['sea', 'Bad', 'reef', 'sea', 7], enabled: false, fetchedAt: '2026-01-01' },
        { id: 'b', topic: 'empty', words: [] },
        'junk',
      ],
    });
    expect(save.vocab).toEqual([{ id: 'a', topic: 'ocean', words: ['sea', 'reef'], enabled: false, fetchedAt: '2026-01-01' }]);
  });

  it('cleans up bad fields instead of trusting them', () => {
    const save = migrate({
      version: 2,
      keys: ['a', 'ab', 7, 'a', 'b'],
      difficulty: 'impossible',
      keyStats: { a: { hits: -3, misses: 2.7 }, toolong: { hits: 1, misses: 1 }, b: 'nope' },
      customPresets: [{ id: 'x', name: 'Empty', chars: [] }, { id: 'y', name: 'Ok', chars: ['z'] }, 'junk'],
      records: { bestScore: { normal: 'lots', hard: 50 } },
      notebook: { difficulty: 'hard', chapter: 2, page: 1, ink: 60 },
    });
    expect(save.keys).toEqual(['a', 'b']);
    expect(save.difficulty).toBe('normal');
    expect(save.keyStats).toEqual({ a: { hits: 0, misses: 2 } });
    expect(save.customPresets).toEqual([{ id: 'y', name: 'Ok', chars: ['z'] }]);
    expect(save.records.bestScore).toEqual({ normal: 0, hard: 50 });
    expect(save.notebook).toMatchObject({ difficulty: 'hard', chapter: 2, page: 1, ink: 60, score: 0 });
  });

  it('falls back to default keys if none are usable', () => {
    expect(migrate({ version: 2, keys: [] }).keys).toEqual([...DEFAULT_KEYS]);
  });

  it('rejects things that are not saves', () => {
    for (const raw of [null, 'save', [], {}, { version: 0 }, { version: 'one' }]) {
      expect(() => migrate(raw)).toThrow(SaveFormatError);
    }
  });

  it('refuses saves from a newer version of the game', () => {
    try {
      migrate({ version: SAVE_VERSION + 1 });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SaveFormatError);
      expect((error as SaveFormatError).reason).toBe('newer');
    }
  });
});

describe('export files', () => {
  it('round-trips through export and import', () => {
    const save = defaultSave();
    save.keys = ['q', 'w'];
    const text = JSON.stringify(toExport(save, new Date('2026-01-02T03:04:05Z')));
    expect(JSON.parse(text).exportedAt).toBe('2026-01-02T03:04:05.000Z');
    expect(fromExport(text)).toEqual(save);
  });

  it('rejects other JSON and non-JSON', () => {
    expect(() => fromExport('not json')).toThrow(SaveFormatError);
    expect(() => fromExport('{"app":"other","save":{}}')).toThrow(SaveFormatError);
    expect(() => fromExport(JSON.stringify({ version: 1 }))).toThrow(SaveFormatError);
  });
});

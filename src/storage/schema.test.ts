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

import { describe, expect, it } from 'vitest';
import { DEFAULT_KEYS } from '../../core/config';
import { CONTENT_LEVELS } from '../contentFilter';
import { MIN_WORD_POOL, createContentSource } from '../contentSource';
import { loadEnglishPack } from './index';
import words from './words.json';

describe('bundled English pack', async () => {
  const pack = await loadEnglishPack();
  const family = pack.wordsFor('family');
  const has = (level: (typeof CONTENT_LEVELS)[number]) => new Set(pack.wordsFor(level).map((e) => e.word));

  it('has 50k+ words (REQUIREMENTS §6)', () => {
    expect(family.length).toBeGreaterThan(50_000);
  });

  it('contains only lowercase a–z words of 2–12 letters', () => {
    expect(pack.wordsFor('grownUps').every((e) => /^[a-z]{2,12}$/.test(e.word))).toBe(true);
  });

  it('contains nothing a level’s blocklist would block', () => {
    for (const level of CONTENT_LEVELS) {
      const list = pack.blocklistFor(level);
      const blocked = pack.wordsFor(level).filter((e) => list.blocksWord(e.word)).map((e) => e.word);
      expect(blocked, level).toEqual([]);
    }
  });

  it('family friendly leaves out words that are not kid-friendly, keeping harmless look-alikes', () => {
    const words = has('family');
    for (const word of ['jackass', 'sperms', 'pregnant', 'erection', 'seduce', 'drunk', 'murder', 'cigarette', 'stupid', 'gay', 'lesbian', 'poop', 'farting']) {
      expect(words.has(word), word).toBe(false);
    }
    for (const word of ['butter', 'grape', 'wombat', 'abreast', 'scrapped', 'psychology', 'condominium', 'squawk', 'lustrous', 'spotty', 'farther', 'speed', 'nosegay']) {
      expect(words.has(word), word).toBe(true);
    }
  });

  it('lets more through at each looser level, but never swearing or slurs', () => {
    const older = has('olderKids');
    const grown = has('grownUps');
    for (const word of ['gay', 'poop', 'stupid']) expect(older.has(word), word).toBe(true);
    for (const word of ['pregnant', 'murder', 'seduce']) {
      expect(older.has(word), word).toBe(false);
      expect(grown.has(word), word).toBe(true);
    }
    expect(family.every((e) => older.has(e.word))).toBe(true);
    expect([...older].every((w) => grown.has(w))).toBe(true);
    for (const word of ['damn', 'bastard', 'midget', 'gypsy', 'sexy', 'penis']) expect(grown.has(word), word).toBe(false);
  });

  it('has no duplicate words', () => {
    const all = pack.wordsFor('grownUps');
    expect(new Set(all.map((e) => e.word)).size).toBe(all.length);
  });

  it('records its source and license', () => {
    expect(words.source).toMatch(/SCOWL/);
    expect(words.license).toMatch(/licenses\/SCOWL\.txt/);
  });

  it('has enough home-row words to skip the random-string fallback', () => {
    const content = createContentSource({ keys: DEFAULT_KEYS, words: family, blocklist: pack.blocklistFor('family') });
    expect(content.wordCount).toBeGreaterThanOrEqual(MIN_WORD_POOL);
  });
});

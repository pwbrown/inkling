import { describe, expect, it } from 'vitest';
import { DEFAULT_KEYS } from '../../core/config';
import { MIN_WORD_POOL, createContentSource } from '../contentSource';
import { loadEnglishPack } from './index';
import words from './words.json';

describe('bundled English pack', async () => {
  const pack = await loadEnglishPack();

  it('has 50k+ words (REQUIREMENTS §6)', () => {
    expect(pack.words.length).toBeGreaterThan(50_000);
  });

  it('contains only lowercase a–z words of 2–12 letters', () => {
    expect(pack.words.every((e) => /^[a-z]{2,12}$/.test(e.word))).toBe(true);
  });

  it('contains nothing the blocklist would block', () => {
    const blocked = pack.words.filter((e) => pack.blocklist.blocksWord(e.word)).map((e) => e.word);
    expect(blocked).toEqual([]);
  });

  it('leaves out words that are not kid-friendly, while keeping harmless look-alikes', () => {
    const has = new Set(pack.words.map((e) => e.word));
    for (const word of ['jackass', 'sperms', 'pregnant', 'erection', 'seduce', 'drunk', 'murder', 'cigarette', 'stupid', 'gay', 'lesbian', 'poop', 'farting']) {
      expect(has.has(word), word).toBe(false);
    }
    for (const word of ['butter', 'grape', 'wombat', 'abreast', 'scrapped', 'psychology', 'condominium', 'squawk', 'lustrous', 'spotty', 'farther', 'speed', 'nosegay']) {
      expect(has.has(word), word).toBe(true);
    }
  });

  it('has no duplicate words', () => {
    expect(new Set(pack.words.map((e) => e.word)).size).toBe(pack.words.length);
  });

  it('records its source and license', () => {
    expect(words.source).toMatch(/SCOWL/);
    expect(words.license).toMatch(/licenses\/SCOWL\.txt/);
  });

  it('has enough home-row words to skip the random-string fallback', () => {
    const content = createContentSource({ keys: DEFAULT_KEYS, words: pack.words, blocklist: pack.blocklist });
    expect(content.wordCount).toBeGreaterThanOrEqual(MIN_WORD_POOL);
  });
});

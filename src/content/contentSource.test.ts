import { describe, expect, it } from 'vitest';
import { Blocklist } from './blocklist';
import { MIN_WORD_POOL, corrupt, countTypeableWords, createContentSource, styleWord, wordLetters } from './contentSource';
import { entriesFromTiers } from './wordPool';

const counter = () => {
  let i = 0;
  return () => ((i++ * 0.37) % 1);
};

describe('content source', () => {
  it('serves drip characters from the keys only', () => {
    const content = createContentSource({ keys: ['a', 's', 'a'] });
    expect(content.keys).toEqual(['a', 's']);
    const random = counter();
    for (let i = 0; i < 50; i++) expect(['a', 's']).toContain(content.nextChar(random));
  });

  it('shows heavier-weighted keys more often as drips', () => {
    const content = createContentSource({ keys: ['a', 's'], keyWeights: { s: 3 } });
    let i = 0;
    const random = () => (i++ % 100) / 100;
    const counts = { a: 0, s: 0 };
    for (let n = 0; n < 100; n++) counts[content.nextChar(random) as 'a' | 's']++;
    expect(counts.a).toBe(25);
    expect(counts.s).toBe(75);
  });

  it('uses real words when enough are typeable', () => {
    const words = Array.from({ length: MIN_WORD_POOL }, (_, i) => 'ab'.repeat(1 + (i % 4)) + 'a'.repeat(i));
    const content = createContentSource({ keys: ['a', 'b'], words: entriesFromTiers([words.join(' ')]) });
    expect(content.wordCount).toBe(MIN_WORD_POOL);
    const random = counter();
    for (let i = 0; i < 30; i++) expect(words).toContain(content.nextWord(0.5, random));
  });

  it('falls back to generated strings when no words fit', () => {
    const content = createContentSource({ keys: ['7', '8', '9'], words: entriesFromTiers(['cat dog']) });
    expect(content.wordCount).toBe(0);
    const word = content.nextWord(0.5, counter());
    expect(word).toMatch(/^[789]+$/);
  });

  it('drops blocked words from the pool', () => {
    const content = createContentSource({
      keys: [...'darnheck'],
      words: entriesFromTiers(['darn heck den']),
      blocklist: new Blocklist(['darn', 'heck']),
    });
    expect(content.wordCount).toBe(1);
  });
});

describe('capitals and punctuation', () => {
  it('treats a letter as usable when either case is selected', () => {
    expect([...wordLetters(['a', 'B', '1', ';'])].sort()).toEqual(['a', 'b']);
  });

  it('counts words for any mix of cases', () => {
    const words = entriesFromTiers(['cab bad dab ace']);
    expect(countTypeableWords(words, ['a', 'b', 'c', 'd'])).toBe(3);
    expect(countTypeableWords(words, ['A', 'B', 'C', 'D'])).toBe(3);
    expect(countTypeableWords(words, ['1'])).toBe(0);
  });

  it('types letters only selected as capitals in capitals', () => {
    expect(styleWord('cab', new Set(['C', 'A', 'B']), () => 0.99)).toBe('CAB');
    expect(styleWord('cab', new Set(['c', 'A', 'b']), () => 0.99)).toBe('cAb');
  });

  it('sometimes capitalizes the first letter when both cases are selected', () => {
    const keys = new Set(['c', 'C', 'a', 'b']);
    expect(styleWord('cab', keys, () => 0)).toBe('Cab');
    expect(styleWord('cab', keys, () => 0.99)).toBe('cab');
  });

  it('adds trailing punctuation only from selected keys', () => {
    const words = Array.from({ length: MIN_WORD_POOL }, (_, i) => 'ab'.repeat(1 + (i % 4)) + 'a'.repeat(i));
    const content = createContentSource({ keys: ['a', 'b', ',', '!'], words: entriesFromTiers([words.join(' ')]) });
    let i = 0;
    const random = () => [0.5, 0.1, 0.0, 0.5, 0.6][i++ % 5]!;
    const results = Array.from({ length: 40 }, () => content.nextWord(0.5, random));
    const endings = new Set(results.map((w) => w.at(-1)));
    for (const end of endings) expect(['a', 'b', ',', '!']).toContain(end);
    expect(results.some((w) => /[,!]$/.test(w))).toBe(true);
  });
});

describe('phrases and misprints', () => {
  const words = entriesFromTiers([
    Array.from({ length: 40 }, (_, i) => ['flask', 'glass', 'salad', 'dash', 'hall'][i % 5] + 'a'.repeat(Math.floor(i / 5))).join(' '),
  ]);
  const random = (() => {
    let i = 0;
    return () => ((i++ * 0.618) % 1);
  })();

  it('only offers Run-ons when space is selected', () => {
    expect(createContentSource({ keys: [...'asdf'] }).supports('runon')).toBe(false);
    expect(createContentSource({ keys: [...'asdf '] }).supports('runon')).toBe(true);
    expect(createContentSource({ keys: [...'asdf'] }).supports('misprint')).toBe(true);
  });

  it('builds phrases of several words, longer when harder', () => {
    const content = createContentSource({ keys: [...'asdfghjkl '], words });
    const easy = content.nextPhrase(0, random);
    const hard = content.nextPhrase(1, random);
    expect(easy.split(' ').length).toBe(2);
    expect(hard.split(' ').length).toBe(5);
    expect(hard).toMatch(/^[asdfghjkl ]+$/);
  });

  it('misspells a real word using only selected keys', () => {
    const content = createContentSource({ keys: [...'asdfghjkl'], words });
    for (let i = 0; i < 50; i++) {
      const { right, wrong } = content.nextMisprint(0.3, random);
      expect(wrong).not.toBe(right);
      expect([...right].length).toBeGreaterThanOrEqual(4);
      expect(wrong).toMatch(/^[asdfghjkl]+$/);
    }
  });

  it('makes each kind of typo', () => {
    const r = () => 0;
    expect(corrupt('flask', 'swap', [], r)).toBe('lfask');
    expect(corrupt('flask', 'drop', [], r)).toBe('lask');
    expect(corrupt('flask', 'double', [], r)).toBe('fflask');
    expect(corrupt('flask', 'replace', ['g'], r)).toBe('glask');
    expect(corrupt('aa', 'swap', [], r)).toBeNull();
    expect(corrupt('ab', 'replace', ['a'], r)).toBeNull();
  });
});

describe('topic words', () => {
  it('favours downloaded topic words that fit the keys', () => {
    const words = entriesFromTiers([Array.from({ length: 30 }, (_, i) => 'sad' + 'a'.repeat(i)).join(' ')]);
    const content = createContentSource({
      keys: [...'asdfghjkl'],
      words,
      topicWords: ['flask', 'glass', 'flags', 'shall', 'halls', 'ocean'],
    });
    expect(content.topicWordCount).toBe(5);
    let i = 0;
    const random = () => [0.1, 0.5, 0.5][i++ % 3]!;
    const picked = Array.from({ length: 20 }, () => content.nextWord(0.5, random).replace(/[,.;:!?]$/, ''));
    expect(picked.some((w) => ['flask', 'glass', 'flags', 'shall', 'halls'].includes(w))).toBe(true);
  });

  it('checks topic words against the blocklist', () => {
    const content = createContentSource({
      keys: [...'darnheck'],
      topicWords: ['darn', 'heck', 'den', 'dank', 'hen', 'need', 'deck'],
      blocklist: new Blocklist(['darn']),
    });
    expect(content.topicWordCount).toBe(6);
  });
});

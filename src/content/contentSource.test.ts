import { describe, expect, it } from 'vitest';
import { Blocklist } from './blocklist';
import { MIN_WORD_POOL, createContentSource } from './contentSource';
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

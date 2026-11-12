/**
 * Where target payloads come from. Combines the word pool and the fallback
 * generator for the player's key set (REQUIREMENTS §6).
 */
import { Blocklist } from './blocklist';
import { generateString } from './generator';
import { buildWordPool, pickWord, type RankedWord, type WordEntry } from './wordPool';

/**
 * Below this many typeable words, real words get repetitive, so generated
 * strings are mixed in. With none at all, only generated strings are used.
 */
export const MIN_WORD_POOL = 25;

/** Chance a word starts with a capital, when both cases of its first letter are selected. */
const CAPITALIZE_CHANCE = 0.3;
/** Chance a word gets trailing punctuation, when any is selected. */
const PUNCTUATION_CHANCE = 0.2;
/** Punctuation that reads naturally at the end of a word. */
const TRAILING_PUNCTUATION = [',', '.', ';', ':', '!', '?'];

export interface ContentSource {
  readonly keys: readonly string[];
  /** Number of real words typeable with the keys. */
  readonly wordCount: number;
  /** A single character for a Drip (T2). */
  nextChar(random: () => number): string;
  /** A word, or a generated string, for a Blotling (T1). */
  nextWord(difficulty: number, random: () => number): string;
}

export interface ContentOptions {
  keys: readonly string[];
  /** Lowercase dictionary words. */
  words?: readonly WordEntry[];
  blocklist?: Blocklist;
  /**
   * Set for the bundled pack, which was already filtered at build time.
   * Leave unset for imported or fetched words so they get checked.
   */
  trustedWords?: boolean;
}

/**
 * Lowercase letters a word may use: a letter counts if either case of it is
 * selected (uppercase-only letters are typed as capitals).
 */
export function wordLetters(keys: Iterable<string>): Set<string> {
  const letters = new Set<string>();
  for (const key of keys) {
    if (/^\p{L}$/u.test(key)) letters.add(key.toLowerCase());
  }
  return letters;
}

/** How many dictionary words the keys can make. Cheap enough to run on every click. */
export function countTypeableWords(words: readonly WordEntry[], keys: Iterable<string>): number {
  const letters = wordLetters(keys);
  if (letters.size === 0) return 0;
  let count = 0;
  outer: for (const { word } of words) {
    for (const ch of word) if (!letters.has(ch)) continue outer;
    count++;
  }
  return count;
}

/**
 * Fit a lowercase word to the selected keys: letters only selected as
 * capitals become capitals, and sometimes the first letter is capitalized.
 */
export function styleWord(word: string, keys: ReadonlySet<string>, random: () => number): string {
  let out = '';
  for (const ch of word) out += keys.has(ch) ? ch : ch.toUpperCase();

  const first = out[0];
  if (first && keys.has(first.toLowerCase()) && keys.has(first.toUpperCase()) && random() < CAPITALIZE_CHANCE) {
    out = first.toUpperCase() + out.slice(1);
  }
  return out;
}

export function createContentSource({
  keys,
  words = [],
  blocklist = new Blocklist([]),
  trustedWords = false,
}: ContentOptions): ContentSource {
  if (keys.length === 0) throw new Error('A content source needs at least one key');
  const unique = [...new Set(keys)];
  const keySet = new Set(unique);
  const punctuation = TRAILING_PUNCTUATION.filter((p) => keySet.has(p));

  let pool: RankedWord[] = buildWordPool(words, wordLetters(unique));
  if (!trustedWords) pool = pool.filter((w) => !blocklist.blocksWord(w.word));

  return {
    keys: unique,
    wordCount: pool.length,
    nextChar(random) {
      return unique[Math.floor(random() * unique.length)] as string;
    },
    nextWord(difficulty, random) {
      const useWords = pool.length >= MIN_WORD_POOL || (pool.length > 0 && random() < 0.5);
      const word = useWords ? pickWord(pool, difficulty, random) : null;
      if (!word) return generateString(unique, difficulty, random, blocklist);

      let text = styleWord(word, keySet, random);
      if (punctuation.length > 0 && random() < PUNCTUATION_CHANCE) {
        text += punctuation[Math.floor(random() * punctuation.length)];
      }
      return text;
    },
  };
}

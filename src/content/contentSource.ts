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
  words?: readonly WordEntry[];
  blocklist?: Blocklist;
}

export function createContentSource({ keys, words = [], blocklist = new Blocklist([]) }: ContentOptions): ContentSource {
  if (keys.length === 0) throw new Error('A content source needs at least one key');
  const unique = [...new Set(keys)];
  const pool: RankedWord[] = buildWordPool(words, unique).filter((w) => !blocklist.blocksWord(w.word));

  return {
    keys: unique,
    wordCount: pool.length,
    nextChar(random) {
      return unique[Math.floor(random() * unique.length)] as string;
    },
    nextWord(difficulty, random) {
      const useWords = pool.length >= MIN_WORD_POOL || (pool.length > 0 && random() < 0.5);
      const word = useWords ? pickWord(pool, difficulty, random) : null;
      return word ?? generateString(unique, difficulty, random, blocklist);
    },
  };
}

/**
 * Where target payloads come from. Combines the word pool and the fallback
 * generator for the player's key set (REQUIREMENTS §6).
 */
import { Blocklist } from './blocklist';
import { generateString } from './generator';
import { GAME_CONFIG, type TargetKind } from '../core/config';
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
  /** Number of downloaded topic words typeable with the keys. */
  readonly topicWordCount: number;
  /** A single character for a Drip (T2). */
  nextChar(random: () => number): string;
  /** A word, or a generated string, for a Blotling (T1). */
  nextWord(difficulty: number, random: () => number): string;
  /** Several words separated by spaces, for a Run-on (T3). Needs the space key. */
  nextPhrase(difficulty: number, random: () => number): string;
  /** A word and a misspelled copy of it, for a Misprint (T4). */
  nextMisprint(difficulty: number, random: () => number): { right: string; wrong: string };
  /** Whether these keys can make a target type (Run-ons need the space key). */
  supports(kind: TargetKind): boolean;
}

export type Corruption = 'swap' | 'drop' | 'double' | 'replace';
const CORRUPTIONS: readonly Corruption[] = ['swap', 'drop', 'double', 'replace'];

/**
 * Misspell a word with one typo of the given kind (REQUIREMENTS §6, T4).
 * Returns null if that kind of typo isn't possible for this word. Characters
 * added by "replace" come from `keys`, so the fix only needs selected keys.
 */
export function corrupt(word: string, kind: Corruption, keys: readonly string[], random: () => number): string | null {
  const chars = [...word];
  const at = (n: number) => Math.floor(random() * n);
  switch (kind) {
    case 'swap': {
      const spots = chars.slice(0, -1).flatMap((ch, i) => (ch !== chars[i + 1] ? [i] : []));
      if (spots.length === 0) return null;
      const i = spots[at(spots.length)]!;
      [chars[i], chars[i + 1]] = [chars[i + 1]!, chars[i]!];
      break;
    }
    case 'drop':
      if (chars.length < 3) return null;
      chars.splice(at(chars.length), 1);
      break;
    case 'double': {
      const i = at(chars.length);
      chars.splice(i, 0, chars[i]!);
      break;
    }
    case 'replace': {
      const i = at(chars.length);
      const options = keys.filter((k) => k !== chars[i] && k !== ' ');
      if (options.length === 0) return null;
      chars[i] = options[at(options.length)]!;
      break;
    }
  }
  const out = chars.join('');
  return out === word ? null : out;
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
  /**
   * Relative chance of each key appearing as a drip (default 1). Used to
   * show weak keys more often.
   */
  keyWeights?: Readonly<Record<string, number>>;
  /**
   * Downloaded topic words (lowercase). When enough fit the keys, they're
   * favoured over the general word list. Always checked against the blocklist.
   */
  topicWords?: readonly string[];
}

/** Share of words drawn from topic lists, when enough topic words fit the keys. */
const TOPIC_SHARE = 0.6;
const MIN_TOPIC_POOL = 5;

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
  keyWeights = {},
  topicWords = [],
}: ContentOptions): ContentSource {
  if (keys.length === 0) throw new Error('A content source needs at least one key');
  const unique = [...new Set(keys)];
  const keySet = new Set(unique);
  const punctuation = TRAILING_PUNCTUATION.filter((p) => keySet.has(p));
  const weights = unique.map((k) => Math.max(0, keyWeights[k] ?? 1));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let pool: RankedWord[] = buildWordPool(words, wordLetters(unique));
  if (!trustedWords) pool = pool.filter((w) => !blocklist.blocksWord(w.word));

  const topicPool = buildWordPool(
    [...new Set(topicWords)].map((word) => ({ word, tier: 0 })),
    wordLetters(unique),
  ).filter((w) => !blocklist.blocksWord(w.word));

  /**
   * A word fitted to the keys, without trailing punctuation. With
   * `capitalize` false, a capital only appears where the keys require one.
   */
  const baseWord = (difficulty: number, random: () => number, capitalize = true): string => {
    const useTopic = topicPool.length >= MIN_TOPIC_POOL && random() < TOPIC_SHARE;
    const useWords = pool.length >= MIN_WORD_POOL || (pool.length > 0 && random() < 0.5);
    const word = useTopic ? pickWord(topicPool, difficulty, random) : useWords ? pickWord(pool, difficulty, random) : null;
    if (!word) return generateString(unique, difficulty, random, blocklist);
    return styleWord(word, keySet, capitalize ? random : () => 1);
  };

  const withPunctuation = (text: string, chance: number, random: () => number) =>
    punctuation.length > 0 && random() < chance ? text + punctuation[Math.floor(random() * punctuation.length)] : text;

  return {
    keys: unique,
    wordCount: pool.length,
    topicWordCount: topicPool.length,
    supports(kind) {
      return kind !== 'runon' || keySet.has(' ');
    },
    nextPhrase(difficulty, random) {
      const { min, max } = GAME_CONFIG.phraseWords;
      const count = min + Math.round(Math.min(1, Math.max(0, difficulty)) * (max - min));
      // Easier words than a Blotling page: the challenge is the length.
      const phrase = Array.from({ length: count }, () => baseWord(difficulty * 0.6, random, false)).join(' ');
      // Like a sentence: sometimes start with a capital, if both cases are selected.
      const first = phrase[0]!;
      const capitalized =
        keySet.has(first.toUpperCase()) && keySet.has(first) && random() < 0.5 ? first.toUpperCase() + phrase.slice(1) : phrase;
      return withPunctuation(capitalized, 0.6, random);
    },
    nextMisprint(difficulty, random) {
      const minLength = GAME_CONFIG.misprintMinLength;
      let right = baseWord(difficulty, random);
      for (let i = 0; i < 10 && [...right].length < minLength; i++) right = baseWord(Math.max(difficulty, 0.5), random);
      while ([...right].length < minLength) right += baseWord(difficulty, random);

      // One typo, or two on harder pages.
      const typos = difficulty >= 0.7 ? 2 : 1;
      for (let attempt = 0; attempt < 20; attempt++) {
        let wrong: string | null = right;
        for (let n = 0; n < typos && wrong; n++) {
          wrong = corrupt(wrong, CORRUPTIONS[Math.floor(random() * CORRUPTIONS.length)]!, unique, random);
        }
        if (wrong && wrong !== right && !blocklist.blocksString(wrong)) return { right, wrong };
      }
      // Always possible: double a letter.
      return { right, wrong: corrupt(right, 'double', unique, random)! };
    },
    nextChar(random) {
      if (totalWeight <= 0) return unique[Math.floor(random() * unique.length)] as string;
      let roll = random() * totalWeight;
      for (let i = 0; i < unique.length; i++) {
        roll -= weights[i]!;
        if (roll < 0) return unique[i]!;
      }
      return unique[unique.length - 1]!;
    },
    nextWord(difficulty, random) {
      return withPunctuation(baseWord(difficulty, random), PUNCTUATION_CHANCE, random);
    },
  };
}

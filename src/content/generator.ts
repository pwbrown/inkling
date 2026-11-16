/**
 * Fallback generator: made-up strings from the selected keys, for when too
 * few real words can be typed with them (REQUIREMENTS §6). Every result
 * passes the strict blocklist check.
 */
import type { Blocklist } from './blocklist';

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);
const MAX_ATTEMPTS = 50;

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

/** Length grows with difficulty: about 2–3 letters when easy, 5–7 when hard. */
export function generatedLength(difficulty: number, random: () => number): number {
  const d = Math.min(1, Math.max(0, difficulty));
  return 2 + Math.round(d * 4) + (random() < 0.5 ? 0 : 1);
}

/** Most re-picks per string to avoid a triple letter. */
const MAX_REPICKS = 20;

/** One candidate string. Pronounceable when the keys include vowels and consonants. */
function candidate(keys: readonly string[], length: number, random: () => number): string {
  const vowels = keys.filter((k) => VOWELS.has(k.toLowerCase()));
  const consonants = keys.filter((k) => !VOWELS.has(k.toLowerCase()));
  const pronounceable = vowels.length > 0 && consonants.length > 0;

  let out = '';
  let useVowel = random() < 0.3;
  // Re-picks to avoid a triple letter are capped: with a single key (or an
  // unlucky run) there may be nothing else to pick.
  let repicks = 0;
  while ([...out].length < length) {
    let ch: string;
    if (pronounceable) {
      ch = pick(useVowel ? vowels : consonants, random);
      // Mostly alternate, with the odd consonant cluster ("st", "fl").
      useVowel = useVowel ? false : random() < 0.75;
    } else {
      ch = pick(keys, random);
    }
    // No triple letters: "aaa" isn't useful practice.
    if (out.endsWith(ch + ch) && repicks++ < MAX_REPICKS) continue;
    out += ch;
  }
  return out;
}

/**
 * Generate a string from `keys`, rejecting anything the blocklist flags.
 * Falls back to a single key if every attempt was rejected, which can only
 * happen with tiny, unlucky key sets.
 */
export function generateString(
  keys: readonly string[],
  difficulty: number,
  random: () => number,
  blocklist: Blocklist,
): string {
  if (keys.length === 0) throw new Error('generateString needs at least one key');
  if (keys.length === 1) return keys[0]!.repeat(Math.min(3, generatedLength(difficulty, random)));

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const text = candidate(keys, generatedLength(difficulty, random), random);
    if (!blocklist.blocksString(text)) return text;
  }
  return pick(keys, random);
}

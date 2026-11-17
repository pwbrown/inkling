/**
 * Seeded randomness, so a page can play out the same for every player (the
 * Daily Page). Small and fast; not for anything security-related.
 */

/** A 32-bit hash of a string (FNV-1a). */
export function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A generator returning numbers in [0, 1), the same sequence for the same seed (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A generator for one seeded decision, mixed with labels (e.g. "spawn", page, count). */
export function seeded(seed: number, ...salt: readonly (string | number)[]): () => number {
  return mulberry32(hashSeed(`${seed}:${salt.join(':')}`));
}

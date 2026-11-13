/**
 * Ink earned (XP), levels, ranks and cosmetic unlocks: the reward loop that
 * makes progress visible over many sessions. Pure data and functions.
 * Tuning numbers are in GAME_CONFIG.rewards.
 */
import { GAME_CONFIG } from './config';

export type NibStyle = 'classic' | 'quill' | 'brush' | 'gold';
export type SplatterColor = 'ink' | 'crimson' | 'violet' | 'teal' | 'gold';
export type PaperStyle = 'ruled' | 'graph' | 'parchment';

export interface Cosmetics {
  nib: NibStyle;
  splatter: SplatterColor;
  paper: PaperStyle;
}

export const DEFAULT_COSMETICS: Cosmetics = { nib: 'classic', splatter: 'ink', paper: 'ruled' };

export type CosmeticSlot = keyof Cosmetics;

/**
 * Level each cosmetic unlocks at. Spread out, with gaps growing, so each
 * new thing is something to work toward (most levels unlock nothing).
 */
export const UNLOCKS: { [S in CosmeticSlot]: Record<Cosmetics[S], number> } = {
  nib: { classic: 1, quill: 4, brush: 8, gold: 14 },
  splatter: { ink: 1, crimson: 2, violet: 5, teal: 10, gold: 16 },
  paper: { ruled: 1, graph: 6, parchment: 12 },
};

export type Rank = 'scribbler' | 'doodler' | 'scribe' | 'penman' | 'calligrapher' | 'illuminator' | 'master';

/** Rank by level: the title that grows with you. */
export const RANKS: readonly { rank: Rank; from: number }[] = [
  { rank: 'scribbler', from: 1 },
  { rank: 'doodler', from: 3 },
  { rank: 'scribe', from: 5 },
  { rank: 'penman', from: 8 },
  { rank: 'calligrapher', from: 12 },
  { rank: 'illuminator', from: 17 },
  { rank: 'master', from: 23 },
];

/** Total ink needed to reach `level` (level 1 needs none). Each level's gap grows by 2 × `levelStep`. */
export function inkForLevel(level: number): number {
  const n = Math.max(0, level - 1);
  return GAME_CONFIG.rewards.levelStep * n * (n + 1);
}

export function levelForInk(ink: number): number {
  let level = 1;
  while (inkForLevel(level + 1) <= ink) level++;
  return level;
}

export function rankForLevel(level: number): Rank {
  let current: Rank = 'scribbler';
  for (const r of RANKS) if (level >= r.from) current = r.rank;
  return current;
}

/** Progress toward the next level: ink so far in this level, and how much it takes. */
export function levelProgress(ink: number): { level: number; into: number; needed: number } {
  const level = levelForInk(ink);
  const start = inkForLevel(level);
  return { level, into: ink - start, needed: inkForLevel(level + 1) - start };
}

/** Ink earned for a cleared page: a share of its score, plus a bonus per star. */
export function inkForPage(pageScore: number, stars = 0): number {
  const r = GAME_CONFIG.rewards;
  return Math.max(0, Math.round(pageScore * r.inkPerScore)) + stars * r.inkPerStar;
}

/** Bonus ink for completing the Apprentice notebook. */
export const NOTEBOOK_BONUS = GAME_CONFIG.rewards.notebookBonus;

export function isUnlocked<S extends CosmeticSlot>(slot: S, item: Cosmetics[S], level: number): boolean {
  return level >= (UNLOCKS[slot] as Record<string, number>)[item]!;
}

/** Everything unlocked by reaching `to` that wasn't unlocked at `from`. */
export function newUnlocks(from: number, to: number): { slot: CosmeticSlot; item: string }[] {
  const out: { slot: CosmeticSlot; item: string }[] = [];
  for (const slot of Object.keys(UNLOCKS) as CosmeticSlot[]) {
    for (const [item, level] of Object.entries(UNLOCKS[slot])) {
      if (level > from && level <= to) out.push({ slot, item });
    }
  }
  return out;
}

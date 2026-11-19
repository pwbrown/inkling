/**
 * Ink earned (XP), levels, ranks and cosmetic unlocks: the reward loop that
 * makes progress visible over many sessions. Pure data and functions.
 * Tuning numbers are in GAME_CONFIG.rewards.
 */
import { GAME_CONFIG } from './config';

export type NibStyle = 'classic' | 'quill' | 'brush' | 'gold';
export type SplatterColor = 'ink' | 'crimson' | 'violet' | 'teal' | 'gold';
export type PaperStyle = 'ruled' | 'graph' | 'parchment' | 'harvest' | 'winter';
/** A hat for the Nib (M26): holiday keepsakes. */
export type HatStyle = 'none' | 'pilgrim' | 'santa';

export interface Cosmetics {
  nib: NibStyle;
  splatter: SplatterColor;
  paper: PaperStyle;
  hat: HatStyle;
}

export const DEFAULT_COSMETICS: Cosmetics = { nib: 'classic', splatter: 'ink', paper: 'ruled', hat: 'none' };

export type CosmeticSlot = keyof Cosmetics;

/** How a cosmetic unlocks: at a level, or with a sticker (the holiday ones). */
export type Unlock = number | { sticker: string };

/**
 * Level each cosmetic unlocks at. Spread out, with gaps growing, so each
 * new thing is something to work toward (most levels unlock nothing).
 * Holiday keepsakes come with the holiday stickers instead, and stay forever.
 */
export const UNLOCKS: { [S in CosmeticSlot]: Record<Cosmetics[S], Unlock> } = {
  nib: { classic: 1, quill: 4, brush: 8, gold: 14 },
  splatter: { ink: 1, crimson: 2, violet: 5, teal: 10, gold: 16 },
  paper: { ruled: 1, graph: 6, parchment: 12, harvest: { sticker: 'harvestHelper' }, winter: { sticker: 'snowScribe' } },
  hat: { none: 1, pilgrim: { sticker: 'harvestHelper' }, santa: { sticker: 'snowScribe' } },
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

/** `stickers`: the ids of stickers the player has. */
export function isUnlocked<S extends CosmeticSlot>(slot: S, item: Cosmetics[S], level: number, stickers: Iterable<string> = []): boolean {
  const rule = (UNLOCKS[slot] as Record<string, Unlock>)[item];
  if (rule === undefined) return false;
  return typeof rule === 'number' ? level >= rule : [...stickers].includes(rule.sticker);
}

const allUnlocks = (): { slot: CosmeticSlot; item: string; rule: Unlock }[] =>
  (Object.keys(UNLOCKS) as CosmeticSlot[]).flatMap((slot) =>
    Object.entries(UNLOCKS[slot] as Record<string, Unlock>).map(([item, rule]) => ({ slot, item, rule })),
  );

/** Everything unlocked by reaching `to` that wasn't unlocked at `from`. */
export function newUnlocks(from: number, to: number): { slot: CosmeticSlot; item: string }[] {
  return allUnlocks()
    .filter(({ rule }) => typeof rule === 'number' && rule > from && rule <= to)
    .map(({ slot, item }) => ({ slot, item }));
}

/** Everything these newly earned stickers unlock. */
export function stickerUnlocks(stickers: readonly string[]): { slot: CosmeticSlot; item: string }[] {
  return allUnlocks()
    .filter(({ rule }) => typeof rule !== 'number' && stickers.includes(rule.sticker))
    .map(({ slot, item }) => ({ slot, item }));
}

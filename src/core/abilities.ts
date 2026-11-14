/**
 * Abilities (GAME_CONFIG.abilities): which exist, when each unlocks, and how
 * hard they are to earn on a given chapter. Using them lives in input.ts.
 */
import { GAME_CONFIG } from './config';

export type AbilityId = 'blotter' | 'eraser' | 'paperweight' | 'highlighter' | 'blottingPaper';

/** In unlock order. */
export const ABILITIES: readonly AbilityId[] = ['blotter', 'eraser', 'paperweight', 'highlighter', 'blottingPaper'];

/** Abilities the player fires with a key, spending charges. */
export type ActiveAbility = 'paperweight' | 'highlighter' | 'blotter';
export const ACTIVE_ABILITIES: readonly ActiveAbility[] = ['paperweight', 'highlighter', 'blotter'];

export function isActive(id: AbilityId): id is ActiveAbility {
  return (ACTIVE_ABILITIES as readonly string[]).includes(id);
}

/** Charges an active ability costs. */
export function abilityCost(id: ActiveAbility): number {
  return GAME_CONFIG.abilities[id].cost;
}

/**
 * Abilities a player has: `chapterReached` is the furthest Apprentice chapter
 * they have opened (0-based) and `level` their player level. Either is enough,
 * so players who only use Practice still earn them.
 */
export function unlockedAbilities(chapterReached: number, level: number): AbilityId[] {
  return ABILITIES.filter((id) => {
    const { fromChapter, fromLevel } = GAME_CONFIG.abilities[id];
    return chapterReached >= fromChapter || level >= fromLevel;
  });
}

/** The ability that first unlocks on reaching this Apprentice chapter (0-based), if any. */
export function abilityUnlockedAt(chapter: number): AbilityId | null {
  return ABILITIES.find((id) => GAME_CONFIG.abilities[id].fromChapter === chapter) ?? null;
}

/** Correct keys in a row that earn one charge on this chapter (0-based). */
export function chargeKeys(chapter: number): number {
  const c = GAME_CONFIG.abilities.chargeKeys;
  return Math.min(c.max, c.base + c.perChapter * chapter);
}

/** Correct keys in a row that re-arm the Eraser on this chapter (0-based). */
export function eraserKeys(chapter: number): number {
  const e = GAME_CONFIG.abilities.eraser;
  return Math.min(e.maxKeys, e.keys + e.keysPerChapter * chapter);
}

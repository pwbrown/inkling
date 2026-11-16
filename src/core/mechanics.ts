/**
 * Mechanics the game teaches the first time they come up: a briefing card
 * before the page, then a guided first try (the new thing arrives alone and
 * slowed). What a page holds is read from the same settings the spawner uses,
 * so the tutorials can't drift from the rules.
 */
import { ABILITIES, abilityCost, isActive, type AbilityId } from './abilities';
import { GAME_CONFIG, mistakeInk } from './config';
import type { Target, World } from './world';

export type MechanicId =
  | 'basics'
  | 'space'
  | 'combo'
  | 'blotling'
  | 'mistakes'
  | 'recovery'
  | 'crimson'
  | 'ghost'
  | 'spill'
  | 'bookworm'
  | 'shuffler'
  | 'squid'
  | 'quill'
  | 'runon'
  | 'violet'
  | AbilityId;

/** In teaching order: when several are new at once, the earlier ones are shown first. */
export const MECHANICS: readonly MechanicId[] = [
  'basics',
  // The ␣ glyph isn't obvious: explained the first time a page can show it.
  'space',
  'blotling',
  'combo',
  'mistakes',
  'recovery',
  'crimson',
  'spill',
  'bookworm',
  'shuffler',
  'squid',
  'quill',
  'ghost',
  'runon',
  'violet',
  ...ABILITIES,
];

export function isMechanic(value: unknown): value is MechanicId {
  return (MECHANICS as readonly unknown[]).includes(value);
}

/** New things explained before one page, at most. The rest wait for the next page. */
export const MAX_BRIEFINGS = 2;

/** What mechanicsForPage reads from the world. `keys` is optional so callers that only care about creatures can skip it. */
type PageWorld = Pick<World, 'page' | 'mode' | 'difficulty' | 'abilities'> & Partial<Pick<World, 'keys'>>;

/** Everything that can come up on the page about to be played. */
export function mechanicsForPage(world: PageWorld): MechanicId[] {
  const { page, mode, difficulty, abilities } = world;
  const hasSpace = world.keys?.includes(' ') ?? false;
  const { kind, variants, sprinkles } = page.params;
  const word = kind === 'blotling';
  const plain = kind === 'drip' || kind === 'blotling';
  const has: Record<MechanicId, boolean> = {
    basics: true,
    // A drip showing ␣, or a Run-on phrase with spaces in it.
    space: hasSpace && ((kind === 'drip' && page.params.pool !== 'symbols') || kind === 'runon' || sprinkles.runon > 0),
    blotling: word,
    // A run of keys only matters once there's a page behind you.
    combo: page.index > 0 || page.chapter > 0,
    mistakes: mistakeInk(difficulty, page.chapter, mode === 'apprentice') > 0,
    recovery: page.index > 0 || page.chapter > 0,
    crimson: plain && variants.crimson > 0,
    violet: plain && variants.violet > 0,
    ghost: plain && variants.ghost > 0,
    spill: page.bossKind === 'spill',
    bookworm: page.bossKind === 'bookworm',
    shuffler: page.bossKind === 'shuffler',
    squid: page.bossKind === 'squid',
    quill: page.bossKind === 'quill',
    runon: kind === 'runon' || sprinkles.runon > 0,
    blotter: abilities.includes('blotter'),
    eraser: abilities.includes('eraser'),
    paperweight: abilities.includes('paperweight'),
    highlighter: abilities.includes('highlighter'),
    blottingPaper: abilities.includes('blottingPaper'),
  };
  return MECHANICS.filter((id) => has[id]);
}

/** Mechanics on this page the player hasn't been shown yet, a few at a time. */
export function pendingBriefings(
  world: PageWorld,
  seen: readonly string[],
  max = MAX_BRIEFINGS,
): MechanicId[] {
  return mechanicsForPage(world)
    .filter((id) => !seen.includes(id))
    .slice(0, max);
}

/** How the first creature of a newly taught kind is spawned for its guided try, or null if there's nothing to spawn. */
export function guidedSpawn(id: MechanicId): Partial<Target> | null {
  switch (id) {
    case 'space':
      return { kind: 'drip', text: ' ', lives: 1, ghost: false };
    case 'blotling':
      return { kind: 'blotling', lives: 1, ghost: false };
    case 'crimson':
      return { lives: 2, maxLives: 2, ghost: false };
    case 'violet':
      return { lives: 3, maxLives: 3, ghost: false };
    case 'ghost':
      return { lives: 1, ghost: true };
    case 'runon':
      return { kind: 'runon', lives: 1, ghost: false };
    default:
      return null;
  }
}

/**
 * Set a page up to teach what was just explained: the first new creature gets
 * a guided try, and each new ability is handed over ready to use once.
 */
export function applyBriefings(world: World, ids: readonly MechanicId[]): void {
  const creature = ids.find((id) => guidedSpawn(id) !== null);
  world.guide = creature ? { id: creature, targetId: null, spawned: false } : null;
  for (const id of ids) {
    if (id === 'eraser') world.eraser = true;
    else if (id === 'blottingPaper') world.shield = true;
    else if ((ABILITIES as readonly string[]).includes(id) && isActive(id as AbilityId)) {
      const cost = abilityCost(id as 'blotter' | 'paperweight' | 'highlighter', world.difficulty);
      world.charges = Math.min(GAME_CONFIG.abilities.maxCharges, Math.max(world.charges, cost));
    }
  }
}

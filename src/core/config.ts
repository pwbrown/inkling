/**
 * Tunable gameplay numbers. All in one place so balancing never means hunting
 * through logic (REQUIREMENTS §4).
 *
 * Difficulty model:
 *
 *   value = base[kind] × difficulty multiplier
 *             × (1 + chapterStep × chapter) × (1 + pageStep × page)
 *   then clamped to that kind's limits.
 *
 * - Campaign difficulty is chosen when starting a notebook.
 * - Chapters (levels) and pages (waves) each nudge things up a little.
 */

/**
 * Keys a brand-new player starts with: the home row, the usual first lesson
 * (DESIGN §4). Matches the "Home row" preset in keySelection.ts.
 */
export const DEFAULT_KEYS: readonly string[] = [...'asdfghjkl;'];

/**
 * Target types (REQUIREMENTS §3): drips (one character), Blotlings (a word),
 * Run-ons (a phrase, fixed with Backspace) and Misprints (a misspelled word,
 * fixed with the arrow keys, Backspace and Delete).
 */
export type TargetKind = 'drip' | 'blotling' | 'runon' | 'misprint';

export const TARGET_KINDS: readonly TargetKind[] = ['drip', 'blotling', 'runon', 'misprint'];

export type Difficulty = 'relaxed' | 'normal' | 'hard' | 'expert';

/** In menu order. */
export const DIFFICULTIES: readonly Difficulty[] = ['relaxed', 'normal', 'hard', 'expert'];

export const DEFAULT_DIFFICULTY: Difficulty = 'normal';

export interface DifficultyProfile {
  /** Multiplies target speed. */
  speed: number;
  /** Multiplies time between spawns (above 1 means slower spawning). */
  spawnInterval: number;
  /** Added to the most targets allowed on screen. */
  maxOnScreen: number;
  /** Added to word complexity (0..1 scale). */
  complexity: number;
  /** Multiplies ink lost per margin hit. */
  inkLoss: number;
  /** Multiplies the chance of tougher variants (crimson, violet, ghost). */
  variants: number;
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  relaxed: { speed: 0.75, spawnInterval: 1.3, maxOnScreen: -1, complexity: -0.1, inkLoss: 0.5, variants: 0.5 },
  normal: { speed: 1, spawnInterval: 1, maxOnScreen: 0, complexity: 0, inkLoss: 1, variants: 1 },
  hard: { speed: 1.2, spawnInterval: 0.85, maxOnScreen: 1, complexity: 0.1, inkLoss: 1.2, variants: 1.25 },
  expert: { speed: 1.35, spawnInterval: 0.75, maxOnScreen: 1, complexity: 0.2, inkLoss: 1.4, variants: 1.5 },
};

interface KindSettings {
  /** Targets per page. */
  size: number;
  /** Time between spawns, in ms. */
  spawnIntervalMs: number;
  /** Most targets on screen at once. */
  maxOnScreen: number;
  /** Speed in logical px per second. */
  speed: number;
  /** Ink lost when one reaches the margin. */
  inkLoss: number;
}

interface KindLimits {
  maxSize: number;
  minSpawnIntervalMs: number;
  maxOnScreen: number;
  maxSpeed: number;
}

export const GAME_CONFIG = {
  /** Size of the ink reservoir (the player's health). */
  maxInk: 100,
  /** Ink refilled when a chapter is completed, as a fraction of maxInk. */
  chapterInkRefill: 0.3,

  points: {
    /** Per correct character, before the combo multiplier. */
    perChar: 10,
    /** Bonus for finishing a target, before the combo multiplier. */
    perTarget: 25,
  },
  combo: {
    /** Correct keys in a row needed to raise the multiplier by 1. */
    step: 10,
    maxMultiplier: 4,
  },

  /** Page 1 of chapter 1 on Normal, per target type. */
  base: {
    drip: { size: 20, spawnIntervalMs: 1300, maxOnScreen: 6, speed: 85, inkLoss: 10 },
    blotling: { size: 12, spawnIntervalMs: 2600, maxOnScreen: 4, speed: 55, inkLoss: 20 },
    runon: { size: 4, spawnIntervalMs: 7500, maxOnScreen: 2, speed: 28, inkLoss: 25 },
    misprint: { size: 8, spawnIntervalMs: 4200, maxOnScreen: 3, speed: 36, inkLoss: 20 },
  } satisfies Record<TargetKind, KindSettings>,

  /** Hard limits so late chapters stay humanly possible. */
  limits: {
    drip: { maxSize: 36, minSpawnIntervalMs: 420, maxOnScreen: 10, maxSpeed: 240 },
    blotling: { maxSize: 22, minSpawnIntervalMs: 1000, maxOnScreen: 7, maxSpeed: 150 },
    runon: { maxSize: 7, minSpawnIntervalMs: 4500, maxOnScreen: 3, maxSpeed: 55 },
    misprint: { maxSize: 14, minSpawnIntervalMs: 2200, maxOnScreen: 5, maxSpeed: 80 },
  } satisfies Record<TargetKind, KindLimits>,

  progression: {
    /** Growth per chapter (level) for speed and spawn rate. */
    chapterStep: 0.12,
    /** Growth per page (wave) within a chapter. */
    pageStep: 0.04,
    /** Extra targets per page, per chapter (as a fraction of the base size). */
    sizeStep: 0.1,
    /** One more target allowed on screen every this many chapters. */
    chaptersPerExtraOnScreen: 2,
    /** Word complexity (0..1): start, per chapter, per page. */
    complexityStart: 0.15,
    complexityPerChapter: 0.12,
    complexityPerPage: 0.03,
  },

  /**
   * Page types in each chapter. Pages are drips or Blotlings; later on,
   * Run-ons and Misprints are sprinkled into Blotling pages (`sprinkles`).
   * Chapters past the end of this list reuse the last entry.
   */
  chapters: [
    ['drip', 'drip', 'blotling'],
    ['drip', 'blotling', 'drip', 'blotling'],
    ['blotling', 'drip', 'blotling', 'drip', 'blotling'],
    ['drip', 'blotling', 'drip', 'blotling'],
    ['drip', 'blotling', 'blotling', 'drip', 'blotling'],
  ] as TargetKind[][],

  /**
   * Occasional Run-ons and Misprints on Blotling pages, for variety without
   * whole pages of them. Chance per spawn: `start` from chapter `fromChapter`
   * (Practice) or `fromApprenticeChapter` (Apprentice, both 0-based), plus
   * `perChapter` after that (Apprentice chapters count `apprentice.pace` each),
   * capped at `max`.
   */
  sprinkles: {
    pageKinds: ['blotling'] as TargetKind[],
    runon: { fromChapter: 3, fromApprenticeChapter: 10, start: 0.1, perChapter: 0.03, max: 0.2 },
    misprint: { fromChapter: 4, fromApprenticeChapter: 15, start: 0.1, perChapter: 0.03, max: 0.2 },
    /** Most sprinkled targets on one page, and on screen at once. */
    maxPerPage: 3,
    maxOnScreen: 1,
  },

  /**
   * Drip pages never have more drips on screen than the player has keys
   * (minus `keysMinus`), so the first keystroke always says which drip you mean.
   */
  dripsPerKeys: { keysMinus: 1, min: 2 },

  /** Run-on phrases: how many words, growing with complexity. */
  phraseWords: {
    min: 2,
    max: 3,
    /** Word complexity at which phrases get their third word. */
    longAt: 0.7,
    /** Longest word allowed in a phrase. */
    maxWordLength: 6,
  },
  /** Shortest word worth misprinting. */
  misprintMinLength: 4,

  /** When a key counts as practiced or mastered (DESIGN §4). */
  mastery: {
    /** Correct presses before a key is "practicing" rather than "unfamiliar". */
    practicingHits: 10,
    /** Correct presses needed for "mastered"… */
    masteredHits: 50,
    /** …at this accuracy or better. */
    masteredAccuracy: 0.94,
    /** Suggest new keys once this share of the selected keys is mastered. */
    suggestWhenMastered: 0.75,
    /** How many new keys to suggest at a time. */
    suggestCount: 2,
  },

  /** Page grades by accuracy, best first. Each leak lowers it (see grade.ts). */
  grades: [
    { grade: 'A', minAccuracy: 0.95 },
    { grade: 'B', minAccuracy: 0.9 },
    { grade: 'C', minAccuracy: 0.8 },
    { grade: 'D', minAccuracy: 0.7 },
    { grade: 'F', minAccuracy: 0 },
  ],

  /**
   * Tougher variants (Typer Shark style, in ink colors): crimson creatures
   * need 2 completions in a row, violet ones 3, and ghosts (invisible ink)
   * hide their text until `revealAt` of the way across the page.
   * Chances are per spawn: `start` from chapter `fromChapter` (0-based),
   * plus `perChapter` after that, capped at `max`, then scaled by difficulty.
   */
  variants: {
    kinds: ['drip', 'blotling'] as TargetKind[],
    crimson: { fromChapter: 1, start: 0.1, perChapter: 0.04, max: 0.3 },
    violet: { fromChapter: 4, start: 0.05, perChapter: 0.03, max: 0.18 },
    /**
     * Word complexity is multiplied by this for creatures that start with
     * 2 or 3 lives: they need several words, so each one is shorter.
     */
    complexityScale: { 2: 0.6, 3: 0.4 } as Record<number, number>,
    ghost: { fromChapter: 2, start: 0.08, perChapter: 0.03, max: 0.25 },
    /**
     * Ghost text appears once the creature crosses a point this far from the
     * left edge (fraction of page width), picked at random per ghost.
     */
    revealAt: { min: 0.25, max: 0.5 },
  },

  /**
   * The Blotter: a power charged by long runs of correct keys. Press Enter
   * while playing to blot every creature on the page (except a boss) for a
   * share of their points.
   */
  blotter: { comboPerCharge: 25, maxCharges: 2, pointsShare: 0.5 },

  /**
   * The Spill: a boss on the last page of every Apprentice chapter. A big,
   * slow Blotling with three lives and longer words, which splits into small
   * Blotlings when finally blotted.
   */
  boss: {
    lives: 3,
    speedFactor: 0.6,
    complexityBonus: 0.3,
    inkLossFactor: 2,
    splits: 3,
    splitSpeedFactor: 1.4,
    /** First Apprentice chapter (0-based) whose last page has the Spill. */
    fromApprenticeChapter: 6,
  },

  /**
   * Apprentice pacing. `pace` scales chapters into the difficulty curve
   * (0.25 = four Apprentice chapters per step). The first `easeChapters`
   * chapters are gentler still, easing off gradually.
   */
  apprentice: {
    pace: 0.25,
    easeChapters: 8,
    /** At chapter 1: 35% slower, 50% longer between spawns, 3 fewer on screen, 30% shorter pages. */
    easeSpeed: 0.35,
    easeInterval: 0.5,
    easeOnScreen: 3,
    easeSize: 0.3,
    /**
     * Hard and Expert ease in too: over the first `profileEaseChapters`
     * chapters, page settings blend from Normal toward the chosen difficulty,
     * starting `profileEaseFloor` of the way there.
     */
    profileEaseChapters: 10,
    profileEaseFloor: 0.35,
  },

  /** Each target's speed varies randomly by up to ±this fraction. */
  speedJitter: 0.15,
  /** Empty space to keep behind the last target in a lane before spawning another. */
  laneGapPx: 100,
};

/** Page types for chapter `chapter` (0-based). */
export function chapterPlan(chapter: number): readonly TargetKind[] {
  const chapters = GAME_CONFIG.chapters;
  return chapters[Math.min(chapter, chapters.length - 1)] ?? ['drip'];
}

export interface PageParams {
  kind: TargetKind;
  size: number;
  spawnIntervalMs: number;
  maxOnScreen: number;
  speed: number;
  /** Word difficulty, 0 (easiest) to 1 (hardest). */
  complexity: number;
  inkLoss: number;
  /** Chance per spawn of each tougher variant. */
  variants: VariantChances;
  /** Chance per spawn of a sprinkled Run-on or Misprint (see GAME_CONFIG.sprinkles). */
  sprinkles: SprinkleChances;
}

export interface SprinkleChances {
  runon: number;
  misprint: number;
}

type SprinkleSettings = { fromChapter: number; fromApprenticeChapter: number; start: number; perChapter: number; max: number };

/**
 * Chances of a sprinkled Run-on or Misprint on a page of type `kind`.
 * `apprentice`: count from the Apprentice start chapters, at Apprentice pace.
 */
export function sprinkleChances(
  kind: TargetKind,
  chapter: number,
  apprentice = false,
  canUse: (kind: TargetKind) => boolean = () => true,
): SprinkleChances {
  const s = GAME_CONFIG.sprinkles;
  if (!s.pageKinds.includes(kind)) return { runon: 0, misprint: 0 };
  const chance = (c: SprinkleSettings, sprinkled: TargetKind) => {
    const from = apprentice ? c.fromApprenticeChapter : c.fromChapter;
    if (chapter < from || !canUse(sprinkled)) return 0;
    const steps = (chapter - from) * (apprentice ? GAME_CONFIG.apprentice.pace : 1);
    return Math.min(c.max, c.start + c.perChapter * steps);
  };
  return { runon: chance(s.runon, 'runon'), misprint: chance(s.misprint, 'misprint') };
}

export interface VariantChances {
  /** Needs 2 completions in a row. */
  crimson: number;
  /** Needs 3 completions in a row. */
  violet: number;
  /** Text hidden until partway across (independent of the other two). */
  ghost: number;
}

/** Variant chances for a target type, chapter and difficulty. */
export function variantChances(kind: TargetKind, chapter: number, difficulty: Difficulty): VariantChances {
  const v = GAME_CONFIG.variants;
  if (!v.kinds.includes(kind)) return { crimson: 0, violet: 0, ghost: 0 };
  const scale = DIFFICULTY_PROFILES[difficulty].variants;
  const chance = (c: { fromChapter: number; start: number; perChapter: number; max: number }) =>
    chapter < c.fromChapter ? 0 : Math.min(c.max, c.start + c.perChapter * (chapter - c.fromChapter)) * scale;
  return { crimson: chance(v.crimson), violet: chance(v.violet), ghost: chance(v.ghost) };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Settings for page `page` of chapter `chapter` (both 0-based). `canUse`
 * says whether the player's keys can produce a target type (e.g. Run-ons
 * need the space key); unusable pages become Blotling pages.
 */
export function pageParams(
  difficulty: Difficulty,
  chapter: number,
  page: number,
  canUse: (kind: TargetKind) => boolean = () => true,
  /** Page types for this chapter (the Apprentice campaign has its own). */
  plan: readonly TargetKind[] = chapterPlan(chapter),
): PageParams {
  const planned = plan[page % plan.length] ?? 'drip';
  const kind = canUse(planned) ? planned : 'blotling';
  const base = GAME_CONFIG.base[kind];
  const limits = GAME_CONFIG.limits[kind];
  const profile = DIFFICULTY_PROFILES[difficulty];
  const p = GAME_CONFIG.progression;

  const growth = (1 + p.chapterStep * chapter) * (1 + p.pageStep * page);

  return {
    kind,
    size: Math.round(clamp(base.size * (1 + p.sizeStep * chapter), 1, limits.maxSize)),
    spawnIntervalMs: clamp((base.spawnIntervalMs * profile.spawnInterval) / growth, limits.minSpawnIntervalMs, Infinity),
    maxOnScreen: clamp(
      base.maxOnScreen + profile.maxOnScreen + Math.floor(chapter / p.chaptersPerExtraOnScreen),
      1,
      limits.maxOnScreen,
    ),
    speed: clamp(base.speed * profile.speed * growth, 1, limits.maxSpeed),
    complexity: clamp(
      p.complexityStart + profile.complexity + p.complexityPerChapter * chapter + p.complexityPerPage * page,
      0,
      1,
    ),
    inkLoss: Math.round(base.inkLoss * profile.inkLoss),
    variants: variantChances(kind, chapter, difficulty),
    sprinkles: sprinkleChances(kind, chapter, false, canUse),
  };
}

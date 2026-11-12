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

export type TargetKind = 'drip' | 'blotling';

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
}

export const DIFFICULTY_PROFILES: Record<Difficulty, DifficultyProfile> = {
  relaxed: { speed: 0.75, spawnInterval: 1.3, maxOnScreen: -1, complexity: -0.1, inkLoss: 0.5 },
  normal: { speed: 1, spawnInterval: 1, maxOnScreen: 0, complexity: 0, inkLoss: 1 },
  hard: { speed: 1.25, spawnInterval: 0.8, maxOnScreen: 1, complexity: 0.15, inkLoss: 1.25 },
  expert: { speed: 1.5, spawnInterval: 0.65, maxOnScreen: 2, complexity: 0.3, inkLoss: 1.5 },
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
  } satisfies Record<TargetKind, KindSettings>,

  /** Hard limits so late chapters stay humanly possible. */
  limits: {
    drip: { maxSize: 36, minSpawnIntervalMs: 420, maxOnScreen: 10, maxSpeed: 240 },
    blotling: { maxSize: 22, minSpawnIntervalMs: 1000, maxOnScreen: 7, maxSpeed: 150 },
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
   * Page types in each chapter (each page is a single type, REQUIREMENTS §2).
   * Chapters past the end of this list reuse the last entry.
   */
  chapters: [
    ['drip', 'drip', 'blotling'],
    ['drip', 'blotling', 'drip', 'blotling'],
    ['blotling', 'drip', 'blotling', 'drip', 'blotling'],
  ] as TargetKind[][],

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
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Settings for page `page` of chapter `chapter` (both 0-based). */
export function pageParams(difficulty: Difficulty, chapter: number, page: number): PageParams {
  const plan = chapterPlan(chapter);
  const kind = plan[page % plan.length] ?? 'drip';
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
  };
}

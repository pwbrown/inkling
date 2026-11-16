/**
 * Pure game state and simulation. No rendering or DOM code lives here, so it
 * can be unit tested directly (REQUIREMENTS §7).
 */
import { createContentSource, type ContentSource } from '../content/contentSource';
import type { KeyboardLayout } from '../content/layouts/types';
import { US_QWERTY } from '../content/layouts/us-qwerty';
import {
  apprenticeKeys,
  apprenticePlan,
  easeDifficulty,
  easeForBeginners,
  effectiveChapter,
  hasSpill,
  newKeysFor,
  type GameMode,
} from './campaign';
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_KEYS,
  DIFFICULTY_PROFILES,
  GAME_CONFIG,
  bottleParams,
  chapterPlan,
  pageParams,
  sprinkleChances,
  type Difficulty,
  type PageParams,
  type TargetKind,
} from './config';
import { ABILITIES, type AbilityId, type ActiveAbility } from './abilities';
import { guidedSpawn, pendingBriefings, type MechanicId } from './mechanics';
import { createStats, type Stats } from './stats';

/** Logical play-field size. The renderer scales this to fit the window. */
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

/** The red margin line the Nib defends (DESIGN §2). */
export const MARGIN_X = 140;

/** Ruled-line spacing on the page. Targets travel along these lines. */
export const LINE_SPACING = 48;
export const FIRST_LINE_Y = 120;

/** Targets spawn just off the right edge. */
export const SPAWN_X = WORLD_WIDTH + 80;

export interface Target {
  id: number;
  kind: TargetKind;
  text: string;
  /**
   * How many characters of `text` have been typed correctly. For Run-ons,
   * the length of the correct start of the buffer.
   */
  typed: number;
  /**
   * Buffer-mode targets (Run-ons) only: the text as currently
   * typed or edited. The target is done when it equals `text`.
   */
  buffer?: string;
  /** Buffer-mode targets only: cursor position in the buffer. */
  cursor?: number;
  /**
   * Completions still needed: 1 normally, 2 for crimson, 3 for violet. Each
   * completion but the last brings a fresh payload on the same creature.
   */
  lives: number;
  /** Invisible ink: the text stays hidden until the creature crosses `revealX`. */
  ghost: boolean;
  /** Ghosts only: the x at which the text appears (see GAME_CONFIG.variants.revealAt). */
  revealX?: number;
  /** Lives the creature started with (when more than 1), which keeps its words short. */
  maxLives?: number;
  /** The Spill: a chapter's boss. */
  boss?: boolean;
  /** An ink bottle: typing it restores ink, and it costs nothing if it gets away. */
  bottle?: boolean;
  /** Current position (left edge of the target body). */
  x: number;
  y: number;
  lane: number;
  /** Position at the previous step, for render interpolation. */
  prevX: number;
  /** Horizontal speed in logical pixels per second. */
  speed: number;
  /** Still rushing in from the right edge (GAME_CONFIG.entry); cleared once fully on the page. */
  entering?: boolean;
}

/**
 * - ready: on the menus. intro: an Apprentice chapter's "new keys" card.
 * - briefing: a card explaining mechanics that are new on the page about to start.
 * - notebookComplete: the last Apprentice chapter is done.
 */
export type GamePhase = 'ready' | 'intro' | 'briefing' | 'playing' | 'paused' | 'pageCleared' | 'gameOver' | 'notebookComplete';

/** Things that happened this frame, for the renderer to animate. */
export type GameEvent =
  | { type: 'locked'; targetId: number }
  /** The locked target changed. `shot`: a correct character landed on it. */
  | { type: 'progress'; targetId: number; shot: boolean }
  /** A target was finished. `blotted`: by the Blotter rather than by typing. */
  | { type: 'destroyed'; target: Target; points: number; blotted?: boolean }
  /** A crimson or violet creature lost a life and got a new payload. */
  | { type: 'hit'; target: Target; points: number }
  /** The Spill (boss) appeared. */
  | { type: 'boss'; target: Target }
  /** The Spill was blotted and split into smaller creatures. */
  | { type: 'split'; target: Target }
  /** A clean run of keys earned an ability charge. */
  | { type: 'charged'; charges: number }
  /** An active ability was fired. */
  | { type: 'ability'; id: ActiveAbility }
  /** A timed ability (Paperweight, Highlighter) wore off. */
  | { type: 'abilityEnded'; id: ActiveAbility }
  /** A passive ability is ready: the Eraser re-armed, or Blotting paper was earned. */
  | { type: 'passiveReady'; id: 'eraser' | 'blottingPaper' }
  /** A newly taught creature arrived for its guided first try. */
  | { type: 'guide'; id: MechanicId; target: Target }
  /** The Eraser forgave a wrong key. */
  | { type: 'eraserUsed'; key: string; targetId: number | null }
  /** Blotting paper soaked up a creature at the margin. */
  | { type: 'shieldUsed'; target: Target }
  | { type: 'marginHit'; target: Target; inkLost: number }
  /** A wrong key, and what it cost. */
  | { type: 'error'; key: string; targetId: number | null; pointsLost: number; inkLost: number }
  /** Ink came back: from a clean run of keys, or from an ink bottle. */
  | { type: 'inkRestored'; amount: number; source: 'streak' | 'bottle'; target?: Target }
  /** An ink bottle got away. */
  | { type: 'bottleMissed'; target: Target }
  /** The score multiplier went up a step. */
  | { type: 'comboStep'; multiplier: number }
  /** A run long enough to have raised the multiplier was broken. `was`: its length. */
  | { type: 'comboBroken'; was: number }
  | { type: 'phase'; phase: GamePhase }
  /** The page was restarted or abandoned: clear effects and stains. */
  | { type: 'reset' };

/** Ink and notebook stats as they were when a page or chapter began. */
export interface StartSnapshot {
  /** Page (within the chapter) the snapshot was taken at. */
  pageIndex: number;
  ink: number;
  stats: Stats;
  /** Ability charges and held passives at that moment. */
  charges: number;
  eraser: boolean;
  shield: boolean;
}

export interface PageState {
  /** 0-based chapter (level) index. */
  chapter: number;
  /** 0-based page (wave) index within the chapter. */
  index: number;
  /** Pages in this chapter. */
  pageCount: number;
  /** This page has a Spill (boss) to spawn: the last page of an Apprentice chapter. */
  hasBoss: boolean;
  bossSpawned: boolean;
  params: PageParams;
  spawned: number;
  /** Run-ons sprinkled into this page so far. */
  sprinkled: number;
  /** An ink bottle has crossed this page (at most one per page). */
  bottleSpawned: boolean;
  /** Counts down to the next spawn. */
  spawnTimerMs: number;
}

export interface World {
  /**
   * 'ready' is the new-notebook screen, where difficulty is chosen.
   */
  phase: GamePhase;
  /** Campaign difficulty of the notebook being played. */
  difficulty: Difficulty;
  /** Highlighted option on the new-notebook screen. */
  selectedDifficulty: Difficulty;
  /** Phase to return to when unpausing. */
  resumePhase: GamePhase;
  page: PageState;
  targets: Target[];
  /** Target receiving keystrokes, if any. */
  lockedId: number | null;
  ink: number;
  maxInk: number;
  /** Ink refilled for the chapter just completed (shown on the overlay). */
  inkRefilled: number;
  /** Stats for the whole notebook (campaign). */
  stats: Stats;
  /** Stats for the current page only. */
  pageStats: Stats;
  /** Taken when the current page began, for "Restart page". */
  pageStart: StartSnapshot;
  /** Taken when the current chapter began, for "Retry chapter". */
  chapterStart: StartSnapshot;
  /** Drained by the renderer each frame. */
  events: GameEvent[];
  /** Characters to build targets from (the player's Type Case). */
  keys: readonly string[];
  /** Supplies drip characters and Scrawler words for those keys. */
  content: ContentSource;
  /** Apprentice (the course) or Practice (free key choice, endless). */
  mode: GameMode;
  /** The player's keyboard layout: which keys the Apprentice teaches, and where they are. */
  layout: KeyboardLayout;
  /**
   * Builds content for a key set, with `focus` keys appearing more often.
   * The Apprentice campaign uses it to switch keys between chapters.
   */
  makeContent: (keys: readonly string[], focus: readonly string[]) => ContentSource;
  /** Show a briefing before a page that has something new (off unless the app turns it on). */
  tips: boolean;
  /** Mechanics this player has already been shown. */
  seenMechanics: readonly string[];
  /** While in the briefing phase: what the card explains. */
  briefing: MechanicId[];
  /**
   * Guided first try: the newly taught creature is sent alone and slowed, and
   * nothing else spawns until it has been dealt with.
   */
  guide: { id: MechanicId; targetId: number | null; spawned: boolean } | null;
  /** Correct keys since the last mistake, leak or streak refill (GAME_CONFIG.recovery.streak). */
  cleanRun: number;
  /** Abilities this player has unlocked (see abilities.ts). Everything, unless the app says otherwise. */
  abilities: readonly AbilityId[];
  /** Ability charges ready to spend (GAME_CONFIG.abilities). */
  charges: number;
  /** Correct keys in a row toward the next charge. */
  chargeRun: number;
  /** The Eraser is armed: the next wrong key is forgiven. */
  eraser: boolean;
  /** Correct keys in a row toward re-arming the Eraser. */
  eraserRun: number;
  /** Time left after the Eraser was used in which wrong keys are quietly ignored (ms). */
  eraserGraceMs: number;
  /** Blotting paper is held: the next creature to reach the margin is soaked up. */
  shield: boolean;
  /** Blotting paper was earned on the page just cleared (shown on the graded page). */
  shieldEarned: boolean;
  /** Time left on the Paperweight (creatures crawl) and the Highlighter (ghosts shown, double points). */
  slowMs: number;
  highlightMs: number;
  /** Use every `laneStep`-th ruled line (2 for large text). */
  laneStep: number;
  /** Size of targets on screen, for spacing them (matches the text-size setting). */
  targetScale: number;
  nextId: number;
  /** Injected so tests are deterministic. Returns [0, 1). */
  random: () => number;
}

/**
 * Ruled lines that targets can travel on. With `step` 2, only every other
 * line is used, leaving room for larger text (REQUIREMENTS §10).
 */
export function laneCount(step = 1): number {
  return Math.floor((WORLD_HEIGHT - FIRST_LINE_Y - LINE_SPACING) / (LINE_SPACING * step));
}

export function laneY(lane: number, step = 1): number {
  return FIRST_LINE_Y + lane * LINE_SPACING * step;
}

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pick() from empty list');
  return item;
}

export function createPage(
  difficulty: Difficulty,
  chapter: number,
  index: number,
  content?: Pick<ContentSource, 'supports'> & Partial<Pick<ContentSource, 'keys' | 'poolSize'>>,
  mode: GameMode = 'practice',
): PageState {
  const apprentice = mode === 'apprentice';
  // Digits and symbols get their own Free Write pages when there are enough
  // of them (GAME_CONFIG.symbolPages); otherwise drips use every key.
  const separate =
    !apprentice &&
    content?.poolSize !== undefined &&
    content.poolSize('letters') > 0 &&
    content.poolSize('symbols') >= GAME_CONFIG.symbolPages.minKeys;
  const fullPlan = apprentice ? apprenticePlan(chapter) : chapterPlan(chapter);
  const plan = separate ? fullPlan : fullPlan.filter((kind) => kind !== 'symbols');
  const canUse = content ? (kind: TargetKind) => content.supports(kind) : undefined;
  let params: PageParams;
  if (apprentice) {
    // The Apprentice climbs a gentler curve, with extra easing for beginners,
    // and harder difficulties blend in over the first chapters.
    const eff = effectiveChapter(chapter);
    let raw = pageParams(difficulty, eff, index, canUse, plan);
    if (DIFFICULTY_PROFILES[difficulty].speed > 1) raw = easeDifficulty(raw, pageParams('normal', eff, index, canUse, plan), chapter);
    params = { ...easeForBeginners(raw, chapter), sprinkles: sprinkleChances(raw.kind, chapter, true, canUse) };
  } else {
    params = pageParams(difficulty, chapter, index, canUse, plan);
  }
  if (!separate) params.pool = 'all';
  // Never more targets than keys to tell them apart by their first letter.
  const keyCount = params.pool === 'all' ? content?.keys?.length : content?.poolSize?.(params.pool);
  if ((params.kind === 'drip' || params.kind === 'blotling') && keyCount) {
    const { keysMinus, min } = GAME_CONFIG.targetsPerKeys;
    params.maxOnScreen = Math.min(params.maxOnScreen, Math.max(min, keyCount - keysMinus));
  }
  return {
    chapter,
    index,
    pageCount: plan.length,
    hasBoss: apprentice && index === plan.length - 1 && hasSpill(chapter),
    bossSpawned: false,
    params,
    spawned: 0,
    sprinkled: 0,
    bottleSpawned: false,
    // Spawn the first target right away.
    spawnTimerMs: 0,
  };
}

/** True on the last page of a chapter. */
export function isLastPageOfChapter(page: PageState): boolean {
  return page.index >= page.pageCount - 1;
}

export interface WorldOptions {
  random?: () => number;
  /** Ignored when `content` is given (its keys are used). */
  keys?: readonly string[];
  content?: ContentSource;
  difficulty?: Difficulty;
  makeContent?: (keys: readonly string[], focus: readonly string[]) => ContentSource;
  /** Abilities unlocked (default: all of them). */
  abilities?: readonly AbilityId[];
  /** The player's keyboard layout (default US QWERTY). */
  layout?: KeyboardLayout;
}

export function createWorld(options: WorldOptions = {}): World {
  const content = options.content ?? createContentSource({ keys: options.keys ?? DEFAULT_KEYS });
  const difficulty = options.difficulty ?? DEFAULT_DIFFICULTY;
  return {
    phase: 'ready',
    difficulty,
    selectedDifficulty: difficulty,
    resumePhase: 'ready',
    page: createPage(difficulty, 0, 0, content),
    targets: [],
    lockedId: null,
    ink: GAME_CONFIG.maxInk,
    maxInk: GAME_CONFIG.maxInk,
    inkRefilled: 0,
    stats: createStats(),
    pageStats: createStats(),
    pageStart: { pageIndex: 0, ink: GAME_CONFIG.maxInk, stats: createStats(), charges: 0, eraser: false, shield: false },
    chapterStart: { pageIndex: 0, ink: GAME_CONFIG.maxInk, stats: createStats(), charges: 0, eraser: false, shield: false },
    events: [],
    keys: content.keys,
    content,
    mode: 'practice',
    layout: options.layout ?? US_QWERTY,
    makeContent: options.makeContent ?? ((keys) => createContentSource({ keys })),
    tips: false,
    seenMechanics: [],
    briefing: [],
    guide: null,
    cleanRun: 0,
    abilities: options.abilities ?? ABILITIES,
    charges: 0,
    chargeRun: 0,
    eraser: false,
    eraserRun: 0,
    eraserGraceMs: 0,
    shield: false,
    shieldEarned: false,
    slowMs: 0,
    highlightMs: 0,
    laneStep: 1,
    targetScale: 1,
    nextId: 1,
    random: options.random ?? Math.random,
  };
}

/** Load the keys for an Apprentice chapter, its new keys weighted up. */
export function useApprenticeKeys(world: World, chapter: number): void {
  world.content = world.makeContent(apprenticeKeys(world.layout, chapter), newKeysFor(world.layout, chapter));
  world.keys = world.content.keys;
}

/**
 * Switch to a new key set (from the Type Case). Only allowed on the
 * new-notebook screen; the next notebook uses it.
 */
export function setContent(world: World, content: ContentSource): void {
  if (world.phase !== 'ready') return;
  world.content = content;
  world.keys = content.keys;
}

/**
 * Remember how things stood as a page begins, so it can be restarted (and,
 * on a chapter's first page, so the chapter can be retried).
 */
export function markPageStart(world: World): void {
  const snapshot: StartSnapshot = {
    pageIndex: world.page.index,
    ink: world.ink,
    stats: structuredClone(world.stats),
    charges: world.charges,
    eraser: world.eraser,
    shield: world.shield,
  };
  world.pageStart = snapshot;
  if (world.page.index === 0) world.chapterStart = structuredClone(snapshot);
}

export function setPhase(world: World, phase: GamePhase): void {
  if (world.phase === phase) return;
  world.phase = phase;
  world.events.push({ type: 'phase', phase });
}

/**
 * Begin the page that's set up: first a briefing if it holds anything the
 * player hasn't been shown, otherwise straight into play.
 */
export function beginPage(world: World): void {
  world.guide = null;
  world.eraserGraceMs = 0;
  world.briefing = world.tips ? pendingBriefings(world, world.seenMechanics) : [];
  setPhase(world, world.briefing.length > 0 ? 'briefing' : 'playing');
}

/** Start a fresh notebook, keeping the same object (and its key set). */
export function resetWorld(world: World, difficulty: Difficulty = world.difficulty): void {
  const fresh = createWorld({
    random: world.random,
    content: world.content,
    difficulty,
    makeContent: world.makeContent,
    abilities: world.abilities,
    layout: world.layout,
  });
  fresh.nextId = world.nextId;
  fresh.mode = world.mode;
  fresh.laneStep = world.laneStep;
  fresh.targetScale = world.targetScale;
  fresh.tips = world.tips;
  fresh.seenMechanics = world.seenMechanics;
  Object.assign(world, fresh);
}

/**
 * Rough on-page width of a target, for spacing. Matches the renderer's
 * shapes closely enough without depending on font measurement.
 */
export function estimateWidth(target: Pick<Target, 'kind' | 'text' | 'buffer'>, scale = 1): number {
  if (target.kind === 'drip') return 58 * scale;
  const length = Math.max([...target.text].length, [...(target.buffer ?? '')].length);
  return (36 + 17 * length) * scale;
}

/**
 * One step of a target rushing in (GAME_CONFIG.entry): fast while far from
 * where its whole text shows, braking smoothly as it gets there, and never
 * closer than `gapPx` behind the target ahead in its lane (it follows that
 * one in if there isn't room yet). The Paperweight doesn't slow this part.
 */
function enter(world: World, target: Target, dt: number): void {
  const { speed, brakePerSec, marginPx, gapPx } = GAME_CONFIG.entry;
  const visibleX = WORLD_WIDTH - marginPx - estimateWidth(target, world.targetScale);
  if (target.x <= visibleX + 0.5) {
    target.entering = false;
    target.x -= target.speed * dt;
    return;
  }
  let leaderX = -Infinity;
  for (const other of world.targets) {
    if (other === target || other.lane !== target.lane || other.x >= target.x) continue;
    leaderX = Math.max(leaderX, other.x + estimateWidth(other, world.targetScale) + gapPx);
  }
  const goal = Math.max(visibleX, leaderX);
  const v = Math.min(speed, Math.max(target.speed, (target.x - goal) * brakePerSec));
  target.x = Math.min(target.x, Math.max(goal, target.x - v * dt));
}

/** Lanes whose most recent target has moved far enough in to make room. */
function freeLanes(world: World): number[] {
  const busy = new Set(
    world.targets
      .filter((t) => t.x + estimateWidth(t, world.targetScale) > SPAWN_X - GAME_CONFIG.laneGapPx)
      .map((t) => t.lane),
  );
  const lanes: number[] = [];
  for (let lane = 0; lane < laneCount(world.laneStep); lane++) if (!busy.has(lane)) lanes.push(lane);
  return lanes;
}

/** Ghost text shows once the creature crosses an x somewhere in this range. */
export const GHOST_REVEAL_MIN_X = WORLD_WIDTH * GAME_CONFIG.variants.revealAt.min;
export const GHOST_REVEAL_MAX_X = WORLD_WIDTH * GAME_CONFIG.variants.revealAt.max;

/** A reveal point off the right edge: the ghost's text shows from the start. */
export const REVEALED_X = SPAWN_X + 10_000;

/** Where a ghost's text appears: `roll` in [0, 1) picks a point in the reveal range. */
export function ghostRevealX(roll: number): number {
  return GHOST_REVEAL_MIN_X + (GHOST_REVEAL_MAX_X - GHOST_REVEAL_MIN_X) * roll;
}

/** Where this target's text appears (ghosts without a rolled point use the far end of the range). */
export function revealXOf(target: Pick<Target, 'revealX'>): number {
  return target.revealX ?? GHOST_REVEAL_MAX_X;
}

/** Whether the player can read (and so type) a target's text yet. */
export function isRevealed(target: Pick<Target, 'ghost' | 'x' | 'revealX'>): boolean {
  return !target.ghost || target.x < revealXOf(target);
}

/** Up to this many re-rolls to avoid two targets starting with the same character. */
const DISTINCT_FIRST_CHAR_TRIES = 6;

/** Whether a target type is edited as a buffer (rather than typed letter by letter). */
export function isBufferKind(kind: TargetKind): boolean {
  return kind === 'runon';
}

/**
 * Pick a payload, preferring one whose first character doesn't match any
 * target already on the page. That keeps targeting unambiguous: the first
 * keystroke picks exactly the target you meant.
 */
function payloadFor(world: World, kind: TargetKind, maxLives = 1): Pick<Target, 'text' | 'buffer' | 'cursor'> {
  // Creatures with several lives carry shorter words.
  const complexity = world.page.params.complexity * (GAME_CONFIG.variants.complexityScale[maxLives] ?? 1);
  const { content, random } = world;
  const taken = new Set(world.targets.map((t) => t.text[t.typed]));
  const next = () =>
    kind === 'drip'
      ? content.nextChar(random, world.page.params.pool)
      : kind === 'runon'
        ? content.nextPhrase(complexity, random)
        : content.nextWord(complexity, random);

  let text = next();
  for (let i = 1; i < DISTINCT_FIRST_CHAR_TRIES && taken.has(text[0]); i++) text = next();
  return kind === 'runon' ? { text, buffer: '', cursor: 0 } : { text };
}

/**
 * Add a target on a free lane. Returns null if every lane is still busy.
 * `overrides` is mainly for tests.
 */
export function spawnTarget(world: World, overrides: Partial<Target> = {}): Target | null {
  const lanes = freeLanes(world);
  if (lanes.length === 0 && overrides.lane === undefined) return null;

  const params = world.page.params;
  const sprinkle = overrides.kind === undefined ? sprinkleKind(world) : null;
  const kind = overrides.kind ?? sprinkle ?? params.kind;
  const sprinkled = sprinkle !== null;
  // A sprinkled Run-on moves at its own kind's pace.
  const speed = params.speed * (kind === params.kind ? 1 : GAME_CONFIG.base[kind].speed / GAME_CONFIG.base[params.kind].speed);
  const jitter = GAME_CONFIG.speedJitter;
  const lane = overrides.lane ?? pick(lanes, world.random);
  // Tougher variants (config.variants): roll lives, then ghost.
  const { crimson, violet, ghost } = sprinkled ? { crimson: 0, violet: 0, ghost: 0 } : params.variants;
  const roll = world.random();
  const lives = roll < violet ? 3 : roll < violet + crimson ? 2 : 1;
  const startLives = overrides.lives ?? lives;
  const isGhost = world.random() < ghost;
  // While the Highlighter is on, ghosts arrive already showing.
  const revealX = isGhost ? (world.highlightMs > 0 ? REVEALED_X : ghostRevealX(world.random())) : undefined;
  // Never faster than the target ahead in the same lane, so they can't overlap.
  const leaderSpeed = Math.min(...world.targets.filter((t) => t.lane === lane).map((t) => t.speed));
  const target: Target = {
    id: world.nextId++,
    kind,
    ...payloadFor(world, kind, startLives),
    typed: 0,
    x: SPAWN_X,
    prevX: SPAWN_X,
    y: laneY(lane, world.laneStep),
    lane,
    speed: Math.min(leaderSpeed, speed * (1 + (world.random() * 2 - 1) * jitter)),
    lives,
    ghost: isGhost,
    ...(revealX === undefined ? {} : { revealX }),
    ...(startLives > 1 ? { maxLives: startLives } : {}),
    // Targets placed somewhere specific (tests, set pieces) start already in place.
    ...(overrides.x === undefined ? { entering: true } : {}),
    ...overrides,
  };
  if (sprinkled) world.page.sprinkled++;
  world.targets.push(target);
  return target;
}

/**
 * Maybe sprinkle a Run-on into this page instead of its usual
 * type (GAME_CONFIG.sprinkles). Returns null for an ordinary spawn.
 */
function sprinkleKind(world: World): TargetKind | null {
  const { sprinkles } = world.page.params;
  if (sprinkles.runon <= 0) return null;
  const s = GAME_CONFIG.sprinkles;
  if (world.page.sprinkled >= s.maxPerPage) return null;
  if (world.targets.filter((t) => isBufferKind(t.kind)).length >= s.maxOnScreen) return null;
  return world.random() < sprinkles.runon ? 'runon' : null;
}

function updateSpawner(world: World, stepMs: number): void {
  const page = world.page;
  // The Spill arrives first on a boss page.
  if (page.hasBoss && !page.bossSpawned) {
    spawnBoss(world);
    page.spawnTimerMs = page.params.spawnIntervalMs * 2;
    return;
  }
  const { size, spawnIntervalMs, maxOnScreen } = page.params;
  // A guided first try: the new creature comes alone, and the page waits for it.
  const guide = world.guide;
  if (guide) {
    if (!guide.spawned) {
      const target = spawnTarget(world, { ...guidedSpawn(guide.id) });
      if (!target) return;
      target.speed *= GAME_CONFIG.guideSpeedFactor;
      guide.spawned = true;
      guide.targetId = target.id;
      page.spawned++;
      page.spawnTimerMs = spawnIntervalMs;
      world.events.push({ type: 'guide', id: guide.id, target });
      return;
    }
    if (world.targets.some((t) => t.id === guide.targetId)) return;
    world.guide = null;
  }
  page.spawnTimerMs -= stepMs;

  if (page.spawnTimerMs > 0 || page.spawned >= size || world.targets.length >= maxOnScreen) return;

  // If no lane is free, try again next step.
  if (spawnTarget(world)) {
    page.spawned++;
    page.spawnTimerMs = spawnIntervalMs;
    maybeSpawnBottle(world);
  }
}

/**
 * When the ink well is low, an ordinary spawn may bring an ink bottle along
 * (GAME_CONFIG.recovery.bottle): at most one per page, and not on top of the Spill.
 */
function maybeSpawnBottle(world: World): void {
  const page = world.page;
  const b = GAME_CONFIG.recovery.bottle;
  if (page.bottleSpawned || world.ink >= world.maxInk * b.belowInk) return;
  if (page.spawned < page.params.size * b.afterSpawned || world.targets.some((t) => t.boss)) return;
  const { chance, speedFactor } = bottleParams(page.chapter);
  if (world.random() >= chance) return;
  if (spawnBottle(world, speedFactor)) page.bottleSpawned = true;
}

/** Send an ink bottle across the page: a single plain target carrying a key or a word. */
export function spawnBottle(world: World, speedFactor = 1): Target | null {
  const kind: TargetKind = world.page.params.kind === 'drip' || !world.content.supports('blotling') ? 'drip' : 'blotling';
  const base = world.page.params.speed * (kind === world.page.params.kind ? 1 : GAME_CONFIG.base[kind].speed / GAME_CONFIG.base[world.page.params.kind].speed);
  if (freeLanes(world).length === 0) return null;
  return spawnTarget(world, { kind, lives: 1, ghost: false, bottle: true, speed: base * speedFactor });
}

/** Put ink back in the well. Returns how much actually went in. */
export function restoreInk(world: World, amount: number, source: 'streak' | 'bottle', target?: Target): number {
  const before = world.ink;
  world.ink = Math.min(world.maxInk, world.ink + amount);
  const restored = world.ink - before;
  if (restored > 0) world.events.push({ type: 'inkRestored', amount: restored, source, ...(target ? { target } : {}) });
  return restored;
}

/**
 * A crimson or violet creature was completed but has lives left: give it a
 * fresh payload of the same kind, keeping its place on the page.
 */
export function nextLife(world: World, target: Target): void {
  target.lives = Math.max(1, target.lives - 1);
  const previous = target.text;
  // Never the same word (or character) twice in a row on one creature.
  const fresh = (make: () => string) => {
    let text = make();
    for (let i = 0; i < NEXT_LIFE_TRIES && text === previous; i++) text = make();
    return text;
  };
  if (target.boss) {
    // The Spill keeps throwing longer words.
    const complexity = Math.min(1, world.page.params.complexity + GAME_CONFIG.boss.complexityBonus);
    Object.assign(target, { text: fresh(() => world.content.nextWord(complexity, world.random)), typed: 0 });
    return;
  }
  const make = () => payloadFor(world, target.kind, target.maxLives ?? 1);
  let payload = make();
  for (let i = 0; i < NEXT_LIFE_TRIES && payload.text === previous; i++) payload = make();
  Object.assign(target, payload, { typed: 0 });
}

/** Re-rolls allowed to avoid repeating a creature's previous word. */
const NEXT_LIFE_TRIES = 12;

/** Bring on the Spill: a big, slow, three-life Scrawler in the middle of the page. */
export function spawnBoss(world: World): Target {
  const b = GAME_CONFIG.boss;
  const { params } = world.page;
  const target = spawnTarget(world, {
    kind: 'blotling',
    lane: Math.floor(laneCount(world.laneStep) / 2),
    text: world.content.nextWord(Math.min(1, params.complexity + b.complexityBonus), world.random),
    lives: b.lives,
    ghost: false,
    boss: true,
    speed: params.speed * b.speedFactor,
  })!;
  world.page.bossSpawned = true;
  world.events.push({ type: 'boss', target });
  return target;
}

/** The Spill is blotted: it splits into Inkmites: small, quick Scrawlers with short words. */
export function splitBoss(world: World, boss: Target): void {
  const b = GAME_CONFIG.boss;
  const lanes = laneCount(world.laneStep);
  for (let i = 0; i < b.splits; i++) {
    const lane = Math.min(lanes - 1, Math.max(0, boss.lane + i - 1));
    spawnTarget(world, {
      kind: 'blotling',
      lane,
      x: boss.x + i * 40,
      prevX: boss.x + i * 40,
      y: laneY(lane, world.laneStep),
      text: world.content.nextWord(0, world.random),
      lives: 1,
      ghost: false,
      boss: false,
      speed: boss.speed * b.splitSpeedFactor,
    });
  }
  world.events.push({ type: 'split', target: boss });
}

/** Advance the simulation by one fixed step. Does nothing unless playing. */
export function stepWorld(world: World, stepMs: number): void {
  if (world.phase !== 'playing') return;

  world.stats.playMs += stepMs;
  world.pageStats.playMs += stepMs;
  updateSpawner(world, stepMs);

  // Timed abilities run down; the Paperweight makes everything crawl meanwhile.
  const slow = world.slowMs > 0 ? GAME_CONFIG.abilities.paperweight.speedFactor : 1;
  world.eraserGraceMs = Math.max(0, world.eraserGraceMs - stepMs);
  for (const [timer, id] of [
    ['slowMs', 'paperweight'],
    ['highlightMs', 'highlighter'],
  ] as const) {
    if (world[timer] <= 0) continue;
    world[timer] = Math.max(0, world[timer] - stepMs);
    if (world[timer] === 0) world.events.push({ type: 'abilityEnded', id });
  }

  const dt = stepMs / 1000;
  const survivors: Target[] = [];

  for (const target of world.targets) {
    target.prevX = target.x;
    if (target.entering) enter(world, target, dt);
    else target.x -= target.speed * slow * dt;

    if (target.x > MARGIN_X) {
      survivors.push(target);
      continue;
    }

    if (target.bottle) {
      // A missed bottle just rolls off the page: no leak, no ink lost.
      if (world.lockedId === target.id) world.lockedId = null;
      world.events.push({ type: 'bottleMissed', target });
      continue;
    }
    if (world.shield) {
      // Blotting paper soaks it up: no ink lost, and the run of keys carries on.
      world.shield = false;
      if (world.lockedId === target.id) world.lockedId = null;
      world.events.push({ type: 'shieldUsed', target });
      continue;
    }
    const inkLost = inkLossFor(world, target);
    world.ink = Math.max(0, world.ink - inkLost);
    world.cleanRun = 0;
    world.chargeRun = 0;
    world.eraserRun = 0;
    if (world.stats.combo >= GAME_CONFIG.combo.step) world.events.push({ type: 'comboBroken', was: world.stats.combo });
    world.stats.combo = 0;
    world.pageStats.combo = 0;
    world.stats.leaks++;
    world.pageStats.leaks++;
    if (world.lockedId === target.id) world.lockedId = null;
    world.events.push({ type: 'marginHit', target, inkLost });
  }

  world.targets = survivors;

  if (world.ink <= 0) {
    world.lockedId = null;
    setPhase(world, 'gameOver');
  } else if (
    world.page.spawned >= world.page.params.size &&
    world.targets.length === 0 &&
    (!world.page.hasBoss || world.page.bossSpawned)
  ) {
    if (isLastPageOfChapter(world.page)) {
      // A reward for finishing a chapter.
      const before = world.ink;
      world.ink = Math.min(world.maxInk, world.ink + Math.round(world.maxInk * GAME_CONFIG.chapterInkRefill));
      world.inkRefilled = world.ink - before;
    }
    // A page with nothing reaching the margin earns a sheet of Blotting paper.
    world.shieldEarned = false;
    if (world.abilities.includes('blottingPaper') && !world.shield && world.pageStats.leaks === 0) {
      world.shield = true;
      world.shieldEarned = true;
      world.events.push({ type: 'passiveReady', id: 'blottingPaper' });
    }
    world.slowMs = 0;
    world.highlightMs = 0;
    setPhase(world, 'pageCleared');
  }
}

/** Ink lost when `target` reaches the margin. Sprinkled kinds cost what their own kind costs. */
export function inkLossFor(world: World, target: Target): number {
  const params = world.page.params;
  const kindFactor = target.kind === params.kind ? 1 : GAME_CONFIG.base[target.kind].inkLoss / GAME_CONFIG.base[params.kind].inkLoss;
  return Math.round(params.inkLoss * kindFactor * (target.boss ? GAME_CONFIG.boss.inkLossFactor : 1));
}

/** Interpolated x position for rendering between two steps. */
export function renderX(target: Target, alpha: number): number {
  return target.prevX + (target.x - target.prevX) * alpha;
}

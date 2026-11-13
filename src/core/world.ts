/**
 * Pure game state and simulation. No rendering or DOM code lives here, so it
 * can be unit tested directly (REQUIREMENTS §7).
 */
import { createContentSource, type ContentSource } from '../content/contentSource';
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_KEYS,
  GAME_CONFIG,
  chapterPlan,
  pageParams,
  type Difficulty,
  type PageParams,
  type TargetKind,
} from './config';
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
   * Buffer-mode targets (Run-on, Misprint) only: the text as currently
   * typed or edited. The target is done when it equals `text`.
   */
  buffer?: string;
  /** Buffer-mode targets only: cursor position in the buffer. */
  cursor?: number;
  /** Current position (left edge of the target body). */
  x: number;
  y: number;
  lane: number;
  /** Position at the previous step, for render interpolation. */
  prevX: number;
  /** Horizontal speed in logical pixels per second. */
  speed: number;
}

export type GamePhase = 'ready' | 'playing' | 'paused' | 'pageCleared' | 'gameOver';

/** Things that happened this frame, for the renderer to animate. */
export type GameEvent =
  | { type: 'locked'; targetId: number }
  | { type: 'progress'; targetId: number }
  | { type: 'destroyed'; target: Target; points: number }
  | { type: 'marginHit'; target: Target; inkLost: number }
  | { type: 'error'; key: string; targetId: number | null }
  | { type: 'phase'; phase: GamePhase }
  /** The page was restarted or abandoned: clear effects and stains. */
  | { type: 'reset' };

/** Ink and notebook stats as they were when a page or chapter began. */
export interface StartSnapshot {
  /** Page (within the chapter) the snapshot was taken at. */
  pageIndex: number;
  ink: number;
  stats: Stats;
}

export interface PageState {
  /** 0-based chapter (level) index. */
  chapter: number;
  /** 0-based page (wave) index within the chapter. */
  index: number;
  /** Pages in this chapter. */
  pageCount: number;
  params: PageParams;
  spawned: number;
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
  /** Supplies drip characters and Blotling words for those keys. */
  content: ContentSource;
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
  content?: Pick<ContentSource, 'supports'>,
): PageState {
  return {
    chapter,
    index,
    pageCount: chapterPlan(chapter).length,
    params: pageParams(difficulty, chapter, index, content ? (kind) => content.supports(kind) : undefined),
    spawned: 0,
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
    pageStart: { pageIndex: 0, ink: GAME_CONFIG.maxInk, stats: createStats() },
    chapterStart: { pageIndex: 0, ink: GAME_CONFIG.maxInk, stats: createStats() },
    events: [],
    keys: content.keys,
    content,
    laneStep: 1,
    targetScale: 1,
    nextId: 1,
    random: options.random ?? Math.random,
  };
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
  const snapshot = { pageIndex: world.page.index, ink: world.ink, stats: structuredClone(world.stats) };
  world.pageStart = snapshot;
  if (world.page.index === 0) world.chapterStart = structuredClone(snapshot);
}

export function setPhase(world: World, phase: GamePhase): void {
  if (world.phase === phase) return;
  world.phase = phase;
  world.events.push({ type: 'phase', phase });
}

/** Start a fresh notebook, keeping the same object (and its key set). */
export function resetWorld(world: World, difficulty: Difficulty = world.difficulty): void {
  const fresh = createWorld({ random: world.random, content: world.content, difficulty });
  fresh.nextId = world.nextId;
  fresh.laneStep = world.laneStep;
  fresh.targetScale = world.targetScale;
  Object.assign(world, fresh);
}

/**
 * Rough on-page width of a target, for spacing. Matches the renderer's
 * shapes closely enough without depending on font measurement.
 */
export function estimateWidth(target: Pick<Target, 'kind' | 'text' | 'buffer'>, scale = 1): number {
  if (target.kind === 'drip') return 58 * scale;
  const length = Math.max([...target.text].length, [...(target.buffer ?? '')].length);
  return (36 + 15 * length) * scale;
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

/** Up to this many re-rolls to avoid two targets starting with the same character. */
const DISTINCT_FIRST_CHAR_TRIES = 6;

/** Whether a target type is edited as a buffer (rather than typed letter by letter). */
export function isBufferKind(kind: TargetKind): boolean {
  return kind === 'runon' || kind === 'misprint';
}

/**
 * Pick a payload, preferring one whose first character doesn't match any
 * target already on the page. That keeps targeting unambiguous: the first
 * keystroke picks exactly the target you meant.
 */
function payloadFor(world: World, kind: TargetKind): Pick<Target, 'text' | 'buffer' | 'cursor'> {
  const { complexity } = world.page.params;
  const { content, random } = world;
  if (kind === 'misprint') {
    // Misprints are picked by urgency, not first letter, so no re-rolls needed.
    const { right, wrong } = content.nextMisprint(complexity, random);
    return { text: right, buffer: wrong, cursor: [...wrong].length };
  }

  const taken = new Set(world.targets.map((t) => t.text[t.typed]));
  const next = () =>
    kind === 'drip'
      ? content.nextChar(random)
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

  const { kind, speed } = world.page.params;
  const jitter = GAME_CONFIG.speedJitter;
  const lane = overrides.lane ?? pick(lanes, world.random);
  // Never faster than the target ahead in the same lane, so they can't overlap.
  const leaderSpeed = Math.min(...world.targets.filter((t) => t.lane === lane).map((t) => t.speed));
  const target: Target = {
    id: world.nextId++,
    kind,
    ...payloadFor(world, kind),
    typed: 0,
    x: SPAWN_X,
    prevX: SPAWN_X,
    y: laneY(lane, world.laneStep),
    lane,
    speed: Math.min(leaderSpeed, speed * (1 + (world.random() * 2 - 1) * jitter)),
    ...overrides,
  };
  world.targets.push(target);
  return target;
}

function updateSpawner(world: World, stepMs: number): void {
  const page = world.page;
  const { size, spawnIntervalMs, maxOnScreen } = page.params;
  page.spawnTimerMs -= stepMs;

  if (page.spawnTimerMs > 0 || page.spawned >= size || world.targets.length >= maxOnScreen) return;

  // If no lane is free, try again next step.
  if (spawnTarget(world)) {
    page.spawned++;
    page.spawnTimerMs = spawnIntervalMs;
  }
}

/** Advance the simulation by one fixed step. Does nothing unless playing. */
export function stepWorld(world: World, stepMs: number): void {
  if (world.phase !== 'playing') return;

  world.stats.playMs += stepMs;
  world.pageStats.playMs += stepMs;
  updateSpawner(world, stepMs);

  const dt = stepMs / 1000;
  const survivors: Target[] = [];

  for (const target of world.targets) {
    target.prevX = target.x;
    target.x -= target.speed * dt;

    if (target.x > MARGIN_X) {
      survivors.push(target);
      continue;
    }

    const inkLost = world.page.params.inkLoss;
    world.ink = Math.max(0, world.ink - inkLost);
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
  } else if (world.page.spawned >= world.page.params.size && world.targets.length === 0) {
    if (isLastPageOfChapter(world.page)) {
      // A reward for finishing a chapter.
      const before = world.ink;
      world.ink = Math.min(world.maxInk, world.ink + Math.round(world.maxInk * GAME_CONFIG.chapterInkRefill));
      world.inkRefilled = world.ink - before;
    }
    setPhase(world, 'pageCleared');
  }
}

/** Interpolated x position for rendering between two steps. */
export function renderX(target: Target, alpha: number): number {
  return target.prevX + (target.x - target.prevX) * alpha;
}

/**
 * Pure game state and simulation. No rendering or DOM code lives here, so it
 * can be unit tested directly (REQUIREMENTS §7).
 */
import { DEFAULT_KEYS, GAME_CONFIG, PLACEHOLDER_WORDS, pageParams, type PageParams, type TargetKind } from './config';
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
  /** How many characters of `text` have been typed. */
  typed: number;
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
  | { type: 'phase'; phase: GamePhase };

export interface PageState {
  /** 0-based page (wave) index. */
  index: number;
  params: PageParams;
  spawned: number;
  /** Counts down to the next spawn. */
  spawnTimerMs: number;
}

export interface World {
  phase: GamePhase;
  /** Phase to return to when unpausing. */
  resumePhase: GamePhase;
  page: PageState;
  targets: Target[];
  /** Target receiving keystrokes, if any. */
  lockedId: number | null;
  ink: number;
  maxInk: number;
  /** Stats for the whole notebook (campaign). */
  stats: Stats;
  /** Stats for the current page only. */
  pageStats: Stats;
  /** Drained by the renderer each frame. */
  events: GameEvent[];
  /** Characters to build targets from (the player's Type Case). */
  keys: readonly string[];
  nextId: number;
  /** Injected so tests are deterministic. Returns [0, 1). */
  random: () => number;
}

/** Ruled lines that targets can travel on. */
export function laneCount(): number {
  return Math.floor((WORLD_HEIGHT - FIRST_LINE_Y - LINE_SPACING) / LINE_SPACING);
}

export function laneY(lane: number): number {
  return FIRST_LINE_Y + lane * LINE_SPACING;
}

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('pick() from empty list');
  return item;
}

export function createPage(index: number): PageState {
  // Spawn the first target right away.
  return { index, params: pageParams(index), spawned: 0, spawnTimerMs: 0 };
}

export function createWorld(
  options: { random?: () => number; keys?: readonly string[] } = {},
): World {
  return {
    phase: 'ready',
    resumePhase: 'ready',
    page: createPage(0),
    targets: [],
    lockedId: null,
    ink: GAME_CONFIG.maxInk,
    maxInk: GAME_CONFIG.maxInk,
    stats: createStats(),
    pageStats: createStats(),
    events: [],
    keys: options.keys ?? DEFAULT_KEYS,
    nextId: 1,
    random: options.random ?? Math.random,
  };
}

export function setPhase(world: World, phase: GamePhase): void {
  if (world.phase === phase) return;
  world.phase = phase;
  world.events.push({ type: 'phase', phase });
}

/** Start a fresh notebook, keeping the same object (and its key set). */
export function resetWorld(world: World): void {
  const fresh = createWorld({ random: world.random, keys: world.keys });
  fresh.nextId = world.nextId;
  Object.assign(world, fresh);
}

/** Lanes whose most recent target has moved far enough in to make room. */
function freeLanes(world: World): number[] {
  const busy = new Set(
    world.targets.filter((t) => t.x > SPAWN_X - GAME_CONFIG.laneClearancePx).map((t) => t.lane),
  );
  const lanes: number[] = [];
  for (let lane = 0; lane < laneCount(); lane++) if (!busy.has(lane)) lanes.push(lane);
  return lanes;
}

function payloadFor(world: World, kind: TargetKind): string {
  return kind === 'drip' ? pick(world.keys, world.random) : pick(PLACEHOLDER_WORDS, world.random);
}

/**
 * Add a target on a free lane. Returns null if every lane is still busy.
 * `overrides` is mainly for tests.
 */
export function spawnTarget(world: World, overrides: Partial<Target> = {}): Target | null {
  const lanes = freeLanes(world);
  if (lanes.length === 0 && overrides.lane === undefined) return null;

  const { kind, speed } = world.page.params;
  const jitter = GAME_CONFIG.page.speedJitter;
  const lane = overrides.lane ?? pick(lanes, world.random);
  const target: Target = {
    id: world.nextId++,
    kind,
    text: payloadFor(world, kind),
    typed: 0,
    x: SPAWN_X,
    prevX: SPAWN_X,
    y: laneY(lane),
    lane,
    speed: speed * (1 + (world.random() * 2 - 1) * jitter),
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

    const inkLost = GAME_CONFIG.inkLoss[target.kind];
    world.ink = Math.max(0, world.ink - inkLost);
    world.stats.combo = 0;
    world.pageStats.combo = 0;
    if (world.lockedId === target.id) world.lockedId = null;
    world.events.push({ type: 'marginHit', target, inkLost });
  }

  world.targets = survivors;

  if (world.ink <= 0) {
    world.lockedId = null;
    setPhase(world, 'gameOver');
  } else if (world.page.spawned >= world.page.params.size && world.targets.length === 0) {
    setPhase(world, 'pageCleared');
  }
}

/** Interpolated x position for rendering between two steps. */
export function renderX(target: Target, alpha: number): number {
  return target.prevX + (target.x - target.prevX) * alpha;
}

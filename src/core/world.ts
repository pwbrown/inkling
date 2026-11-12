/**
 * Pure game state for milestone 1: the page, the Nib, and a single target
 * drifting from right to left. No rendering or DOM code lives here, so it can
 * be unit tested directly (REQUIREMENTS §7).
 */

/** Logical play-field size. The renderer scales this to fit the window. */
export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

/** The red margin line the Nib defends (DESIGN §2). */
export const MARGIN_X = 140;

/** Ruled-line spacing on the page; targets travel along these lines. */
export const LINE_SPACING = 48;
export const FIRST_LINE_Y = 120;

/** Targets spawn just off the right edge. */
export const SPAWN_X = WORLD_WIDTH + 80;

/** Placeholder words until the word pool arrives in milestone 3. */
export const PLACEHOLDER_WORDS = ['ink', 'quill', 'page', 'nib', 'blot', 'margin'] as const;

export interface Target {
  id: number;
  text: string;
  /** Current position (left edge of the target body). */
  x: number;
  y: number;
  /** Position at the previous step, for render interpolation. */
  prevX: number;
  /** Horizontal speed in logical pixels per second. */
  speed: number;
}

export interface World {
  targets: Target[];
  /** Times a target has reached the margin. Becomes ink loss in milestone 2. */
  marginHits: number;
  nextId: number;
  /** Injected so tests are deterministic. Returns [0, 1). */
  random: () => number;
}

export const DEFAULT_TARGET_SPEED = 140;

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

export function spawnTarget(world: World, speed = DEFAULT_TARGET_SPEED): Target {
  const lane = Math.floor(world.random() * laneCount());
  const target: Target = {
    id: world.nextId++,
    text: pick(PLACEHOLDER_WORDS, world.random),
    x: SPAWN_X,
    prevX: SPAWN_X,
    y: laneY(lane),
    speed,
  };
  world.targets.push(target);
  return target;
}

export function createWorld(random: () => number = Math.random): World {
  const world: World = { targets: [], marginHits: 0, nextId: 1, random };
  spawnTarget(world);
  return world;
}

/** Advance the simulation by one fixed step. */
export function stepWorld(world: World, stepMs: number): void {
  const dt = stepMs / 1000;
  const survivors: Target[] = [];

  for (const target of world.targets) {
    target.prevX = target.x;
    target.x -= target.speed * dt;

    if (target.x <= MARGIN_X) {
      world.marginHits++;
    } else {
      survivors.push(target);
    }
  }

  const removed = world.targets.length - survivors.length;
  world.targets = survivors;

  // Milestone 1: keep one target on the page at all times.
  for (let i = 0; i < removed; i++) spawnTarget(world);
}

/** Interpolated x position for rendering between two steps. */
export function renderX(target: Target, alpha: number): number {
  return target.prevX + (target.x - target.prevX) * alpha;
}

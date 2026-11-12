/**
 * Turns player intent (characters typed, confirm, pause) into game state
 * changes. Pure: the DOM listener lives in src/input/keyboard.ts.
 *
 * This is the "match mode" input model from REQUIREMENTS §3, used by Drips
 * (T2) and Blotlings (T1). Buffer mode for T3/T4 will sit beside it.
 */
import { GAME_CONFIG } from './config';
import { createStats, type Stats } from './stats';
import { WORLD_WIDTH, createPage, resetWorld, setPhase, type Target, type World } from './world';

/** Current score multiplier for a combo length. */
export function multiplier(combo: number): number {
  const { step, maxMultiplier } = GAME_CONFIG.combo;
  return Math.min(maxMultiplier, 1 + Math.floor(combo / step));
}

/** Targets that have entered the visible page and can be typed at. */
function visibleTargets(world: World): Target[] {
  return world.targets.filter((t) => t.x < WORLD_WIDTH);
}

/** The visible target closest to the margin, i.e. the most urgent one. */
function mostUrgent(targets: Target[]): Target | undefined {
  let best: Target | undefined;
  for (const t of targets) if (!best || t.x < best.x) best = t;
  return best;
}

function bothStats(world: World, fn: (s: Stats) => void): void {
  fn(world.stats);
  fn(world.pageStats);
}

function registerError(world: World, key: string, target: Target | undefined): void {
  // Which character the player *should* have typed: the locked target's next
  // character, or else the most urgent visible target's next character.
  const intended = target ?? mostUrgent(visibleTargets(world));
  const expected = intended?.text[intended.typed];

  bothStats(world, (s) => {
    s.errors++;
    s.combo = 0;
    if (expected !== undefined) s.missedKeys[expected] = (s.missedKeys[expected] ?? 0) + 1;
  });
  world.events.push({ type: 'error', key, targetId: target?.id ?? null });
}

/** Handle one typed character. Ignored unless the game is being played. */
export function typeChar(world: World, key: string): void {
  if (world.phase !== 'playing') return;
  const scoreBefore = world.stats.score;

  let target = world.targets.find((t) => t.id === world.lockedId);

  if (!target) {
    // Lock onto the closest visible target whose next character matches.
    target = mostUrgent(visibleTargets(world).filter((t) => t.text[t.typed] === key));
    if (!target) {
      registerError(world, key, undefined);
      return;
    }
    world.lockedId = target.id;
    world.events.push({ type: 'locked', targetId: target.id });
  } else if (target.text[target.typed] !== key) {
    registerError(world, key, target);
    return;
  }

  target.typed++;
  bothStats(world, (s) => {
    s.correct++;
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    s.score += GAME_CONFIG.points.perChar * multiplier(s.combo);
  });

  if (target.typed < target.text.length) {
    world.events.push({ type: 'progress', targetId: target.id });
    return;
  }

  // Finished: destroy it.
  const done = target;
  world.targets = world.targets.filter((t) => t !== done);
  world.lockedId = null;
  bothStats(world, (s) => {
    s.destroyed++;
    s.score += GAME_CONFIG.points.perTarget * multiplier(s.combo);
  });
  // Points from the finishing keystroke plus the completion bonus.
  world.events.push({ type: 'destroyed', target: done, points: world.stats.score - scoreBefore });
}

/** Enter: start, turn the page, or start over, depending on the phase. */
export function confirm(world: World): void {
  switch (world.phase) {
    case 'ready':
      setPhase(world, 'playing');
      break;
    case 'pageCleared':
      world.page = createPage(world.page.index + 1);
      world.pageStats = createStats();
      setPhase(world, 'playing');
      break;
    case 'gameOver':
      resetWorld(world);
      setPhase(world, 'playing');
      break;
    default:
      break;
  }
}

/** Esc: pause or resume. Only the playing phase can be paused. */
export function togglePause(world: World): void {
  if (world.phase === 'playing') {
    world.resumePhase = 'playing';
    setPhase(world, 'paused');
  } else if (world.phase === 'paused') {
    setPhase(world, world.resumePhase);
  }
}

/** Pause if playing, e.g. when the window loses focus. */
export function autoPause(world: World): void {
  if (world.phase === 'playing') togglePause(world);
}

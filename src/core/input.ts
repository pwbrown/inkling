/**
 * Turns player intent (characters typed, confirm, pause) into game state
 * changes. Pure: the DOM listener lives in src/input/keyboard.ts.
 *
 * This is the "match mode" input model from REQUIREMENTS §3, used by Drips
 * (T2) and Blotlings (T1). Buffer mode for T3/T4 will sit beside it.
 */
import { DIFFICULTIES, GAME_CONFIG, type Difficulty } from './config';
import { createStats, type Stats } from './stats';
import { WORLD_WIDTH, createPage, isLastPageOfChapter, resetWorld, setPhase, type Target, type World } from './world';

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

/** Handle one typed character. */
export function typeChar(world: World, key: string): void {
  if (world.phase === 'ready') {
    // Number keys pick a difficulty on the new-notebook screen.
    const choice = DIFFICULTIES[Number(key) - 1];
    if (choice) selectDifficulty(world, choice);
    return;
  }
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

/** Highlight a difficulty on the new-notebook screen. */
export function selectDifficulty(world: World, difficulty: Difficulty): void {
  if (world.phase === 'ready') world.selectedDifficulty = difficulty;
}

/** Arrow keys on the new-notebook screen: move the highlight, wrapping around. */
export function moveSelection(world: World, delta: number): void {
  if (world.phase !== 'ready') return;
  const i = DIFFICULTIES.indexOf(world.selectedDifficulty);
  const n = DIFFICULTIES.length;
  world.selectedDifficulty = DIFFICULTIES[(((i + delta) % n) + n) % n] ?? world.selectedDifficulty;
}

/** Move on from a cleared page: the next page, or the next chapter's first page. */
function turnPage(world: World): void {
  const { chapter, index } = world.page;
  world.page = isLastPageOfChapter(world.page)
    ? createPage(world.difficulty, chapter + 1, 0)
    : createPage(world.difficulty, chapter, index + 1);
  world.pageStats = createStats();
  world.inkRefilled = 0;
}

/** Enter: start a notebook, turn the page, or go back to the new-notebook screen. */
export function confirm(world: World): void {
  switch (world.phase) {
    case 'ready':
      resetWorld(world, world.selectedDifficulty);
      setPhase(world, 'playing');
      break;
    case 'pageCleared':
      turnPage(world);
      setPhase(world, 'playing');
      break;
    case 'gameOver':
      // Back to the new-notebook screen so difficulty can be changed.
      world.selectedDifficulty = world.difficulty;
      setPhase(world, 'ready');
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

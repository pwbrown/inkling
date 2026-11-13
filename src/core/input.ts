/**
 * Turns player intent (characters typed, confirm, pause) into game state
 * changes. Pure: the DOM listener lives in src/input/keyboard.ts.
 *
 * Two input models (REQUIREMENTS §3):
 * - Match mode, for Drips and Blotlings: each key must be the next character.
 * - Buffer mode, for Run-ons and Misprints: keys edit a buffer with a cursor,
 *   so mistakes stay until fixed with Backspace, Delete and the arrow keys.
 */
import { DIFFICULTIES, GAME_CONFIG, type Difficulty } from './config';
import { applyEdit, correctPrefix, editDistance, isTextEdit, type EditAction } from './editing';
import { createStats, type Stats } from './stats';
import {
  WORLD_WIDTH,
  createPage,
  isBufferKind,
  isLastPageOfChapter,
  markPageStart,
  resetWorld,
  setPhase,
  type StartSnapshot,
  type Target,
  type World,
} from './world';

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

function registerError(world: World, key: string, target: Target | undefined, expectedChar?: string | null): void {
  // Which character the player *should* have typed: given by the caller, or
  // the locked target's next character, or the most urgent target's.
  const intended = target ?? mostUrgent(visibleTargets(world));
  const expected = expectedChar === undefined ? intended?.text[intended.typed] : (expectedChar ?? undefined);

  bothStats(world, (s) => {
    s.errors++;
    s.combo = 0;
    if (expected !== undefined) s.missedKeys[expected] = (s.missedKeys[expected] ?? 0) + 1;
  });
  world.events.push({ type: 'error', key, targetId: target?.id ?? null });
}

/** Credit a correct keystroke. */
function registerHit(world: World, key: string): void {
  bothStats(world, (s) => {
    s.correct++;
    s.hitKeys[key] = (s.hitKeys[key] ?? 0) + 1;
    s.combo++;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    s.score += GAME_CONFIG.points.perChar * multiplier(s.combo);
  });
}

/** Remove a finished target and award the completion bonus. */
function destroyTarget(world: World, target: Target, scoreBefore: number): void {
  world.targets = world.targets.filter((t) => t !== target);
  world.lockedId = null;
  bothStats(world, (s) => {
    s.destroyed++;
    s.score += GAME_CONFIG.points.perTarget * multiplier(s.combo);
  });
  // Points from the finishing keystroke plus the completion bonus.
  world.events.push({ type: 'destroyed', target, points: world.stats.score - scoreBefore });
}

function lock(world: World, target: Target): void {
  if (world.lockedId === target.id) return;
  world.lockedId = target.id;
  world.events.push({ type: 'locked', targetId: target.id });
}

/** Can this keystroke start on a target that isn't locked yet? */
function startsWith(target: Target, key: string): boolean {
  if (target.kind === 'misprint') return false;
  if (target.kind === 'runon') return target.buffer === '' && target.text[0] === key;
  return target.text[target.typed] === key;
}

/**
 * Apply an edit to a Run-on or Misprint and score it.
 *
 * - Run-on: typing the next character is correct; anything else is a
 *   mistake that stays in the buffer until Backspace removes it.
 * - Misprint: an edit is correct if it brings the text closer to the right
 *   spelling and a mistake if it moves further away. Moving the cursor is free.
 */
function editBuffer(world: World, target: Target, action: EditAction): void {
  const scoreBefore = world.stats.score;
  const before = target.buffer ?? '';
  // Run-ons are typed left to right: the cursor stays at the end.
  if (target.kind === 'runon' && !isTextEdit(action)) return;
  if (target.kind === 'runon' && action.type === 'delete') return;

  const next = applyEdit({ buffer: before, cursor: target.cursor ?? [...before].length }, action);
  target.buffer = next.buffer;
  target.cursor = next.cursor;
  target.typed = correctPrefix(next.buffer, target.text);

  if (!isTextEdit(action) || next.buffer === before) {
    world.events.push({ type: 'progress', targetId: target.id });
    return;
  }

  const char = action.type === 'insert' ? action.char : null;
  let correct: boolean;
  let expected: string | null = null;
  if (target.kind === 'runon') {
    const prefix = correctPrefix(before, target.text);
    expected = [...target.text][prefix] ?? null;
    if (action.type === 'insert') correct = prefix === [...before].length && char === expected;
    // Backspacing over a mistake is the right move; erasing correct text isn't scored.
    else correct = prefix < [...before].length;
  } else {
    correct = editDistance(next.buffer, target.text) < editDistance(before, target.text);
  }

  if (correct) {
    if (char) registerHit(world, char);
    else
      bothStats(world, (s) => {
        s.score += GAME_CONFIG.points.perChar * multiplier(s.combo);
      });
  } else if (action.type === 'insert' || target.kind === 'misprint') {
    registerError(world, char ?? action.type, target, expected);
  }

  if (next.buffer === target.text) destroyTarget(world, target, scoreBefore);
  else world.events.push({ type: 'progress', targetId: target.id });
}

/** The target an edit key (Backspace, arrows…) applies to: the locked one, or the most urgent Misprint. */
function editTarget(world: World): Target | undefined {
  const locked = world.targets.find((t) => t.id === world.lockedId);
  if (locked) return isBufferKind(locked.kind) ? locked : undefined;
  return mostUrgent(visibleTargets(world).filter((t) => t.kind === 'misprint'));
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
    // Lock onto the closest visible target this key can start…
    target = mostUrgent(visibleTargets(world).filter((t) => startsWith(t, key)));
    // …or else the most urgent Misprint, which is edited in place.
    target ??= editTarget(world);
    if (!target) {
      registerError(world, key, undefined);
      return;
    }
    lock(world, target);
  }

  if (isBufferKind(target.kind)) {
    editBuffer(world, target, { type: 'insert', char: key });
    return;
  }

  if (target.text[target.typed] !== key) {
    registerError(world, key, target);
    return;
  }

  target.typed++;
  registerHit(world, key);

  if (target.typed < target.text.length) {
    world.events.push({ type: 'progress', targetId: target.id });
    return;
  }
  destroyTarget(world, target, scoreBefore);
}

export type EditKey = 'backspace' | 'delete' | 'left' | 'right' | 'home' | 'end';

/** Backspace, Delete, arrows, Home and End while playing (buffer mode). */
export function editKey(world: World, key: EditKey): void {
  if (world.phase !== 'playing') return;
  const target = editTarget(world);
  if (!target) return;
  lock(world, target);
  editBuffer(world, target, { type: key });
}

/**
 * Tab: move the lock to the next target on the page, nearest the margin
 * first, wrapping around. Lets you leave a target you locked by mistake.
 */
export function cycleLock(world: World): void {
  if (world.phase !== 'playing') return;
  const order = visibleTargets(world).sort((a, b) => a.x - b.x);
  if (order.length === 0) return;
  const i = order.findIndex((t) => t.id === world.lockedId);
  lock(world, order[(i + 1) % order.length]!);
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
    ? createPage(world.difficulty, chapter + 1, 0, world.content)
    : createPage(world.difficulty, chapter, index + 1, world.content);
  world.pageStats = createStats();
  world.inkRefilled = 0;
}

/** Enter: start a notebook, turn the page, or go back to the new-notebook screen. */
export function confirm(world: World): void {
  switch (world.phase) {
    case 'ready':
      resetWorld(world, world.selectedDifficulty);
      markPageStart(world);
      setPhase(world, 'playing');
      break;
    case 'pageCleared':
      turnPage(world);
      markPageStart(world);
      setPhase(world, 'playing');
      break;
    case 'gameOver':
      retryChapter(world);
      break;
    default:
      break;
  }
}

/** Put the page back to how it began: same page, ink and score as at its start. */
function restoreTo(world: World, snapshot: StartSnapshot): void {
  world.page = createPage(world.difficulty, world.page.chapter, snapshot.pageIndex, world.content);
  world.targets = [];
  world.lockedId = null;
  world.ink = Math.max(1, snapshot.ink);
  world.inkRefilled = 0;
  world.stats = structuredClone(snapshot.stats);
  world.pageStats = createStats();
  world.events.push({ type: 'reset' });
  markPageStart(world);
  setPhase(world, 'playing');
}

/** Pause menu: start the current page over. */
export function restartPage(world: World): void {
  if (world.phase !== 'paused' && world.phase !== 'playing') return;
  restoreTo(world, world.pageStart);
}

/**
 * Game over: try the chapter again from its first page (or from where this
 * session resumed it), with the ink and score you had then, rather than
 * starting a whole new notebook.
 */
export function retryChapter(world: World): void {
  if (world.phase !== 'gameOver' && world.phase !== 'paused') return;
  restoreTo(world, world.chapterStart);
}

/**
 * Leave the notebook for the main menu. Progress is saved at the start of
 * each page, so Continue picks up from there.
 */
export function quitToMenu(world: World): void {
  world.targets = [];
  world.lockedId = null;
  world.selectedDifficulty = world.difficulty;
  world.events.push({ type: 'reset' });
  setPhase(world, 'ready');
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

import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from './config';
import { autoPause, confirm, moveSelection, multiplier, selectDifficulty, togglePause, typeChar } from './input';
import { MARGIN_X, WORLD_WIDTH, createPage, createWorld, spawnTarget, type World } from './world';

function playingWorld(): World {
  const world = createWorld({ random: () => 0.5, keys: ['a', 'b'] });
  world.phase = 'playing';
  return world;
}

/** Put a visible target on the page. */
function addTarget(world: World, text: string, x: number, lane: number) {
  return spawnTarget(world, { text, x, prevX: x, lane, kind: text.length > 1 ? 'blotling' : 'drip' })!;
}

describe('multiplier', () => {
  it('rises every combo step up to the cap', () => {
    const { step, maxMultiplier } = GAME_CONFIG.combo;
    expect(multiplier(0)).toBe(1);
    expect(multiplier(step - 1)).toBe(1);
    expect(multiplier(step)).toBe(2);
    expect(multiplier(step * 100)).toBe(maxMultiplier);
  });
});

describe('typeChar', () => {
  it('destroys a drip in one keystroke and scores it', () => {
    const world = playingWorld();
    const drip = addTarget(world, 'a', 600, 0);

    typeChar(world, 'a');

    expect(world.targets).not.toContain(drip);
    expect(world.lockedId).toBeNull();
    expect(world.stats.correct).toBe(1);
    expect(world.stats.destroyed).toBe(1);
    expect(world.stats.score).toBe(GAME_CONFIG.points.perChar + GAME_CONFIG.points.perTarget);
    expect(world.events.map((e) => e.type)).toEqual(['locked', 'destroyed']);
    expect(world.events[1]).toMatchObject({ points: GAME_CONFIG.points.perChar + GAME_CONFIG.points.perTarget });
  });

  it('targets the matching drip closest to the margin', () => {
    const world = playingWorld();
    const far = addTarget(world, 'a', 900, 0);
    const near = addTarget(world, 'a', 400, 1);
    const other = addTarget(world, 'b', 200, 2);

    typeChar(world, 'a');

    expect(world.targets).toContain(far);
    expect(world.targets).not.toContain(near);
    expect(world.targets).toContain(other);
  });

  it('ignores targets that have not entered the page yet', () => {
    const world = playingWorld();
    addTarget(world, 'a', WORLD_WIDTH + 10, 0);
    typeChar(world, 'a');
    expect(world.stats.errors).toBe(1);
    expect(world.targets).toHaveLength(1);
  });

  it('locks onto a word and stays locked until it is finished', () => {
    const world = playingWorld();
    const ink = addTarget(world, 'ink', 500, 0);
    const nib = addTarget(world, 'nib', 300, 1);

    typeChar(world, 'i');
    expect(world.lockedId).toBe(ink.id);

    // 'n' matches nib's first letter too, but we're locked on ink.
    typeChar(world, 'n');
    expect(ink.typed).toBe(2);
    expect(nib.typed).toBe(0);

    typeChar(world, 'k');
    expect(world.targets).not.toContain(ink);
    expect(world.lockedId).toBeNull();
  });

  it('counts a wrong key against the locked target and breaks the combo', () => {
    const world = playingWorld();
    const ink = addTarget(world, 'ink', 500, 0);
    typeChar(world, 'i');
    typeChar(world, 'x');

    expect(ink.typed).toBe(1);
    expect(world.lockedId).toBe(ink.id);
    expect(world.stats.errors).toBe(1);
    expect(world.stats.combo).toBe(0);
    expect(world.stats.missedKeys).toEqual({ n: 1 });
    expect(world.stats.hitKeys).toEqual({ i: 1 });
  });

  it('blames a stray key on the most urgent target', () => {
    const world = playingWorld();
    addTarget(world, 'a', 900, 0);
    addTarget(world, 'b', MARGIN_X + 50, 1);

    typeChar(world, 'z');

    expect(world.stats.missedKeys).toEqual({ b: 1 });
    expect(world.pageStats.missedKeys).toEqual({ b: 1 });
  });

  it('does nothing unless playing', () => {
    const world = playingWorld();
    addTarget(world, 'a', 600, 0);
    world.phase = 'paused';
    typeChar(world, 'a');
    expect(world.targets).toHaveLength(1);
    expect(world.stats.correct).toBe(0);
  });
});

describe('new-notebook screen', () => {
  it('starts on Normal', () => {
    expect(createWorld().selectedDifficulty).toBe('normal');
  });

  it('arrow keys move the selection and wrap around', () => {
    const world = createWorld();
    moveSelection(world, 1);
    expect(world.selectedDifficulty).toBe('hard');
    moveSelection(world, 2);
    expect(world.selectedDifficulty).toBe('relaxed');
    moveSelection(world, -1);
    expect(world.selectedDifficulty).toBe('expert');
  });

  it('number keys pick a difficulty', () => {
    const world = createWorld();
    typeChar(world, '1');
    expect(world.selectedDifficulty).toBe('relaxed');
    typeChar(world, '4');
    expect(world.selectedDifficulty).toBe('expert');
    typeChar(world, '9');
    expect(world.selectedDifficulty).toBe('expert');
  });

  it('Enter starts a notebook at the selected difficulty', () => {
    const world = createWorld();
    selectDifficulty(world, 'hard');
    confirm(world);
    expect(world.phase).toBe('playing');
    expect(world.difficulty).toBe('hard');
    expect(world.page.params.speed).toBe(createWorld({ difficulty: 'hard' }).page.params.speed);
  });

  it('ignores selection outside the new-notebook screen', () => {
    const world = playingWorld();
    selectDifficulty(world, 'expert');
    moveSelection(world, 1);
    expect(world.selectedDifficulty).toBe('normal');
  });
});

describe('phases', () => {
  it('Enter starts the game from the new-notebook screen', () => {
    const world = createWorld();
    confirm(world);
    expect(world.phase).toBe('playing');
  });

  it('Esc pauses and resumes', () => {
    const world = playingWorld();
    togglePause(world);
    expect(world.phase).toBe('paused');
    togglePause(world);
    expect(world.phase).toBe('playing');
  });

  it('auto-pause only pauses a game in progress', () => {
    const world = createWorld();
    autoPause(world);
    expect(world.phase).toBe('ready');
  });

  it('Enter turns to the next page in the chapter with fresh page stats', () => {
    const world = playingWorld();
    world.stats.score = 500;
    world.pageStats.score = 500;
    const complexity = world.page.params.complexity;
    world.phase = 'pageCleared';

    confirm(world);

    expect(world.phase).toBe('playing');
    expect(world.page.chapter).toBe(0);
    expect(world.page.index).toBe(1);
    expect(world.page.params.complexity).toBeGreaterThan(complexity);
    expect(world.pageStats.score).toBe(0);
    expect(world.stats.score).toBe(500);
  });

  it('Enter after the last page starts the next chapter', () => {
    const world = playingWorld();
    world.page = createPage(world.difficulty, 0, world.page.pageCount - 1);
    world.inkRefilled = 30;
    world.phase = 'pageCleared';

    confirm(world);

    expect(world.page.chapter).toBe(1);
    expect(world.page.index).toBe(0);
    expect(world.inkRefilled).toBe(0);
  });

  it('Enter after game over returns to the new-notebook screen, keeping the difficulty', () => {
    const world = createWorld();
    selectDifficulty(world, 'hard');
    confirm(world);
    world.phase = 'gameOver';
    world.ink = 0;
    world.stats.score = 900;

    confirm(world);
    expect(world.phase).toBe('ready');
    expect(world.selectedDifficulty).toBe('hard');

    confirm(world);
    expect(world.phase).toBe('playing');
    expect(world.difficulty).toBe('hard');
    expect(world.ink).toBe(GAME_CONFIG.maxInk);
    expect(world.stats.score).toBe(0);
  });
});

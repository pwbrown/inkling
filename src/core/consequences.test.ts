import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, bottleParams, mistakeInk, streakKeys } from './config';
import { typeChar, useBlotter } from './input';
import { MARGIN_X, createPage, createWorld, spawnBottle, spawnTarget, stepWorld, type World } from './world';

function playingWorld(difficulty: 'relaxed' | 'normal' | 'hard' | 'expert' = 'normal'): World {
  const world = createWorld({ random: () => 0.5, keys: ['a', 's', 'd', 'f'], difficulty });
  world.phase = 'playing';
  return world;
}

const drip = (world: World, text = 'a') => spawnTarget(world, { kind: 'drip', text, x: 500, prevX: 500, lane: 0 })!;

describe('mistake penalties', () => {
  it('take points, never below zero, and count them', () => {
    const world = playingWorld();
    typeChar(world, 'z');
    expect(world.stats.score).toBe(0);
    expect(world.stats.penalty).toBe(0);

    world.stats.score = 100;
    world.pageStats.score = 100;
    typeChar(world, 'z');
    expect(world.stats.score).toBe(100 - GAME_CONFIG.mistakes.points);
    expect(world.stats.penalty).toBe(GAME_CONFIG.mistakes.points);
    expect(world.stats.errors).toBe(2);
  });

  it('cost ink by difficulty, and nothing on Relaxed', () => {
    for (const difficulty of ['relaxed', 'normal', 'hard', 'expert'] as const) {
      const world = playingWorld(difficulty);
      typeChar(world, 'z');
      expect(world.maxInk - world.ink).toBe(GAME_CONFIG.mistakes.ink[difficulty]);
    }
    expect(GAME_CONFIG.mistakes.ink.relaxed).toBe(0);
  });

  it('report what was lost on the error event', () => {
    const world = playingWorld('hard');
    world.stats.score = 50;
    typeChar(world, 'z');
    expect(world.events).toContainEqual({
      type: 'error',
      key: 'z',
      targetId: null,
      pointsLost: GAME_CONFIG.mistakes.points,
      inkLost: GAME_CONFIG.mistakes.ink.hard,
    });
  });

  it('never take the last of the ink', () => {
    const world = playingWorld('expert');
    world.ink = 2;
    typeChar(world, 'z');
    typeChar(world, 'z');
    expect(world.ink).toBe(GAME_CONFIG.mistakes.minInk);
    stepWorld(world, 16);
    expect(world.phase).toBe('playing');
  });

  it('are free of ink in early Apprentice chapters, then ramp in', () => {
    const { fromApprenticeChapter, rampChapters, ink } = GAME_CONFIG.mistakes;
    expect(mistakeInk('expert', 0, true)).toBe(0);
    expect(mistakeInk('expert', fromApprenticeChapter - 1, true)).toBe(0);
    expect(mistakeInk('expert', fromApprenticeChapter, true)).toBeGreaterThan(0);
    expect(mistakeInk('expert', fromApprenticeChapter, true)).toBeLessThanOrEqual(ink.expert);
    expect(mistakeInk('expert', fromApprenticeChapter + rampChapters, true)).toBe(ink.expert);
    expect(mistakeInk('relaxed', 20, true)).toBe(0);
    expect(mistakeInk('normal', 0, false)).toBe(ink.normal);
  });
});

describe('clean-streak recovery', () => {
  const run = (world: World, keys: number) => {
    for (let i = 0; i < keys; i++) {
      drip(world);
      typeChar(world, 'a');
    }
  };

  it('restores ink after a clean run of keys', () => {
    const world = playingWorld();
    world.ink = 50;
    run(world, streakKeys(0) - 1);
    expect(world.ink).toBe(50);
    run(world, 1);
    expect(world.ink).toBe(50 + GAME_CONFIG.recovery.streak.ink);
    expect(world.events).toContainEqual({ type: 'inkRestored', amount: GAME_CONFIG.recovery.streak.ink, source: 'streak' });
  });

  it('starts over after a mistake', () => {
    const world = playingWorld('relaxed');
    world.ink = 50;
    run(world, streakKeys(0) - 1);
    typeChar(world, 'z');
    run(world, 1);
    expect(world.ink).toBe(50);
  });

  it('never overfills the well', () => {
    const world = playingWorld();
    run(world, streakKeys(0));
    expect(world.ink).toBe(world.maxInk);
    expect(world.events.some((e) => e.type === 'inkRestored')).toBe(false);
  });

  it('needs a longer run in later chapters, up to a cap', () => {
    expect(streakKeys(5)).toBeGreaterThan(streakKeys(0));
    expect(streakKeys(500)).toBe(GAME_CONFIG.recovery.streak.maxKeys);
  });
});

describe('ink bottle', () => {
  it('restores ink when typed', () => {
    const world = playingWorld();
    world.ink = 40;
    const bottle = spawnBottle(world)!;
    expect(bottle.bottle).toBe(true);
    bottle.x = 600;
    for (const char of bottle.text) typeChar(world, char);
    expect(world.targets).toHaveLength(0);
    expect(world.ink).toBe(40 + GAME_CONFIG.recovery.bottle.ink);
  });

  it('costs nothing if it reaches the margin', () => {
    const world = playingWorld();
    world.ink = 40;
    world.page.spawned = world.page.params.size;
    const bottle = spawnBottle(world)!;
    bottle.x = MARGIN_X + 0.1;
    stepWorld(world, 16);
    expect(world.ink).toBe(40);
    expect(world.stats.leaks).toBe(0);
    expect(world.events.some((e) => e.type === 'bottleMissed')).toBe(true);
  });

  it('is left alone by the Blotter', () => {
    const world = playingWorld();
    const bottle = spawnBottle(world)!;
    bottle.x = 600;
    drip(world);
    world.charges = GAME_CONFIG.abilities.blotter.cost;
    expect(useBlotter(world)).toBe(true);
    expect(world.targets).toEqual([bottle]);
  });

  it('only appears when ink is low, once per page', () => {
    const always = createWorld({ random: () => 0, keys: ['a', 's', 'd', 'f'] });
    always.phase = 'playing';
    always.page = createPage('normal', 0, 0, always.content);
    const size = always.page.params.size;

    // Full ink: no bottle however long the page runs.
    for (let i = 0; i < 4000 && always.page.spawned < size; i++) {
      stepWorld(always, 16);
      always.targets = always.targets.filter((t) => t.bottle);
    }
    expect(always.page.bottleSpawned).toBe(false);

    always.page = createPage('normal', 0, 0, always.content);
    always.ink = always.maxInk * GAME_CONFIG.recovery.bottle.belowInk - 1;
    let bottles = 0;
    for (let i = 0; i < 4000 && always.page.spawned < size; i++) {
      stepWorld(always, 16);
      bottles += always.targets.filter((t) => t.bottle).length;
      always.targets = [];
    }
    expect(bottles).toBe(1);
  });

  it('gets rarer and quicker in later chapters', () => {
    expect(bottleParams(10).chance).toBeLessThan(bottleParams(0).chance);
    expect(bottleParams(999).chance).toBe(GAME_CONFIG.recovery.bottle.minChance);
    expect(bottleParams(10).speedFactor).toBeGreaterThan(bottleParams(0).speedFactor);
    expect(bottleParams(999).speedFactor).toBe(GAME_CONFIG.recovery.bottle.maxSpeedFactor);
  });
});

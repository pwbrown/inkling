import { describe, expect, it } from 'vitest';
import { createContentSource } from '../content/contentSource';
import { GAME_CONFIG } from './config';
import { confirm, startApprentice, typeChar, useBlotter } from './input';
import { MARGIN_X, createPage, createWorld, spawnBoss, spawnTarget, stepWorld, type World } from './world';

function playingWorld(): World {
  const world = createWorld({ random: () => 0.5, keys: [...'abcdefghijklmnopqrstuvwxyz'] });
  world.phase = 'playing';
  return world;
}

describe('Blotter', () => {
  it('charges every 25 correct keys in a row, up to the maximum', () => {
    const world = playingWorld();
    const { comboPerCharge, maxCharges } = GAME_CONFIG.blotter;
    for (let i = 0; i < comboPerCharge * (maxCharges + 1); i++) {
      spawnTarget(world, { kind: 'drip', text: 'a', x: 500, prevX: 500, lane: 0 });
      typeChar(world, 'a');
    }
    expect(world.blotter).toBe(maxCharges);
  });

  it('is lost combo progress after a mistake', () => {
    const world = playingWorld();
    for (let i = 0; i < GAME_CONFIG.blotter.comboPerCharge - 1; i++) {
      spawnTarget(world, { kind: 'drip', text: 'a', x: 500, prevX: 500, lane: 0 });
      typeChar(world, 'a');
    }
    typeChar(world, 'z');
    spawnTarget(world, { kind: 'drip', text: 'a', x: 500, prevX: 500, lane: 0 });
    typeChar(world, 'a');
    expect(world.blotter).toBe(0);
  });

  it('blots every creature on the page except a boss, for half points', () => {
    const world = playingWorld();
    world.blotter = 1;
    spawnTarget(world, { kind: 'blotling', text: 'ink', x: 400, prevX: 400, lane: 0 });
    spawnTarget(world, { kind: 'drip', text: 'a', x: 600, prevX: 600, lane: 1, lives: 3 });
    const boss = spawnTarget(world, { kind: 'blotling', text: 'spill', x: 800, prevX: 800, lane: 4, boss: true, lives: 3 })!;
    // Off the page to the right: not blotted.
    const offPage = spawnTarget(world, { kind: 'drip', text: 'b', lane: 6 })!;

    expect(useBlotter(world)).toBe(true);
    expect(world.blotter).toBe(0);
    expect(world.targets).toEqual([boss, offPage]);
    expect(world.stats.destroyed).toBe(2);
    expect(world.stats.score).toBeGreaterThan(0);
    expect(useBlotter(world)).toBe(false);
  });

  it('does nothing without a charge or with nothing to blot', () => {
    const world = playingWorld();
    spawnTarget(world, { kind: 'drip', text: 'a', x: 400, prevX: 400, lane: 0 });
    expect(useBlotter(world)).toBe(false);
    world.targets = [];
    world.blotter = 1;
    expect(useBlotter(world)).toBe(false);
    expect(world.blotter).toBe(1);
  });
});

describe('the Spill', () => {
  function apprenticeWorld(): World {
    const world = createWorld({ random: () => 0.5, makeContent: (keys) => createContentSource({ keys }) });
    startApprentice(world, 1);
    confirm(world);
    return world;
  }

  it('appears first on the last page of an Apprentice chapter only', () => {
    const world = apprenticeWorld();
    expect(world.page.hasBoss).toBe(false);
    world.page = createPage(world.difficulty, 1, world.page.pageCount - 1, world.content, 'apprentice');
    expect(world.page.hasBoss).toBe(true);
    stepWorld(world, 16);
    const boss = world.targets.find((t) => t.boss);
    expect(boss?.lives).toBe(GAME_CONFIG.boss.lives);
    expect(boss?.speed).toBeLessThan(world.page.params.speed);
    expect(world.events).toContainEqual(expect.objectContaining({ type: 'boss' }));
    expect(createPage('normal', 1, 0, undefined, 'practice').hasBoss).toBe(false);
  });

  it('splits into smaller Blotlings when its last word is typed', () => {
    const world = playingWorld();
    const boss = spawnBoss(world);
    boss.x = boss.prevX = 600;
    for (let life = 0; life < GAME_CONFIG.boss.lives; life++) {
      for (const ch of boss.text) typeChar(world, ch);
    }
    expect(world.targets).not.toContain(boss);
    const splits = world.targets.filter((t) => t.kind === 'blotling');
    expect(splits).toHaveLength(GAME_CONFIG.boss.splits);
    expect(splits.every((t) => !t.boss && t.lives === 1)).toBe(true);
    expect(world.events).toContainEqual(expect.objectContaining({ type: 'split' }));
  });

  it('costs extra ink if it reaches the margin', () => {
    const world = playingWorld();
    const boss = spawnBoss(world);
    boss.x = MARGIN_X + 1;
    boss.speed = 1000;
    const before = world.ink;
    stepWorld(world, 16);
    expect(before - world.ink).toBe(Math.round(world.page.params.inkLoss * GAME_CONFIG.boss.inkLossFactor));
  });

  it('must be dealt with before the page clears', () => {
    const world = apprenticeWorld();
    world.page = createPage(world.difficulty, 1, world.page.pageCount - 1, world.content, 'apprentice');
    world.page.spawned = world.page.params.size;
    stepWorld(world, 16);
    expect(world.phase).toBe('playing');
    expect(world.targets.some((t) => t.boss)).toBe(true);
  });
});

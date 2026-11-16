import { describe, expect, it } from 'vitest';
import { createContentSource } from '../content/contentSource';
import { GAME_CONFIG } from './config';
import { typeChar } from './input';
import { createPage, createWorld, inkLossFor, spawnTarget, type World } from './world';

const ALL = [...'abcdefghijklmnopqrstuvwxyz '];

/** A Scrawler page with the given sprinkle chances. */
function blotlingWorld(sprinkles: { runon: number }, random: () => number = () => 0.5): World {
  const world = createWorld({ random, content: createContentSource({ keys: ALL }) });
  world.page = createPage('normal', 6, 1, world.content);
  expect(world.page.params.kind).toBe('blotling');
  world.page.params.sprinkles = sprinkles;
  world.page.params.variants = { crimson: 0, violet: 0, ghost: 0 };
  world.phase = 'playing';
  return world;
}

describe('sprinkles', () => {
  it('slip a Run-on into a Scrawler page', () => {
    const runon = spawnTarget(blotlingWorld({ runon: 1 }))!;
    expect(runon.kind).toBe('runon');
    expect(runon.buffer).toBe('');
  });

  it('move at their own pace and cost their own ink', () => {
    const world = blotlingWorld({ runon: 1 }, () => 0);
    const runon = spawnTarget(world)!;
    const base = GAME_CONFIG.base;
    const jitterFree = world.page.params.speed * (base.runon.speed / base.blotling.speed);
    expect(runon.speed).toBeLessThan(world.page.params.speed);
    expect(runon.speed).toBeCloseTo(jitterFree * (1 - GAME_CONFIG.speedJitter), 5);
    expect(inkLossFor(world, runon)).toBe(Math.round((world.page.params.inkLoss * base.runon.inkLoss) / base.blotling.inkLoss));
  });

  it('stay rare: one on screen and a few per page', () => {
    const world = blotlingWorld({ runon: 1 });
    spawnTarget(world);
    world.laneStep = 1;
    // A second spawn while one is on screen is an ordinary Scrawler.
    expect(spawnTarget(world)!.kind).toBe('blotling');
    world.targets = [];
    world.page.sprinkled = GAME_CONFIG.sprinkles.maxPerPage;
    expect(spawnTarget(world)!.kind).toBe('blotling');
  });

  it('never carry crimson, violet or ghost variants', () => {
    const world = blotlingWorld({ runon: 1 }, () => 0);
    world.page.params.variants = { crimson: 1, violet: 1, ghost: 1 };
    const runon = spawnTarget(world)!;
    expect(runon.lives).toBe(1);
    expect(runon.ghost).toBe(false);
  });
});

describe('typing on a mixed page', () => {
  it('locks a sprinkled Run-on by its first letter', () => {
    const world = blotlingWorld({ runon: 0 });
    const runon = spawnTarget(world, { kind: 'runon', text: 'go on', buffer: '', cursor: 0, x: 400, prevX: 400, lane: 0 })!;
    spawnTarget(world, { kind: 'blotling', text: 'jump', x: 600, prevX: 600, lane: 2 });
    typeChar(world, 'g');
    expect(world.lockedId).toBe(runon.id);
    expect(runon.buffer).toBe('g');
  });
});

describe('crimson and violet words', () => {
  it('are shorter than ordinary ones on the same page', () => {
    const avg = (lives: number) => {
      let total = 0;
      for (let i = 0; i < 300; i++) {
        const world = blotlingWorld({ runon: 0 }, Math.random);
        world.page.params.complexity = 0.9;
        total += [...spawnTarget(world, { lives })!.text].length;
      }
      return total / 300;
    };
    const plain = avg(1);
    const violet = avg(3);
    expect(violet).toBeLessThan(plain - 0.5);
  });

  it('stay short for every life', () => {
    const world = blotlingWorld({ runon: 0 });
    const t = spawnTarget(world, { lives: 3 })!;
    expect(t.maxLives).toBe(3);
  });
});

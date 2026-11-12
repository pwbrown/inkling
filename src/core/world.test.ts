import { describe, expect, it } from 'vitest';
import { createContentSource } from '../content/contentSource';
import { GAME_CONFIG } from './config';
import {
  MARGIN_X,
  SPAWN_X,
  WORLD_HEIGHT,
  createPage,
  createWorld,
  laneCount,
  laneY,
  renderX,
  setContent,
  spawnTarget,
  stepWorld,
  type World,
} from './world';

/** Deterministic stand-in for Math.random. */
const fixedRandom = (value: number) => () => value;

function playingWorld(random = fixedRandom(0.5)): World {
  const world = createWorld({ random, keys: ['a', 'b', 'c'] });
  world.phase = 'playing';
  return world;
}

describe('world', () => {
  it('starts on the ready screen with a full ink well and no targets', () => {
    const world = createWorld();
    expect(world.phase).toBe('ready');
    expect(world.ink).toBe(GAME_CONFIG.maxInk);
    expect(world.targets).toHaveLength(0);
  });

  it('does not simulate unless playing', () => {
    const world = createWorld();
    stepWorld(world, 1000);
    expect(world.targets).toHaveLength(0);
    expect(world.stats.playMs).toBe(0);
  });

  it('places every lane inside the page', () => {
    for (let lane = 0; lane < laneCount(); lane++) {
      expect(laneY(lane)).toBeGreaterThan(0);
      expect(laneY(lane)).toBeLessThan(WORLD_HEIGHT);
    }
  });

  it('spawns a drip from the key set on the first step', () => {
    const world = playingWorld();
    stepWorld(world, 16);
    expect(world.targets).toHaveLength(1);
    const [drip] = world.targets;
    expect(drip?.kind).toBe('drip');
    expect(['a', 'b', 'c']).toContain(drip?.text);
    expect(world.page.spawned).toBe(1);
  });

  it('waits the spawn interval between targets', () => {
    const world = playingWorld();
    stepWorld(world, 16);
    const interval = world.page.params.spawnIntervalMs;
    stepWorld(world, interval - 32);
    expect(world.targets).toHaveLength(1);
    stepWorld(world, 32);
    expect(world.targets).toHaveLength(2);
  });

  it('never spawns two targets on top of each other in one lane', () => {
    const world = playingWorld();
    for (let i = 0; i < laneCount(); i++) expect(spawnTarget(world)).not.toBeNull();
    expect(new Set(world.targets.map((t) => t.lane)).size).toBe(laneCount());
    // Every lane is busy now.
    expect(spawnTarget(world)).toBeNull();
  });

  it('moves targets left at their speed and interpolates between steps', () => {
    const world = playingWorld();
    const target = spawnTarget(world, { speed: 100 })!;
    world.page.spawned = world.page.params.size; // stop the spawner
    stepWorld(world, 500);
    expect(target.x).toBeCloseTo(SPAWN_X - 50);
    expect(target.prevX).toBeCloseTo(SPAWN_X);
    expect(renderX(target, 0.5)).toBeCloseTo(SPAWN_X - 25);
  });

  it('drains ink, breaks the combo and drops the lock when a target reaches the margin', () => {
    const world = playingWorld();
    const target = spawnTarget(world, { x: MARGIN_X + 1, speed: 1000 })!;
    world.lockedId = target.id;
    world.stats.combo = 7;

    stepWorld(world, 16);

    expect(world.ink).toBe(GAME_CONFIG.maxInk - world.page.params.inkLoss);
    expect(world.stats.combo).toBe(0);
    expect(world.lockedId).toBeNull();
    expect(world.targets).not.toContain(target);
    expect(world.events).toContainEqual(expect.objectContaining({ type: 'marginHit' }));
  });

  it('ends the game when the ink runs out', () => {
    const world = playingWorld();
    world.ink = 5;
    spawnTarget(world, { x: MARGIN_X + 1, speed: 1000 });
    stepWorld(world, 16);
    expect(world.ink).toBe(0);
    expect(world.phase).toBe('gameOver');
  });

  it('clears the page once every target has been spawned and dealt with', () => {
    const world = playingWorld();
    world.ink = 50;
    world.page.spawned = world.page.params.size;
    stepWorld(world, 16);
    expect(world.phase).toBe('pageCleared');
    // Not the end of a chapter, so no refill.
    expect(world.ink).toBe(50);
  });

  it('refills some ink at the end of a chapter, up to the maximum', () => {
    const world = playingWorld();
    world.page = createPage(world.difficulty, 0, world.page.pageCount - 1);
    world.page.spawned = world.page.params.size;
    world.ink = 50;
    stepWorld(world, 16);
    const refill = Math.round(GAME_CONFIG.maxInk * GAME_CONFIG.chapterInkRefill);
    expect(world.ink).toBe(50 + refill);
    expect(world.inkRefilled).toBe(refill);

    const full = playingWorld();
    full.page = createPage(full.difficulty, 0, full.page.pageCount - 1);
    full.page.spawned = full.page.params.size;
    full.ink = full.maxInk - 5;
    stepWorld(full, 16);
    expect(full.ink).toBe(full.maxInk);
    expect(full.inkRefilled).toBe(5);
  });

  it('uses the difficulty for page settings', () => {
    const relaxed = createWorld({ difficulty: 'relaxed' });
    const expert = createWorld({ difficulty: 'expert' });
    expect(expert.page.params.speed).toBeGreaterThan(relaxed.page.params.speed);
  });

  it('never lets a target overtake the one ahead of it in its lane', () => {
    const world = playingWorld();
    const leader = spawnTarget(world, { lane: 3, speed: 50 })!;
    leader.x = 600;
    const follower = spawnTarget(world, { lane: 3 })!;
    expect(follower.speed).toBeLessThanOrEqual(leader.speed);
  });

  it('prefers a first character no other target on the page starts with', () => {
    let i = 0;
    const world = createWorld({ random: () => [0, 0, 0.5, 0.9][i++ % 4]!, keys: ['a', 'b'] });
    world.phase = 'playing';
    spawnTarget(world, { text: 'a', lane: 0, x: 600 });
    const next = spawnTarget(world)!;
    expect(next.text).toBe('b');
  });

  it('only changes keys on the new-notebook screen', () => {
    const world = createWorld({ keys: ['a'] });
    setContent(world, createContentSource({ keys: ['1', '2'] }));
    expect(world.keys).toEqual(['1', '2']);

    world.phase = 'playing';
    setContent(world, createContentSource({ keys: ['x'] }));
    expect(world.keys).toEqual(['1', '2']);
  });

  it('counts play time on both the notebook and the page', () => {
    const world = playingWorld();
    stepWorld(world, 100);
    expect(world.stats.playMs).toBe(100);
    expect(world.pageStats.playMs).toBe(100);
  });
});

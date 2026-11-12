import { describe, expect, it } from 'vitest';
import {
  MARGIN_X,
  PLACEHOLDER_WORDS,
  SPAWN_X,
  WORLD_HEIGHT,
  createWorld,
  laneCount,
  laneY,
  renderX,
  stepWorld,
} from './world';

/** Deterministic stand-in for Math.random. */
const fixedRandom = (value: number) => () => value;

describe('world', () => {
  it('starts with one target off the right edge', () => {
    const world = createWorld(fixedRandom(0));
    expect(world.targets).toHaveLength(1);
    const [target] = world.targets;
    expect(target?.x).toBe(SPAWN_X);
    expect(PLACEHOLDER_WORDS).toContain(target?.text);
  });

  it('places every lane inside the page', () => {
    for (let lane = 0; lane < laneCount(); lane++) {
      expect(laneY(lane)).toBeGreaterThan(0);
      expect(laneY(lane)).toBeLessThan(WORLD_HEIGHT);
    }
  });

  it('moves targets left at their speed', () => {
    const world = createWorld(fixedRandom(0));
    const target = world.targets[0]!;
    target.speed = 100;
    stepWorld(world, 500);
    expect(target.x).toBeCloseTo(SPAWN_X - 50);
    expect(target.prevX).toBe(SPAWN_X);
  });

  it('interpolates render position between steps', () => {
    const world = createWorld(fixedRandom(0));
    const target = world.targets[0]!;
    target.speed = 100;
    stepWorld(world, 1000);
    expect(renderX(target, 0)).toBe(SPAWN_X);
    expect(renderX(target, 0.5)).toBeCloseTo(SPAWN_X - 50);
    expect(renderX(target, 1)).toBeCloseTo(SPAWN_X - 100);
  });

  it('counts a margin hit and respawns when a target crosses the margin', () => {
    const world = createWorld(fixedRandom(0.5));
    const first = world.targets[0]!;
    first.x = MARGIN_X + 1;
    first.speed = 1000;

    stepWorld(world, 16);

    expect(world.marginHits).toBe(1);
    expect(world.targets).toHaveLength(1);
    const next = world.targets[0]!;
    expect(next.id).not.toBe(first.id);
    expect(next.x).toBe(SPAWN_X);
    expect(next.prevX).toBe(SPAWN_X);
  });

  it('never picks outside the word list, even at random() edges', () => {
    const world = createWorld(fixedRandom(0.9999999));
    expect(PLACEHOLDER_WORDS).toContain(world.targets[0]?.text);
  });
});

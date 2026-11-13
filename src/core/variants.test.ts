import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, pageParams, variantChances } from './config';
import { cycleLock, typeChar } from './input';
import { GHOST_REVEAL_X, createWorld, isRevealed, spawnTarget, type World } from './world';

function playingWorld(random: () => number = () => 0.5): World {
  const world = createWorld({ random, keys: [...'abcdefghijklmnopqrstuvwxyz'] });
  world.phase = 'playing';
  return world;
}

const type = (world: World, text: string) => {
  for (const ch of text) typeChar(world, ch);
};

describe('variant chances', () => {
  it('start at zero, then grow chapter by chapter up to a cap', () => {
    expect(variantChances('blotling', 0, 'normal')).toEqual({ crimson: 0, violet: 0, ghost: 0 });
    const ch2 = variantChances('blotling', 1, 'normal');
    expect(ch2.crimson).toBeGreaterThan(0);
    expect(ch2.violet).toBe(0);
    const late = variantChances('blotling', 50, 'normal');
    expect(late.crimson).toBe(GAME_CONFIG.variants.crimson.max);
    expect(late.violet).toBe(GAME_CONFIG.variants.violet.max);
  });

  it('scale with difficulty', () => {
    expect(variantChances('drip', 3, 'expert').crimson).toBeGreaterThan(variantChances('drip', 3, 'relaxed').crimson);
  });

  it('never apply to Run-ons or Misprints', () => {
    expect(variantChances('runon', 9, 'expert')).toEqual({ crimson: 0, violet: 0, ghost: 0 });
    expect(variantChances('misprint', 9, 'expert')).toEqual({ crimson: 0, violet: 0, ghost: 0 });
  });

  it('are part of the page settings', () => {
    expect(pageParams('normal', 3, 0).variants).toEqual(variantChances(pageParams('normal', 3, 0).kind, 3, 'normal'));
  });
});

describe('spawning variants', () => {
  it('rolls lives and ghosts from the page chances', () => {
    const world = playingWorld(() => 0);
    world.page.params = { ...world.page.params, variants: { crimson: 0, violet: 0.5, ghost: 0.5 } };
    const t = spawnTarget(world)!;
    expect(t.lives).toBe(3);
    expect(t.ghost).toBe(true);

    const plain = playingWorld(() => 0.99);
    plain.page.params = { ...plain.page.params, variants: { crimson: 0.5, violet: 0.2, ghost: 0.5 } };
    const p = spawnTarget(plain)!;
    expect(p.lives).toBe(1);
    expect(p.ghost).toBe(false);
  });
});

describe('lives', () => {
  it('a crimson Blotling needs two words in a row and keeps the lock', () => {
    const world = playingWorld();
    const t = spawnTarget(world, { kind: 'blotling', text: 'ink', lives: 2, x: 500, prevX: 500, lane: 0 })!;
    type(world, 'ink');

    expect(world.targets).toContain(t);
    expect(t.lives).toBe(1);
    expect(t.typed).toBe(0);
    expect(t.x).toBe(500);
    expect(world.lockedId).toBe(t.id);
    expect(world.stats.destroyed).toBe(0);
    expect(world.events.some((e) => e.type === 'hit')).toBe(true);

    type(world, t.text);
    expect(world.targets).not.toContain(t);
    expect(world.stats.destroyed).toBe(1);
  });

  it('scores a completion bonus for every life', () => {
    const one = playingWorld();
    spawnTarget(one, { kind: 'drip', text: 'a', lives: 1, x: 500, prevX: 500, lane: 0 });
    type(one, 'a');

    const three = playingWorld();
    const v = spawnTarget(three, { kind: 'drip', text: 'a', lives: 3, x: 500, prevX: 500, lane: 0 })!;
    type(three, 'a');
    type(three, v.text);
    type(three, v.text);
    expect(three.stats.destroyed).toBe(1);
    expect(three.stats.score).toBeGreaterThan(one.stats.score * 2.5);
  });
});

describe('ghosts', () => {
  it('cannot be typed or tabbed to until halfway across', () => {
    const world = playingWorld();
    const g = spawnTarget(world, { kind: 'drip', text: 'q', ghost: true, x: GHOST_REVEAL_X + 50, prevX: GHOST_REVEAL_X + 50, lane: 0 })!;
    expect(isRevealed(g)).toBe(false);
    typeChar(world, 'q');
    expect(world.targets).toContain(g);
    expect(world.stats.errors).toBe(1);
    cycleLock(world);
    expect(world.lockedId).toBeNull();

    g.x = GHOST_REVEAL_X - 1;
    expect(isRevealed(g)).toBe(true);
    typeChar(world, 'q');
    expect(world.targets).not.toContain(g);
  });
});

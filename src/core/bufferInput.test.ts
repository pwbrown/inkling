import { describe, expect, it } from 'vitest';
import { cycleLock, editKey, typeChar } from './input';
import { createWorld, spawnTarget, type World } from './world';

function playingWorld(): World {
  const world = createWorld({ random: () => 0.5, keys: [...'abcdefghijklmnopqrstuvwxyz '] });
  world.phase = 'playing';
  return world;
}

const runon = (world: World, text: string, x = 500, lane = 0) =>
  spawnTarget(world, { kind: 'runon', text, buffer: '', cursor: 0, x, prevX: x, lane })!;

const type = (world: World, text: string) => {
  for (const ch of text) typeChar(world, ch);
};

describe('Run-ons', () => {
  it('locks on the first letter and finishes when the phrase is typed', () => {
    const world = playingWorld();
    const r = runon(world, 'ink pot');
    type(world, 'ink pot');
    expect(world.targets).not.toContain(r);
    expect(world.stats.correct).toBe(7);
    expect(world.stats.destroyed).toBe(1);
  });

  it('keeps mistakes in the buffer until Backspace removes them', () => {
    const world = playingWorld();
    const r = runon(world, 'ink pot');
    type(world, 'inx');
    expect(r.buffer).toBe('inx');
    expect(r.typed).toBe(2);
    expect(world.stats.errors).toBe(1);
    expect(world.stats.missedKeys).toEqual({ k: 1 });

    // Typing on after a mistake is another mistake, even if it's the "right" letter.
    typeChar(world, 'k');
    expect(r.buffer).toBe('inxk');
    expect(world.stats.errors).toBe(2);

    editKey(world, 'backspace');
    editKey(world, 'backspace');
    expect(r.buffer).toBe('in');
    type(world, 'k pot');
    expect(world.targets).not.toContain(r);
  });

  it('ignores arrows and Delete: Run-ons are typed left to right', () => {
    const world = playingWorld();
    const r = runon(world, 'ink');
    type(world, 'in');
    editKey(world, 'left');
    editKey(world, 'delete');
    expect(r.buffer).toBe('in');
    expect(r.cursor).toBe(2);
  });
});

describe('Tab', () => {
  it('moves the lock to the next target, nearest first, wrapping', () => {
    const world = playingWorld();
    const a = runon(world, 'ab', 300, 0);
    const b = runon(world, 'cd', 600, 1);
    cycleLock(world);
    expect(world.lockedId).toBe(a.id);
    cycleLock(world);
    expect(world.lockedId).toBe(b.id);
    cycleLock(world);
    expect(world.lockedId).toBe(a.id);
  });

  it('lets a half-typed word be left and picked up later', () => {
    const world = playingWorld();
    const ink = spawnTarget(world, { text: 'ink', kind: 'blotling', x: 300, prevX: 300, lane: 0 })!;
    const nib = spawnTarget(world, { text: 'nib', kind: 'blotling', x: 600, prevX: 600, lane: 1 })!;
    type(world, 'in');
    cycleLock(world);
    expect(world.lockedId).toBe(nib.id);
    type(world, 'nib');
    expect(world.targets).toEqual([ink]);
    typeChar(world, 'k');
    expect(world.targets).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { ABILITIES, abilityCost, abilityUnlockedAt, chargeKeys, eraserKeys, unlockedAbilities } from './abilities';
import { GAME_CONFIG } from './config';
import { restartPage, typeChar, useAbility } from './input';
import { MARGIN_X, WORLD_WIDTH, createWorld, isRevealed, markPageStart, spawnTarget, stepWorld, type World } from './world';

const A = GAME_CONFIG.abilities;

function playingWorld(options: Parameters<typeof createWorld>[0] = {}): World {
  const world = createWorld({ random: () => 0.5, keys: ['a', 's', 'd', 'f'], ...options });
  world.phase = 'playing';
  return world;
}

const drip = (world: World, x = 500) => spawnTarget(world, { kind: 'drip', text: 'a', x, prevX: x, lane: 0 })!;
const run = (world: World, keys: number) => {
  for (let i = 0; i < keys; i++) {
    drip(world);
    typeChar(world, 'a');
  }
};

describe('unlocking', () => {
  it('starts with nothing and adds abilities by Apprentice chapter', () => {
    expect(unlockedAbilities(0, 1)).toEqual([]);
    expect(unlockedAbilities(A.blotter.fromChapter, 1)).toEqual(['blotter']);
    expect(unlockedAbilities(A.blottingPaper.fromChapter, 1)).toEqual(ABILITIES);
  });

  it('also unlocks by player level, for Practice-only players', () => {
    expect(unlockedAbilities(0, A.paperweight.fromLevel)).toEqual(['blotter', 'eraser', 'paperweight']);
    expect(unlockedAbilities(0, A.blottingPaper.fromLevel)).toEqual(ABILITIES);
  });

  it('spaces the unlocks further apart each time', () => {
    const chapters = ABILITIES.map((id) => A[id].fromChapter);
    const gaps = chapters.slice(1).map((c, i) => c - chapters[i]!);
    expect(gaps).toEqual([...gaps].sort((a, b) => a - b));
    expect(new Set(gaps).size).toBe(gaps.length);
    expect(abilityUnlockedAt(A.eraser.fromChapter)).toBe('eraser');
    expect(abilityUnlockedAt(0)).toBeNull();
  });
});

describe('charges', () => {
  it('get harder to earn in later chapters, up to a cap', () => {
    expect(chargeKeys(0, 'relaxed')).toBe(A.chargeKeys.base);
    expect(chargeKeys(10)).toBeGreaterThan(chargeKeys(0));
    expect(chargeKeys(999, 'relaxed')).toBe(A.chargeKeys.max);
    expect(eraserKeys(10)).toBeGreaterThan(eraserKeys(0));
    expect(eraserKeys(999)).toBe(A.eraser.maxKeys);
  });

  it('take longer runs, and the Blotter more of them, on harder difficulties', () => {
    for (const [easier, harder] of [
      ['relaxed', 'normal'],
      ['normal', 'hard'],
      ['hard', 'expert'],
    ] as const) {
      expect(chargeKeys(5, harder)).toBeGreaterThan(chargeKeys(5, easier));
    }
    expect(abilityCost('blotter', 'normal')).toBe(2);
    expect(abilityCost('blotter', 'expert')).toBe(3);
    expect(abilityCost('paperweight', 'expert')).toBe(1);
  });

  it('use the current chapter', () => {
    const world = playingWorld();
    world.page.chapter = 10;
    run(world, chargeKeys(0));
    expect(world.charges).toBe(0);
    run(world, chargeKeys(10) - chargeKeys(0));
    expect(world.charges).toBe(1);
  });

  it('are not earned before any active ability is unlocked', () => {
    const world = playingWorld({ abilities: ['eraser'] });
    run(world, chargeKeys(0) * 2);
    expect(world.charges).toBe(0);
  });

  it('come back on a page restart as they were when it began', () => {
    const world = playingWorld();
    world.charges = 2;
    world.shield = true;
    markPageStart(world);
    drip(world);
    useAbility(world, 'paperweight');
    expect(world.charges).toBe(1);
    restartPage(world);
    expect(world.charges).toBe(2);
    expect(world.shield).toBe(true);
    expect(world.slowMs).toBe(0);
  });
});

describe('Paperweight', () => {
  it('slows every creature for a while, then wears off', () => {
    const world = playingWorld();
    world.page.spawned = world.page.params.size;
    const target = drip(world, 1000);
    target.speed = 100;
    world.charges = 1;
    expect(useAbility(world, 'paperweight')).toBe(true);
    expect(world.charges).toBe(0);
    stepWorld(world, 1000);
    expect(target.x).toBeCloseTo(1000 - 100 * A.paperweight.speedFactor);

    stepWorld(world, A.paperweight.durationMs);
    expect(world.slowMs).toBe(0);
    expect(world.events).toContainEqual({ type: 'abilityEnded', id: 'paperweight' });
    const before = target.x;
    stepWorld(world, 1000);
    expect(target.x).toBeCloseTo(before - 100);
  });

  it('needs a charge, to be unlocked, and not to be running already', () => {
    const world = playingWorld();
    expect(useAbility(world, 'paperweight')).toBe(false);
    world.charges = 2;
    expect(useAbility(world, 'paperweight')).toBe(true);
    expect(useAbility(world, 'paperweight')).toBe(false);
    expect(world.charges).toBe(1);

    const locked = playingWorld({ abilities: ['blotter'] });
    locked.charges = 3;
    expect(useAbility(locked, 'paperweight')).toBe(false);
  });
});

describe('Highlighter', () => {
  it('shows ghost text and doubles points while it lasts', () => {
    const world = playingWorld();
    world.page.spawned = world.page.params.size;
    const ghost = spawnTarget(world, { kind: 'drip', text: 'a', x: WORLD_WIDTH - 10, prevX: WORLD_WIDTH - 10, lane: 0, ghost: true, revealX: 700 })!;
    expect(isRevealed(ghost)).toBe(false);
    world.charges = 1;
    expect(useAbility(world, 'highlighter')).toBe(true);
    expect(isRevealed(ghost)).toBe(true);

    typeChar(world, 'a');
    const { perChar, perTarget } = GAME_CONFIG.points;
    expect(world.stats.score).toBe((perChar + perTarget) * A.highlighter.pointsFactor);

    // Something still on the page, so it isn't cleared while the time runs out.
    spawnTarget(world, { kind: 'drip', text: 's', x: 1200, prevX: 1200, lane: 1, speed: 0 });
    stepWorld(world, A.highlighter.durationMs);
    expect(world.highlightMs).toBe(0);
    drip(world);
    typeChar(world, 'a');
    expect(world.stats.score).toBe((perChar + perTarget) * (A.highlighter.pointsFactor + 1));
  });
});

describe('Eraser', () => {
  it('arms after a clean run and forgives the next wrong key', () => {
    const fresh = playingWorld({ difficulty: 'hard' });
    run(fresh, eraserKeys(0));
    expect(fresh.eraser).toBe(true);
    expect(fresh.events).toContainEqual({ type: 'passiveReady', id: 'eraser' });

    const { score, combo } = fresh.stats;
    const ink = fresh.ink;
    typeChar(fresh, 'z');
    expect(fresh.eraser).toBe(false);
    expect(fresh.stats.errors).toBe(0);
    expect(fresh.stats.score).toBe(score);
    expect(fresh.stats.combo).toBe(combo);
    expect(fresh.ink).toBe(ink);
    expect(fresh.events.some((e) => e.type === 'eraserUsed')).toBe(true);

    // More slips in the next second are quietly ignored…
    typeChar(fresh, 'z');
    typeChar(fresh, 'x');
    expect(fresh.stats.errors).toBe(0);
    expect(fresh.stats.combo).toBe(combo);
    expect(fresh.ink).toBe(ink);
    expect(fresh.stats.missedKeys).toEqual({});

    // …and once the grace is over, the next slip counts as usual.
    fresh.page.spawned = fresh.page.params.size;
    drip(fresh);
    stepWorld(fresh, A.eraser.graceMs);
    typeChar(fresh, 'z');
    expect(fresh.stats.errors).toBe(1);
    expect(fresh.stats.combo).toBe(0);
  });
});

describe('Blotting paper', () => {
  it('is earned by a page with no leaks and soaks up the next creature at the margin', () => {
    const world = playingWorld();
    world.page.spawned = world.page.params.size;
    stepWorld(world, 16);
    expect(world.phase).toBe('pageCleared');
    expect(world.shield).toBe(true);
    expect(world.shieldEarned).toBe(true);

    world.phase = 'playing';
    world.page.spawned = 0;
    world.stats.combo = 5;
    drip(world, MARGIN_X + 0.1);
    const ink = world.ink;
    stepWorld(world, 16);
    expect(world.ink).toBe(ink);
    expect(world.stats.leaks).toBe(0);
    expect(world.stats.combo).toBe(5);
    expect(world.shield).toBe(false);
    expect(world.events.some((e) => e.type === 'shieldUsed')).toBe(true);

    drip(world, MARGIN_X + 0.1);
    stepWorld(world, 16);
    expect(world.ink).toBeLessThan(ink);
  });

  it('is not earned after a leak, or before it is unlocked', () => {
    const leaky = playingWorld();
    leaky.page.spawned = leaky.page.params.size;
    leaky.pageStats.leaks = 1;
    stepWorld(leaky, 16);
    expect(leaky.shield).toBe(false);

    const early = playingWorld({ abilities: ['blotter'] });
    early.page.spawned = early.page.params.size;
    stepWorld(early, 16);
    expect(early.shield).toBe(false);
  });
});

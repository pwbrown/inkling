import { describe, expect, it } from 'vitest';
import { createContentSource } from '../content/contentSource';
import { aboutToSquirt, canStart, shuffleRest, squidGuards } from './bosses';
import { GAME_CONFIG, type BossKind } from './config';
import { cycleLock, typeChar, useBlotter } from './input';
import { MARGIN_X, WORLD_WIDTH, createWorld, estimateWidth, spawnBoss, stepWorld, type Target, type World } from './world';

/** A small seeded random source, so runs repeat but never get stuck on one value. */
function seeded(seed = 7): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function bossWorld(kind: BossKind): { world: World; boss: Target } {
  const world = createWorld({ random: seeded(), content: createContentSource({ keys: [...'abcdefghijklmnopqrstuvwxyz'] }) });
  world.phase = 'playing';
  world.page.hasBoss = true;
  world.page.bossKind = kind;
  // No ordinary spawns: just the boss.
  world.page.spawned = world.page.params.size;
  const boss = spawnBoss(world);
  return { world, boss };
}

/** Let everything finish rushing in. */
function settle(world: World): void {
  for (let i = 0; i < 200 && world.targets.some((t) => t.entering); i++) stepWorld(world, 16);
}

const type = (world: World, text: string) => {
  for (const ch of text) typeChar(world, ch);
};

describe('the Shuffler', () => {
  it('reshuffles only the letters not yet typed', () => {
    const target = { text: 'pencil', typed: 2 } as Target;
    expect(shuffleRest(target, seeded())).toBe(true);
    expect(target.text.slice(0, 2)).toBe('pe');
    expect([...target.text.slice(2)].sort().join('')).toBe('ciln');
    expect(target.text.slice(2)).not.toBe('ncil');
    expect(shuffleRest({ text: 'aaa', typed: 0 } as Target, seeded())).toBe(false);
  });

  it('mixes up its word every few seconds while you type it', () => {
    const { world, boss } = bossWorld('shuffler');
    settle(world);
    boss.text = 'abcdefgh';
    typeChar(world, 'a');
    expect(boss.typed).toBe(1);
    stepWorld(world, GAME_CONFIG.boss.shuffler.shuffleMs + 16);
    expect(boss.text[0]).toBe('a');
    expect(boss.text).not.toBe('abcdefgh');
    expect([...boss.text].sort().join('')).toBe('abcdefgh');
    expect(world.events.some((e) => e.type === 'bossShuffled')).toBe(true);
  });
});

describe('the Bookworm', () => {
  it('comes in nose to tail, and only its head can be typed', () => {
    const { world } = bossWorld('bookworm');
    settle(world);
    const segments = world.targets.filter((t) => t.bossKind === 'bookworm').sort((a, b) => a.x - b.x);
    expect(segments.length).toBeGreaterThanOrEqual(GAME_CONFIG.boss.bookworm.segmentsMin);
    expect(new Set(segments.map((t) => t.lane)).size).toBe(1);
    for (let i = 1; i < segments.length; i++) {
      const ahead = segments[i - 1]!;
      expect(segments[i]!.x).toBeGreaterThanOrEqual(ahead.x + estimateWidth(ahead, world.targetScale) - 0.5);
    }
    expect(segments.filter((t) => t.head)).toEqual([segments[0]]);
    expect(canStart(world, segments[1]!)).toBe(false);
  });

  it('pops head first, speeds the rest up, and is defeated with the last segment', () => {
    const { world } = bossWorld('bookworm');
    settle(world);
    const segments = world.targets.filter((t) => t.bossKind === 'bookworm').sort((a, b) => a.x - b.x);
    const speed = segments[1]!.speed;
    type(world, segments[0]!.text);
    expect(world.targets).not.toContain(segments[0]);
    expect(segments[1]!.head).toBe(true);
    expect(segments[1]!.speed).toBeCloseTo(speed * (1 + GAME_CONFIG.boss.bookworm.speedStep));
    // The rest slide onto the page one by one; type each head as it shows.
    for (const segment of segments.slice(1)) {
      for (let i = 0; i < 2000 && segment.x + estimateWidth(segment, world.targetScale) > WORLD_WIDTH; i++) stepWorld(world, 16);
      expect(segment.head).toBe(true);
      type(world, segment.text);
    }
    expect(world.targets).toEqual([]);
    expect(world.stats.errors).toBe(0);
    expect(world.events.some((e) => e.type === 'bossDefeated')).toBe(true);
  });
});

describe('the Inkwell Squid', () => {
  it('guards its body with tentacles that must go first', () => {
    const { world, boss } = bossWorld('squid');
    settle(world);
    const tentacles = world.targets.filter((t) => t.partOf === boss.id);
    expect(tentacles).toHaveLength(GAME_CONFIG.boss.squid.tentacles);
    expect(canStart(world, boss)).toBe(false);
    // Tab skips the body while it's guarded.
    for (let i = 0; i < 6; i++) {
      cycleLock(world);
      expect(world.lockedId).not.toBe(boss.id);
    }
    world.lockedId = null;
    for (const tentacle of tentacles) type(world, tentacle.text);
    expect(canStart(world, boss)).toBe(true);
    for (let life = 0; life < GAME_CONFIG.boss.squid.lives; life++) type(world, boss.text);
    expect(world.targets).toEqual([]);
    expect(world.events.some((e) => e.type === 'bossDefeated')).toBe(true);
  });

  it('keeps its tentacles attached as it moves, and loses a guard for each one beaten', () => {
    const { world, boss } = bossWorld('squid');
    settle(world);
    const tentacles = world.targets.filter((t) => t.partOf === boss.id);
    const offsets = tentacles.map((t) => t.x - boss.x);
    for (let i = 0; i < 40; i++) stepWorld(world, 50);
    expect(tentacles.map((t) => t.x - boss.x)).toEqual(offsets);
    expect(squidGuards(world, boss).left.size).toBe(tentacles.length);
    expect(squidGuards(world, boss).total).toBe(tentacles.length);
    type(world, tentacles[0]!.text);
    expect(squidGuards(world, boss).left.has(tentacles[0]!.partIndex!)).toBe(false);
    expect(squidGuards(world, boss).left.size).toBe(tentacles.length - 1);
  });

  it('warns before a tentacle squirts, but not while it is being typed', () => {
    const { world, boss } = bossWorld('squid');
    settle(world);
    const tentacle = world.targets.find((t) => t.partOf === boss.id)!;
    tentacle.bossTimerMs = GAME_CONFIG.boss.squid.warnMs + 100;
    expect(aboutToSquirt(world, tentacle)).toBe(false);
    tentacle.bossTimerMs = GAME_CONFIG.boss.squid.warnMs - 100;
    expect(aboutToSquirt(world, tentacle)).toBe(true);
    world.lockedId = tentacle.id;
    expect(aboutToSquirt(world, tentacle)).toBe(false);
  });

  it('squirts ink over a lane when a tentacle is left alone', () => {
    const { world, boss } = bossWorld('squid');
    settle(world);
    boss.speed = 0;
    for (const t of world.targets) t.speed = 0;
    let squirted = false;
    for (let ms = 0; ms < GAME_CONFIG.boss.squid.squirtMs * 2 && !squirted; ms += 50) {
      stepWorld(world, 50);
      squirted = world.events.some((e) => e.type === 'squirt');
    }
    expect(squirted).toBe(true);
    expect(world.smudges.length).toBeGreaterThan(0);
    // It lands on the page, in line with where it came from.
    for (const smudge of world.smudges) {
      expect(smudge.x).toBeGreaterThan(MARGIN_X);
      expect(smudge.x).toBeLessThan(WORLD_WIDTH);
    }
    stepWorld(world, GAME_CONFIG.boss.squid.smudgeMs + 16);
    // That smudge has worn off (another tentacle may have squirted meanwhile).
    expect(world.smudges.every((s) => s.ms <= GAME_CONFIG.boss.squid.smudgeMs)).toBe(true);
  });
});

describe('the Rival Quill', () => {
  it('splashes you and starts a new word if it finishes first', () => {
    const { world, boss } = bossWorld('quill');
    settle(world);
    boss.speed = 0;
    const word = boss.text;
    const ink = world.ink;
    let won = false;
    for (let ms = 0; ms < 30_000 && !won; ms += 50) {
      stepWorld(world, 50);
      won = world.events.some((e) => e.type === 'quillWins');
      world.events.length = won ? world.events.length : 0;
    }
    expect(won).toBe(true);
    expect(world.ink).toBe(ink - GAME_CONFIG.boss.quill.inkLoss);
    expect(boss.text).not.toBe(word);
    expect(boss.rival).toBe(0);
    expect(boss.lives).toBe(GAME_CONFIG.boss.lives);
  });

  it('loses a round when you finish first, and restarts its race', () => {
    const { world, boss } = bossWorld('quill');
    settle(world);
    stepWorld(world, GAME_CONFIG.boss.quill.startDelayMs);
    stepWorld(world, 500);
    expect(boss.rival).toBeGreaterThan(0);
    type(world, boss.text);
    expect(boss.lives).toBe(GAME_CONFIG.boss.lives - 1);
    expect(boss.rival).toBe(0);
    expect(boss.bossTimerMs).toBe(GAME_CONFIG.boss.quill.startDelayMs);
  });
});

describe('every boss', () => {
  it('rushes in fully on the page, and the Blotter cannot touch any part of it', () => {
    for (const kind of GAME_CONFIG.boss.order) {
      const { world, boss } = bossWorld(kind);
      settle(world);
      expect(boss.x + estimateWidth(boss, world.targetScale)).toBeLessThanOrEqual(WORLD_WIDTH);
      const count = world.targets.length;
      world.charges = GAME_CONFIG.abilities.maxCharges;
      useBlotter(world);
      expect(world.targets).toHaveLength(count);
    }
  });
});

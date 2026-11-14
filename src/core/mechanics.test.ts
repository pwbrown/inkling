import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from './config';
import { confirm, startApprentice, startPractice } from './input';
import { MAX_BRIEFINGS, MECHANICS, mechanicsForPage, pendingBriefings } from './mechanics';
import { createPage, createWorld, stepWorld, type World } from './world';

const LETTERS = [...'abcdefghijklmnopqrstuvwxyz;', ' '];

function apprentice(chapter: number, page = 0, abilities: World['abilities'] = []): World {
  const world = createWorld({ random: () => 0.5, keys: LETTERS, abilities });
  world.mode = 'apprentice';
  world.page = createPage('normal', chapter, page, world.content, 'apprentice');
  return world;
}

describe('mechanicsForPage', () => {
  it('starts with just the basics', () => {
    expect(mechanicsForPage(apprentice(0))).toEqual(['basics']);
  });

  it('adds Blotlings on the first word page', () => {
    const world = apprentice(0, 2);
    expect(world.page.params.kind).toBe('blotling');
    expect(mechanicsForPage(world)).toEqual(['basics', 'blotling', 'combo', 'recovery']);
  });

  it('follows the rules for when tougher things arrive', () => {
    const firstWith = (id: string) => {
      for (let chapter = 0; chapter < 27; chapter++) {
        const pages = createPage('normal', chapter, 0, undefined, 'apprentice').pageCount;
        for (let page = 0; page < pages; page++) if (mechanicsForPage(apprentice(chapter, page)).includes(id as never)) return chapter;
      }
      return -1;
    };
    expect(firstWith('spill')).toBe(GAME_CONFIG.boss.fromApprenticeChapter);
    expect(firstWith('mistakes')).toBe(GAME_CONFIG.mistakes.fromApprenticeChapter);
    expect(firstWith('runon')).toBe(GAME_CONFIG.sprinkles.runon.fromApprenticeChapter);
    expect(firstWith('misprint')).toBe(GAME_CONFIG.sprinkles.misprint.fromApprenticeChapter);
    expect(firstWith('crimson')).toBeGreaterThan(0);
    expect(firstWith('violet')).toBeGreaterThan(firstWith('crimson'));
  });

  it('never teaches ink-costing mistakes on Relaxed', () => {
    const world = apprentice(20);
    world.difficulty = 'relaxed';
    expect(mechanicsForPage(world)).not.toContain('mistakes');
  });

  it('includes unlocked abilities, in teaching order', () => {
    const got = mechanicsForPage(apprentice(3, 0, ['eraser', 'blotter']));
    expect(got.slice(-2)).toEqual(['blotter', 'eraser']);
    expect(got).toEqual(MECHANICS.filter((id) => got.includes(id)));
  });
});

describe('briefings', () => {
  it('show only what is new, a few at a time', () => {
    const world = apprentice(0, 2);
    expect(pendingBriefings(world, [])).toHaveLength(MAX_BRIEFINGS);
    expect(pendingBriefings(world, ['basics', 'blotling'])).toEqual(['combo', 'recovery']);
    expect(pendingBriefings(world, [...MECHANICS])).toEqual([]);
  });

  it('are skipped when tips are off', () => {
    const world = createWorld({ random: () => 0.5, keys: LETTERS });
    startPractice(world);
    expect(world.phase).toBe('playing');
  });

  it('come before the page, then mark what was shown as seen', () => {
    const world = createWorld({ random: () => 0.5, keys: LETTERS, abilities: [] });
    world.tips = true;
    startApprentice(world, 0);
    expect(world.phase).toBe('intro');
    confirm(world);
    expect(world.phase).toBe('briefing');
    expect(world.briefing).toEqual(['basics']);
    confirm(world);
    expect(world.phase).toBe('playing');
    expect(world.seenMechanics).toEqual(['basics']);
  });

  it('hand over a new ability ready to try', () => {
    const world = createWorld({ random: () => 0.5, keys: LETTERS, abilities: ['blotter', 'eraser'] });
    world.tips = true;
    world.seenMechanics = MECHANICS.filter((id) => id !== 'blotter' && id !== 'eraser');
    startPractice(world);
    expect(world.briefing).toEqual(['blotter', 'eraser']);
    confirm(world);
    expect(world.charges).toBe(GAME_CONFIG.abilities.blotter.cost);
    expect(world.eraser).toBe(true);
  });
});

describe('guided first try', () => {
  it('sends the new creature alone and slowed, and holds the page until it is dealt with', () => {
    const world = apprentice(0, 2);
    world.tips = true;
    world.seenMechanics = ['basics'];
    world.phase = 'intro';
    confirm(world);
    expect(world.briefing).toContain('blotling');
    confirm(world);
    expect(world.guide?.id).toBe('blotling');

    stepWorld(world, 16);
    expect(world.targets).toHaveLength(1);
    const first = world.targets[0]!;
    expect(first.kind).toBe('blotling');
    expect(first.speed).toBeLessThan(world.page.params.speed);
    expect(world.events.some((e) => e.type === 'guide')).toBe(true);

    // Nothing else arrives while it's on the page…
    for (let i = 0; i < 200; i++) stepWorld(world, 16);
    expect(world.targets).toEqual([first]);

    // …and the page carries on once it's gone.
    world.targets = [];
    for (let i = 0; i < 400 && world.targets.length === 0; i++) stepWorld(world, 16);
    expect(world.guide).toBeNull();
    expect(world.targets.length).toBeGreaterThan(0);
  });

  it('gives a crimson creature two lives', () => {
    const world = apprentice(8, 0);
    world.phase = 'briefing';
    world.briefing = ['crimson'];
    confirm(world);
    stepWorld(world, 16);
    expect(world.targets[0]?.lives).toBe(2);
  });
});

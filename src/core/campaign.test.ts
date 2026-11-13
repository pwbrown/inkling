import { describe, expect, it } from 'vitest';
import { createContentSource } from '../content/contentSource';
import {
  APPRENTICE_CHAPTERS,
  LESSONS,
  apprenticeKeys,
  apprenticePlan,
  chapterStars,
  hasSpill,
  newKeysFor,
  starKey,
  starText,
  starsForGrade,
  totalStars,
} from './campaign';
import { confirm, finishedNotebook, retryChapter, startApprentice, startPractice } from './input';
import { createPage, createWorld, type World } from './world';

describe('lessons', () => {
  it('teach every letter exactly once, starting with F and J, then one key at a time', () => {
    const all = LESSONS.flatMap((l) => l.newKeys);
    expect(new Set(all).size).toBe(all.length);
    for (const letter of 'abcdefghijklmnopqrstuvwxyz') expect(all).toContain(letter);
    expect(newKeysFor(0)).toEqual(['f', 'j']);
    for (let c = 1; c < APPRENTICE_CHAPTERS; c++) expect(newKeysFor(c)).toHaveLength(1);
  });

  it('start with drips only while there are few keys', () => {
    expect(apprenticePlan(0)).toEqual(['drip', 'drip', 'drip']);
    expect(apprenticePlan(APPRENTICE_CHAPTERS - 1)).toContain('blotling');
  });

  it('build up keys chapter by chapter', () => {
    expect(apprenticeKeys(0)).toEqual(newKeysFor(0));
    expect(apprenticeKeys(1)).toEqual([...newKeysFor(0), ...newKeysFor(1)]);
    expect(apprenticeKeys(APPRENTICE_CHAPTERS - 1)).toHaveLength(LESSONS.flatMap((l) => l.newKeys).length);
  });

  it('only plan Run-ons once space is learned', () => {
    for (let c = 0; c < APPRENTICE_CHAPTERS; c++) {
      if (apprenticePlan(c).includes('runon')) expect(apprenticeKeys(c)).toContain(' ');
      expect(apprenticePlan(c)[0]).toBe('drip');
    }
  });
});

describe('stars', () => {
  it('come from the page grade', () => {
    expect(starsForGrade('A+')).toBe(3);
    expect(starsForGrade('A')).toBe(3);
    expect(starsForGrade('B')).toBe(2);
    expect(starsForGrade('C')).toBe(2);
    expect(starsForGrade('D')).toBe(1);
    expect(starsForGrade('F')).toBe(1);
  });

  it('add up per chapter and in total', () => {
    const stars = { [starKey(0, 0)]: 3, [starKey(0, 2)]: 1, [starKey(1, 0)]: 2 };
    expect(chapterStars(stars, 0)).toEqual({ earned: 4, max: apprenticePlan(0).length * 3 });
    expect(totalStars(stars).earned).toBe(6);
    expect(starText(2)).toBe('★★☆');
  });
});

/** A world whose content tracks the keys it was given, like main.ts's. */
function apprenticeWorld(): World {
  return createWorld({
    random: () => 0.5,
    makeContent: (keys) => createContentSource({ keys }),
  });
}

describe('Apprentice flow', () => {
  it("starts a chapter on its new-keys card, with that chapter's keys", () => {
    const world = apprenticeWorld();
    startApprentice(world, 2, 'hard');
    expect(world.phase).toBe('intro');
    expect(world.mode).toBe('apprentice');
    expect(world.difficulty).toBe('hard');
    expect(world.keys).toEqual(apprenticeKeys(2));
    expect(world.page.pageCount).toBe(apprenticePlan(2).length);
    confirm(world);
    expect(world.phase).toBe('playing');
  });

  it('moves to the next chapter with new keys and a new card', () => {
    const world = apprenticeWorld();
    startApprentice(world, 0);
    confirm(world);
    world.page = createPage(world.difficulty, 0, world.page.pageCount - 1, world.content, 'apprentice');
    world.phase = 'pageCleared';
    confirm(world);
    expect(world.page.chapter).toBe(1);
    expect(world.phase).toBe('intro');
    expect(world.keys).toEqual(apprenticeKeys(1));
  });

  it('completes the notebook after the last chapter', () => {
    const world = apprenticeWorld();
    const last = APPRENTICE_CHAPTERS - 1;
    startApprentice(world, last);
    world.page = createPage(world.difficulty, last, world.page.pageCount - 1, world.content, 'apprentice');
    world.phase = 'pageCleared';
    expect(finishedNotebook(world)).toBe(true);
    confirm(world);
    expect(world.phase).toBe('notebookComplete');
  });

  it('retries a chapter without leaving Apprentice mode', () => {
    const world = apprenticeWorld();
    startApprentice(world, 3);
    confirm(world);
    world.phase = 'gameOver';
    retryChapter(world);
    expect(world.mode).toBe('apprentice');
    expect(world.page.chapter).toBe(3);
    expect(world.keys).toEqual(apprenticeKeys(3));
  });

  it('Practice never completes and keeps its own chapters', () => {
    const world = apprenticeWorld();
    startPractice(world);
    expect(world.mode).toBe('practice');
    expect(world.phase).toBe('playing');
    world.page = createPage(world.difficulty, 50, world.page.pageCount - 1, world.content);
    world.phase = 'pageCleared';
    expect(finishedNotebook(world)).toBe(false);
  });
});

describe('Apprentice pacing', () => {
  it('starts far gentler than Practice and eases in', () => {
    const first = createPage('normal', 0, 0, undefined, 'apprentice').params;
    const practice = createPage('normal', 0, 0, undefined, 'practice').params;
    expect(first.speed).toBeLessThan(practice.speed);
    expect(first.spawnIntervalMs).toBeGreaterThan(practice.spawnIntervalMs);
    expect(first.maxOnScreen).toBeLessThan(practice.maxOnScreen);
    expect(first.size).toBeLessThan(practice.size);

    const later = createPage('normal', 8, 0, undefined, 'apprentice').params;
    expect(later.speed).toBeGreaterThan(first.speed);
  });

  it('keeps tougher variants away from beginners', () => {
    for (let c = 0; c < 4; c++) {
      const v = createPage('normal', c, 0, undefined, 'apprentice').params.variants;
      expect(v).toEqual({ crimson: 0, violet: 0, ghost: 0 });
    }
  });

  it('only brings the Spill once the basics are learned', () => {
    expect(hasSpill(0)).toBe(false);
    expect(hasSpill(APPRENTICE_CHAPTERS - 1)).toBe(true);
  });
});

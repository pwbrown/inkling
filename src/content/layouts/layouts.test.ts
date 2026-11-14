import { describe, expect, it } from 'vitest';
import { APPRENTICE_CHAPTERS, SPACE_CHAPTER } from '../../core/campaign';
import { COLEMAK, DVORAK, LAYOUTS, LAYOUT_IDS, US_QWERTY, findKey, isLayoutId, layoutById } from './index';
import type { LayoutKey } from './types';

const LETTERS = [...'abcdefghijklmnopqrstuvwxyz'];
const keysOf = (rows: LayoutKey[][]) => rows.flat();
const codesOf = (rows: LayoutKey[][]) => rows.map((row) => row.map((k) => k.code));

describe('layouts', () => {
  it('are listed by unique id and found by id, falling back to US QWERTY', () => {
    expect(LAYOUT_IDS).toEqual(['us-qwerty', 'dvorak', 'colemak']);
    expect(layoutById('dvorak')).toBe(DVORAK);
    expect(layoutById('nope')).toBe(US_QWERTY);
    expect(isLayoutId('colemak')).toBe(true);
    expect(isLayoutId('azerty')).toBe(false);
  });

  it('keep US QWERTY exactly as it was before layouts were built from data', () => {
    const plain = (k: LayoutKey) => [k.code, k.base, k.shift, k.hand, k.finger, k.width].join('|');
    // A few keys from the old hand-written table.
    expect(plain(findKey(US_QWERTY, 'f')!)).toBe('KeyF|f|F|left|index|');
    expect(plain(findKey(US_QWERTY, ';')!)).toBe('Semicolon|;|:|right|pinky|');
    expect(plain(findKey(US_QWERTY, '`')!)).toBe('Backquote|`|~|left|pinky|');
    expect(plain(findKey(US_QWERTY, '6')!)).toBe('Digit6|6|^|right|index|');
    expect(plain(findKey(US_QWERTY, ',')!)).toBe('Comma|,|<|right|middle|');
    expect(plain(findKey(US_QWERTY, ' ')!)).toBe('Space| ||both|thumb|6');
    expect(US_QWERTY.rows.map((row) => row.map((k) => k.base).join(''))).toEqual([
      '`1234567890-=',
      'qwertyuiop[]\\',
      "asdfghjkl;'",
      'zxcvbnm,./',
      ' ',
    ]);
  });

  for (const layout of LAYOUTS) {
    describe(layout.id, () => {
      it('uses the same physical keys and fingering as US QWERTY', () => {
        expect(codesOf(layout.rows)).toEqual(codesOf(US_QWERTY.rows));
        const fingering = (rows: LayoutKey[][]) => keysOf(rows).map((k) => `${k.hand}-${k.finger}`);
        expect(fingering(layout.rows)).toEqual(fingering(US_QWERTY.rows));
      });

      it('types every letter on exactly one key, with its capital on Shift', () => {
        for (const letter of LETTERS) {
          const keys = keysOf(layout.rows).filter((k) => k.base === letter);
          expect(keys, letter).toHaveLength(1);
          expect(keys[0]?.shift).toBe(letter.toUpperCase());
        }
      });

      it('never types the same character on two keys', () => {
        const chars = keysOf(layout.rows).flatMap((k) => [k.base, k.shift ?? []].flat());
        expect(new Set(chars).size).toBe(chars.length);
      });

      it('has one home key per finger, on the home row', () => {
        const home = keysOf(layout.rows).filter((k) => k.home);
        expect(home).toHaveLength(8);
        expect(new Set(home.map((k) => `${k.hand}-${k.finger}`)).size).toBe(8);
        for (const key of home) expect(layout.rows[2]).toContain(key);
      });
    });

    describe(`${layout.id} Apprentice course`, () => {
      const lessons = layout.lessons;
      const taught = lessons.flat();
      const homeKeys = keysOf(layout.rows).filter((k) => k.home);

      it(`has ${APPRENTICE_CHAPTERS} chapters, one new key each after the first`, () => {
        expect(lessons).toHaveLength(APPRENTICE_CHAPTERS);
        expect(lessons[0]).toHaveLength(2);
        for (const keys of lessons.slice(1)) expect(keys).toHaveLength(1);
      });

      it('starts with the two home keys under the index fingers', () => {
        const index = homeKeys.filter((k) => k.finger === 'index').map((k) => k.base);
        expect([...lessons[0]!].sort()).toEqual(index.sort());
      });

      it('teaches the rest of the home row next, then space', () => {
        const homeRow = layout.rows[2]!.slice(0, 10).map((k) => k.base);
        expect([...lessons.slice(0, SPACE_CHAPTER).flat()].sort()).toEqual([...homeRow].sort());
        expect(lessons[SPACE_CHAPTER]).toEqual([' ']);
      });

      it('teaches every letter, each key once, and only keys on the layout', () => {
        expect(new Set(taught).size).toBe(taught.length);
        for (const letter of LETTERS) expect(taught).toContain(letter);
        for (const key of taught) expect(findKey(layout, key), key).toBeDefined();
      });
    });
  }

  it('put Dvorak and Colemak letters under the right fingers', () => {
    expect(findKey(DVORAK, 'e')).toMatchObject({ code: 'KeyD', hand: 'left', finger: 'middle', home: true });
    expect(findKey(DVORAK, 'h')).toMatchObject({ code: 'KeyJ', hand: 'right', finger: 'index', home: true });
    expect(findKey(DVORAK, '-')).toMatchObject({ code: 'Quote', base: '-', shift: '_' });
    expect(findKey(DVORAK, ';')).toMatchObject({ code: 'KeyZ', hand: 'left', finger: 'pinky' });
    expect(findKey(COLEMAK, 't')).toMatchObject({ code: 'KeyF', hand: 'left', finger: 'index', home: true });
    expect(findKey(COLEMAK, 'o')).toMatchObject({ code: 'Semicolon', hand: 'right', finger: 'pinky', home: true });
    expect(findKey(COLEMAK, ';')).toMatchObject({ code: 'KeyP', hand: 'right', finger: 'pinky' });
  });

  it('start each course on its own home keys', () => {
    expect(US_QWERTY.lessons[0]).toEqual(['f', 'j']);
    expect(DVORAK.lessons[0]).toEqual(['u', 'h']);
    expect(COLEMAK.lessons[0]).toEqual(['t', 'n']);
  });
});

import { describe, expect, it } from 'vitest';
import { COLEMAK, DVORAK, LAYOUTS, US_QWERTY } from '../content/layouts';
import { DEFAULT_KEYS } from './config';
import {
  REGIONS,
  apprenticePreset,
  builtInPresets,
  homeRowLesson,
  layoutChars,
  matchingPreset,
  orderedSelection,
  regionChars,
  regionState,
  remapSelection,
  toggleRegion,
} from './keySelection';

const layout = US_QWERTY;
const region = (id: Parameters<typeof regionChars>[1]) => regionChars(layout, id);

describe('ANSI layouts', () => {
  for (const each of LAYOUTS) {
    it(`${each.id} produces all 95 printable ASCII characters exactly once`, () => {
      const chars = [...layoutChars(each)];
      expect(chars).toHaveLength(95);
      for (let code = 32; code <= 126; code++) expect(chars).toContain(String.fromCharCode(code));
    });
  }
});

describe('regions', () => {
  it('splits characters by type', () => {
    expect(region('lowercase')).toHaveLength(26);
    expect(region('uppercase')).toHaveLength(26);
    expect(region('digits').join('')).toBe('1234567890');
    expect(region('symbols').join('')).toBe("`-=[]\\;',./");
    expect(region('shiftedSymbols').join('')).toBe('~!@#$%^&*()_+{}|:"<>?');
    expect(region('space')).toEqual([' ']);
  });

  it('splits rows by their unshifted characters', () => {
    expect(region('homeRow').join('')).toBe("asdfghjkl;'");
    expect(region('topRow').join('')).toBe('qwertyuiop[]\\');
    expect(region('bottomRow').join('')).toBe('zxcvbnm,./');
    expect(region('numberRow').join('')).toBe('`1234567890-=');
  });

  it('splits hands without overlap, covering every unshifted key but space', () => {
    const left = region('leftHand');
    const right = region('rightHand');
    expect(left.filter((ch) => right.includes(ch))).toEqual([]);
    expect(left).toContain('g');
    expect(right).toContain('h');
    expect(left.length + right.length).toBe(47);
  });

  it('never returns an empty region', () => {
    for (const id of REGIONS) expect(region(id).length).toBeGreaterThan(0);
  });
});

describe('toggleRegion and regionState', () => {
  const digits = region('digits');

  it('adds the whole region when some or none of it is selected', () => {
    const some = new Set(['1', 'a']);
    expect(regionState(some, digits)).toBe('some');
    const next = toggleRegion(some, digits);
    expect(regionState(next, digits)).toBe('all');
    expect(next.has('a')).toBe(true);
  });

  it('removes the whole region when all of it is selected', () => {
    const next = toggleRegion(new Set([...digits, 'a']), digits);
    expect(regionState(next, digits)).toBe('none');
    expect([...next]).toEqual(['a']);
  });
});

describe('presets', () => {
  const presets = builtInPresets(layout);

  it('have unique ids and only characters the layout can type', () => {
    const all = layoutChars(layout);
    expect(new Set(presets.map((p) => p.id)).size).toBe(presets.length);
    for (const preset of presets) {
      expect(preset.chars.length).toBeGreaterThan(0);
      for (const ch of preset.chars) expect(all.has(ch)).toBe(true);
    }
  });

  it('start new players on the Home row preset', () => {
    expect(matchingPreset(presets, DEFAULT_KEYS)?.id).toBe('homeRow');
  });

  it('match only exact selections', () => {
    expect(matchingPreset(presets, [...DEFAULT_KEYS, 'e', 'r'])).toBeUndefined();
    expect(matchingPreset(presets, [...region('digits')].reverse())?.id).toBe('numbers');
  });

  it('follow the layout: its home row and the first keys taught after it', () => {
    expect(homeRowLesson(US_QWERTY).join('')).toBe('asdfghjkl;');
    expect(homeRowLesson(DVORAK).join('')).toBe('aoeuidhtns');
    expect(homeRowLesson(COLEMAK).join('')).toBe('arstdhneio');
    const plus = (l: typeof layout) => builtInPresets(l).find((p) => p.id === 'homeRowPlus')!;
    expect(plus(US_QWERTY).nameParams).toEqual({ keys: 'E I' });
    expect(plus(DVORAK).chars).toEqual([...'aoeuidhtnsrl']);
    expect(plus(COLEMAK).nameParams).toEqual({ keys: 'U L' });
  });

  it('have no two built-ins with the same keys on any layout', () => {
    for (const each of LAYOUTS) {
      const sets = builtInPresets(each).map((p) => [...p.chars].sort().join(''));
      expect(new Set(sets).size, each.id).toBe(sets.length);
    }
  });
});

describe('remapSelection', () => {
  it('carries a preset over to the same preset on the new layout', () => {
    expect(remapSelection(US_QWERTY, DVORAK, DEFAULT_KEYS, 1)).toEqual([...'aoeuidhtns']);
    const qwertyApprentice = apprenticePreset(US_QWERTY, 3, '').chars;
    expect(qwertyApprentice).toEqual([...'fjdk']);
    expect(remapSelection(US_QWERTY, COLEMAK, qwertyApprentice, 3).sort()).toEqual([...'tnse'].sort());
    const allLetters = region('lowercase');
    expect(remapSelection(US_QWERTY, DVORAK, allLetters, 1).sort()).toEqual([...allLetters].sort());
  });

  it('keeps a custom selection as it is', () => {
    expect(remapSelection(US_QWERTY, DVORAK, ['q', 'z', '7'], 1)).toEqual(['q', 'z', '7']);
  });
});

describe('orderedSelection', () => {
  it('orders by keyboard position, plain characters before shifted ones', () => {
    expect(orderedSelection(layout, ['A', 'l', '!', 'a', '1'])).toEqual(['1', 'a', 'l', '!', 'A']);
  });

  it('keeps characters the layout does not have, at the end', () => {
    expect(orderedSelection(layout, ['é', 'a'])).toEqual(['a', 'é']);
  });
});

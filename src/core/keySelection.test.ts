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
    expect(region('symbols').join('')).toBe("`-=[]\\;',./~!@#$%^&*()_+{}|:\"<>?");
    expect(region('space')).toEqual([' ']);
  });

  it('cover every character the layout can type, once', () => {
    const all = REGIONS.flatMap((id) => region(id));
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(layoutChars(layout).size);
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

  it('start new players on the All letters preset (M29)', () => {
    expect(matchingPreset(presets, DEFAULT_KEYS)?.id).toBe('lettersCapitals');
  });

  it('all include space', () => {
    for (const each of LAYOUTS) for (const p of builtInPresets(each)) expect(p.chars, `${each.id} ${p.id}`).toContain(' ');
  });

  it('match only exact selections', () => {
    expect(matchingPreset(presets, [...region('lowercase'), ' ', '1'])).toBeUndefined();
    expect(matchingPreset(presets, [' ', ...region('digits')].reverse())?.id).toBe('numbers');
  });

  it('follow the layout: its home row', () => {
    expect(homeRowLesson(US_QWERTY).join('')).toBe('asdfghjkl;');
    expect(homeRowLesson(DVORAK).join('')).toBe('aoeuidhtns');
    expect(homeRowLesson(COLEMAK).join('')).toBe('arstdhneio');
    const home = (l: typeof layout) => builtInPresets(l).find((p) => p.id === 'homeRow')!;
    expect(home(DVORAK).chars).toEqual([...'aoeuidhtns ']);
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
    expect(remapSelection(US_QWERTY, DVORAK, [...homeRowLesson(US_QWERTY), ' '], 1).sort()).toEqual([...'aoeuidhtns '].sort());
    expect(remapSelection(US_QWERTY, DVORAK, DEFAULT_KEYS, 1).sort()).toEqual([...DEFAULT_KEYS].sort());
    const qwertyApprentice = apprenticePreset(US_QWERTY, 3, '').chars;
    expect(qwertyApprentice).toEqual([...'fjdk']);
    expect(remapSelection(US_QWERTY, COLEMAK, qwertyApprentice, 3).sort()).toEqual([...'tnse'].sort());
    const allLetters = [...region('lowercase'), ' '];
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

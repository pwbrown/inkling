/**
 * The player's key selection, the Type Case (REQUIREMENTS §5, DESIGN §4):
 * regions, presets and helpers. Selection is by character, so `a`/`A` and
 * `1`/`!` are separate choices.
 */
import type { KeyboardLayout, LayoutKey } from '../content/layouts/types';

export type RegionId =
  | 'lowercase'
  | 'uppercase'
  | 'digits'
  | 'symbols'
  | 'shiftedSymbols'
  | 'space'
  | 'numberRow'
  | 'topRow'
  | 'homeRow'
  | 'bottomRow'
  | 'leftHand'
  | 'rightHand';

export const REGIONS: readonly RegionId[] = [
  'lowercase',
  'uppercase',
  'digits',
  'symbols',
  'shiftedSymbols',
  'space',
  'numberRow',
  'topRow',
  'homeRow',
  'bottomRow',
  'leftHand',
  'rightHand',
];

const isLetter = (ch: string) => /^\p{L}$/u.test(ch);
const isDigit = (ch: string) => /^\p{Nd}$/u.test(ch);

function allKeys(layout: KeyboardLayout): LayoutKey[] {
  return layout.rows.flat();
}

function baseChars(keys: LayoutKey[]): string[] {
  return keys.map((k) => k.base).filter((ch) => ch !== ' ');
}

/** Characters in a region, in keyboard order. */
export function regionChars(layout: KeyboardLayout, region: RegionId): string[] {
  const keys = allKeys(layout);
  const row = (i: number) => layout.rows[i] ?? [];
  switch (region) {
    case 'lowercase':
      return keys.filter((k) => isLetter(k.base)).map((k) => k.base);
    case 'uppercase':
      return keys.filter((k) => isLetter(k.base) && k.shift).map((k) => k.shift!);
    case 'digits':
      return keys.filter((k) => isDigit(k.base)).map((k) => k.base);
    case 'symbols':
      return keys.filter((k) => !isLetter(k.base) && !isDigit(k.base) && k.base !== ' ').map((k) => k.base);
    case 'shiftedSymbols':
      return keys.filter((k) => !isLetter(k.base) && k.shift).map((k) => k.shift!);
    case 'space':
      return keys.some((k) => k.base === ' ') ? [' '] : [];
    case 'numberRow':
      return baseChars(row(0));
    case 'topRow':
      return baseChars(row(1));
    case 'homeRow':
      return baseChars(row(2));
    case 'bottomRow':
      return baseChars(row(3));
    case 'leftHand':
      return baseChars(keys.filter((k) => k.hand === 'left'));
    case 'rightHand':
      return baseChars(keys.filter((k) => k.hand === 'right'));
  }
}

export interface Preset {
  id: string;
  /** Characters in the preset. */
  chars: string[];
  /** Built-in presets have translated names; custom ones carry their own. */
  name?: string;
  builtIn: boolean;
}

/** Home keys plus G and H, as taught in a first typing lesson. */
export const HOME_ROW_LESSON = 'asdfghjkl;';

/** Common lessons, roughly in the order a typing course teaches them. */
export function builtInPresets(layout: KeyboardLayout): Preset[] {
  const r = (id: RegionId) => regionChars(layout, id);
  const preset = (id: string, chars: string[]): Preset => ({ id, chars: [...new Set(chars)], builtIn: true });
  return [
    // The classic first lesson: the home row without the far-right quote key.
    preset('homeRow', [...HOME_ROW_LESSON]),
    preset('homeRowEI', [...HOME_ROW_LESSON, 'e', 'i']),
    preset('homeTopRows', [...HOME_ROW_LESSON, ...r('topRow').filter(isLetter)]),
    preset('allLetters', r('lowercase')),
    preset('lettersCapitals', [...r('lowercase'), ...r('uppercase')]),
    preset('lettersPunctuation', [...r('lowercase'), ...r('uppercase'), ',', '.', "'", '?', '!', ' ']),
    preset('leftHand', r('leftHand')),
    preset('rightHand', r('rightHand')),
    preset('numbers', r('digits')),
    preset('numberSymbols', regionChars(layout, 'shiftedSymbols').filter((ch) => '!@#$%^&*()'.includes(ch))),
    preset('code', [...'{}[]()<>;:=+-*/\\|&!?"\'`~_#$%^@']),
    preset('everything', [...r('lowercase'), ...r('uppercase'), ...r('digits'), ...r('symbols'), ...r('shiftedSymbols'), ' ']),
  ];
}

/** Every character a layout can produce. */
export function layoutChars(layout: KeyboardLayout): Set<string> {
  const out = new Set<string>();
  for (const key of allKeys(layout)) {
    out.add(key.base);
    if (key.shift) out.add(key.shift);
  }
  return out;
}

/**
 * Toggle a whole region: if every key in it is already selected, remove them
 * all; otherwise add the missing ones.
 */
export function toggleRegion(selection: ReadonlySet<string>, chars: readonly string[]): Set<string> {
  const next = new Set(selection);
  const allOn = chars.length > 0 && chars.every((ch) => next.has(ch));
  for (const ch of chars) {
    if (allOn) next.delete(ch);
    else next.add(ch);
  }
  return next;
}

/** 'all', 'some' or 'none' of a region is selected. */
export function regionState(selection: ReadonlySet<string>, chars: readonly string[]): 'all' | 'some' | 'none' {
  const on = chars.filter((ch) => selection.has(ch)).length;
  if (on === 0) return 'none';
  return on === chars.length ? 'all' : 'some';
}

/** The preset matching a selection exactly, if any. */
export function matchingPreset(presets: readonly Preset[], selection: Iterable<string>): Preset | undefined {
  const set = new Set(selection);
  return presets.find((p) => p.chars.length === set.size && p.chars.every((ch) => set.has(ch)));
}

/** Selection in a stable keyboard order, for storage and content. */
export function orderedSelection(layout: KeyboardLayout, selection: Iterable<string>): string[] {
  const set = new Set(selection);
  const order: string[] = [];
  for (const key of allKeys(layout)) {
    if (set.has(key.base)) order.push(key.base);
  }
  for (const key of allKeys(layout)) {
    if (key.shift && set.has(key.shift)) order.push(key.shift);
  }
  // Characters not on this layout (e.g. from another layout) go last.
  for (const ch of set) if (!order.includes(ch)) order.push(ch);
  return order;
}

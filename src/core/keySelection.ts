/**
 * The player's key selection, the Type Case (REQUIREMENTS §5, DESIGN §4):
 * regions, presets and helpers. Selection is by character, so `a`/`A` and
 * `1`/`!` are separate choices.
 */
import type { KeyboardLayout, LayoutKey } from '../content/layouts/types';
import { APPRENTICE_CHAPTERS, apprenticeKeys } from './campaign';

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
  /** Values for a built-in name's placeholders, e.g. the keys in "Home row + {keys}". */
  nameParams?: Record<string, string>;
  builtIn: boolean;
}

/**
 * The home row as taught in a first typing lesson: the eight home keys and
 * the two between them, without the far-right key (`asdfghjkl;` on QWERTY).
 */
export function homeRowLesson(layout: KeyboardLayout): string[] {
  return baseChars((layout.rows[2] ?? []).slice(0, 10));
}

/**
 * The two keys a typing course adds after the home row (E and I on QWERTY),
 * the first ones the Apprentice teaches after space.
 */
export function firstReachKeys(layout: KeyboardLayout): string[] {
  const space = layout.lessons.findIndex((keys) => keys.includes(' '));
  return layout.lessons.slice(space + 1, space + 3).flatMap((keys) => [...keys]);
}

/** Common lessons, roughly in the order a typing course teaches them. */
export function builtInPresets(layout: KeyboardLayout): Preset[] {
  const r = (id: RegionId) => regionChars(layout, id);
  const preset = (id: string, chars: string[], nameParams?: Record<string, string>): Preset => ({
    id,
    chars: [...new Set(chars)],
    builtIn: true,
    ...(nameParams ? { nameParams } : {}),
  });
  const home = homeRowLesson(layout);
  const reach = firstReachKeys(layout);
  return [
    // The classic first lesson: the home row without the far-right key.
    preset('homeRow', home),
    preset('homeRowPlus', [...home, ...reach], { keys: reach.map((k) => k.toUpperCase()).join(' ') }),
    preset('homeTopRows', [...home, ...r('topRow').filter(isLetter)]),
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

/**
 * The keys of the Apprentice chapter a player has reached (`unlocked`
 * chapters are open, so the highest is chapter `unlocked`, 1-based). Shown
 * as a preset so Practice can always match Apprentice progress.
 */
export function apprenticePreset(layout: KeyboardLayout, unlocked: number, name: string): Preset {
  const chapter = Math.max(1, Math.min(unlocked, APPRENTICE_CHAPTERS));
  return { id: 'apprentice', name, chars: apprenticeKeys(layout, chapter - 1), builtIn: true };
}

/**
 * The player's keys after switching layout: a built-in or Apprentice preset
 * becomes the same preset on the new layout (the home row stays the home
 * row); any other selection is kept as it is.
 */
export function remapSelection(from: KeyboardLayout, to: KeyboardLayout, keys: readonly string[], unlocked: number): string[] {
  const presets = (layout: KeyboardLayout) => [apprenticePreset(layout, unlocked, ''), ...builtInPresets(layout)];
  const match = matchingPreset(presets(from), keys);
  const target = match && presets(to).find((p) => p.id === match.id);
  return target ? orderedSelection(to, target.chars) : [...keys];
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

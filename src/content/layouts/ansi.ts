/**
 * The physical keys of an ANSI keyboard (the usual US-style board) with
 * standard touch-typing fingering. Layouts that use these keys (US QWERTY,
 * Dvorak, Colemak) only say which characters each key types.
 */
import { KEY_LEVELS, type Finger, type Hand, type KeyLevel, type KeyboardLayout, type LayoutId, type LayoutKey } from './types';

const FINGERS: Record<string, Finger> = { p: 'pinky', r: 'ring', m: 'middle', i: 'index' };

export interface Position {
  code: string;
  hand: Hand;
  finger: Finger;
  home?: true;
}

/** Physical keys per row: codes, hands (L/R) and fingers (p/r/m/i). */
export function positions(codes: string[], hands: string, fingers: string, home = ''): Position[] {
  return codes.map((code, i) => ({
    code,
    hand: hands[i] === 'L' ? 'left' : 'right',
    finger: FINGERS[fingers[i] ?? 'i'] ?? 'index',
    ...(home[i] === 'h' ? { home: true as const } : {}),
  }));
}

export const letterCodes = (letters: string) => [...letters].map((ch) => `Key${ch.toUpperCase()}`);

/** The four typing rows, named by the US QWERTY characters on them. */
const ROWS: Position[][] = [
  positions(
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
    'LLLLLLRRRRRRR',
    'pprmiiiimrppp',
  ),
  positions([...letterCodes('qwertyuiop'), 'BracketLeft', 'BracketRight', 'Backslash'], 'LLLLLRRRRRRRR', 'prmiiiimrpppp'),
  positions([...letterCodes('asdfghjkl'), 'Semicolon', 'Quote'], 'LLLLLRRRRRR', 'prmiiiimrpp', 'hhhh  hhhh '),
  positions([...letterCodes('zxcvbnm'), 'Comma', 'Period', 'Slash'], 'LLLLLRRRRR', 'prmiiiimrp'),
];

export const SPACE: LayoutKey = { code: 'Space', base: ' ', hand: 'both', finger: 'thumb', width: 6 };

/** One row's characters: what each key types plain and with Shift. */
export interface RowChars {
  base: string;
  shift: string;
}

/**
 * A layout on the ANSI keys. `rows` gives the characters of the number,
 * top, home and bottom rows, one per key, left to right.
 */
export function ansiLayout(id: LayoutId, rows: readonly RowChars[], lessons: KeyboardLayout['lessons']): KeyboardLayout {
  return {
    id,
    rows: [
      ...ROWS.map((row, r) => {
        const chars = rows[r];
        const base = [...(chars?.base ?? '')];
        const shift = [...(chars?.shift ?? '')];
        if (base.length !== row.length || shift.length !== row.length) {
          throw new Error(`Layout ${id}: row ${r} needs ${row.length} keys`);
        }
        return row.map((pos, i): LayoutKey => ({ ...pos, base: base[i]!, shift: shift[i]! }));
      }),
      [SPACE],
    ],
    lessons,
    physical: 'ansi',
    compose: {},
  };
}

/**
 * An Apprentice course: the two home index keys first, then one key per
 * chapter, the rest of the home row, space, then the other keys.
 */
export function lessonPlan(first: string, home: string, rest: string): string[][] {
  return [[...first], ...[...home, ' ', ...rest].map((key) => [key])];
}

/** The layout key that types `char` (plain or shifted), if any. */
export function findKey(layout: KeyboardLayout, char: string): LayoutKey | undefined {
  return layout.rows.flat().find((k) => k.base === char || k.shift === char);
}

/** The character a key types at one level, if any. */
export function charAt(key: LayoutKey, level: KeyLevel): string | undefined {
  return key[level];
}

/** True if that level of the key is a dead key. */
export function isDeadLevel(key: LayoutKey, level: KeyLevel): boolean {
  return key.dead?.includes(level) ?? false;
}

/**
 * Where `char` is typed directly: its key and the modifiers it needs. Dead
 * keys don't count (they type nothing on their own). Plain and Shift come
 * before AltGr, so a character on two keys gets the easier one.
 */
export function findKeyLevel(layout: KeyboardLayout, char: string): { key: LayoutKey; level: KeyLevel } | undefined {
  const keys = layout.rows.flat();
  for (const level of KEY_LEVELS) {
    const key = keys.find((k) => k[level] === char && !isDeadLevel(k, level));
    if (key) return { key, level };
  }
  return undefined;
}

/** The dead key at a level that types this accent mark, if the layout has one. */
export function findDeadKey(layout: KeyboardLayout, mark: string): { key: LayoutKey; level: KeyLevel } | undefined {
  for (const key of layout.rows.flat()) {
    for (const level of key.dead ?? []) if (key[level] === mark) return { key, level };
  }
  return undefined;
}

/**
 * The accent a dead key holds (`^`), from the physical key and modifiers
 * pressed. Null if this layout has no dead key there (the player's computer
 * may use another layout): the game then just waits for the letter.
 */
export function deadKeyMark(layout: KeyboardLayout, code: string, shift: boolean, altGr: boolean): string | null {
  const key = layout.rows.flat().find((k) => k.code === code);
  if (!key) return null;
  const level: KeyLevel = altGr ? (shift ? 'altGrShift' : 'altGr') : shift ? 'shift' : 'base';
  return isDeadLevel(key, level) ? (key[level] ?? null) : null;
}

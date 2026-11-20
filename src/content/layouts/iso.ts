/**
 * The physical keys of an ISO keyboard (the usual European board): like
 * ANSI, plus a key left of Z (`IntlBackslash`) and a tall Enter, which moves
 * the ANSI `Backslash` key down to the end of the home row. Layouts on these
 * keys (AZERTY, Spanish) say what each key types, including AltGr and dead keys.
 */
import { SPACE, letterCodes, positions, type RowChars } from './ansi';
import type { KeyLevel, KeyOverrides, KeyboardLayout, LayoutId, LayoutKey } from './types';

/** The four typing rows, named by the US QWERTY characters on them. */
const ROWS = [
  positions(
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal'],
    'LLLLLLRRRRRRR',
    'pprmiiiimrppp',
  ),
  positions([...letterCodes('qwertyuiop'), 'BracketLeft', 'BracketRight'], 'LLLLLRRRRRRR', 'prmiiiimrppp'),
  positions([...letterCodes('asdfghjkl'), 'Semicolon', 'Quote', 'Backslash'], 'LLLLLRRRRRRR', 'prmiiiimrppp', 'hhhh  hhhh  '),
  positions(['IntlBackslash', ...letterCodes('zxcvbnm'), 'Comma', 'Period', 'Slash'], 'LLLLLLRRRRR', 'pprmiiiimrp'),
];

/** How far each row starts from the left, in key widths: the bottom row starts sooner, for the extra key. */
export const ISO_ROW_OFFSETS = [0, 0.5, 0.75, 0.25] as const;

export interface IsoExtras {
  /** AltGr characters by key code: `[altGr, shift+altGr?]`. */
  altGr?: Readonly<Record<string, readonly [string, string?]>>;
  /** Dead-key levels by key code. */
  dead?: Readonly<Record<string, readonly KeyLevel[]>>;
  /** What each dead key makes with the next key (see KeyboardLayout.compose). */
  compose?: KeyboardLayout['compose'];
  /** Keys that type something else on a Mac. */
  mac?: KeyOverrides;
}

/**
 * A layout on the ISO keys. `rows` gives the plain and Shift characters of
 * the number, top, home and bottom rows, one per key, left to right; a space
 * in `shift` means the key has nothing on Shift.
 */
export function isoLayout(id: LayoutId, rows: readonly RowChars[], lessons: KeyboardLayout['lessons'], extras: IsoExtras = {}): KeyboardLayout {
  return {
    id,
    rows: [
      ...ROWS.map((row, r) => {
        const base = [...(rows[r]?.base ?? '')];
        const shift = [...(rows[r]?.shift ?? '')];
        if (base.length !== row.length || shift.length !== row.length) {
          throw new Error(`Layout ${id}: row ${r} needs ${row.length} keys`);
        }
        return row.map((pos, i): LayoutKey => {
          const altGr = extras.altGr?.[pos.code];
          const dead = extras.dead?.[pos.code];
          return {
            ...pos,
            base: base[i]!,
            ...(shift[i] !== ' ' ? { shift: shift[i]! } : {}),
            ...(altGr?.[0] ? { altGr: altGr[0] } : {}),
            ...(altGr?.[1] ? { altGrShift: altGr[1] } : {}),
            ...(dead ? { dead } : {}),
          };
        });
      }),
      [SPACE],
    ],
    lessons,
    physical: 'iso',
    compose: extras.compose ?? {},
    ...(extras.mac ? { mac: extras.mac } : {}),
  };
}

/** Compose table rows for one dead key: `marked('aeiou', 'áéíóú', '´')`, capitals included, and the mark itself after space. */
export function marked(plain: string, accented: string, mark: string): Record<string, string> {
  const out: Record<string, string> = { ' ': mark };
  const from = [...plain];
  const to = [...accented];
  from.forEach((ch, i) => {
    const result = to[i];
    if (!result) return;
    out[ch] = result;
    out[ch.toUpperCase()] = result.toUpperCase();
  });
  return out;
}

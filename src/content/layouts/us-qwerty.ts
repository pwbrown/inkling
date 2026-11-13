import type { Finger, KeyboardLayout, LayoutKey } from './types';

const L = 'left' as const;
const R = 'right' as const;

const FINGERS: Record<string, Finger> = { p: 'pinky', r: 'ring', m: 'middle', i: 'index' };

/**
 * Letters: base is lowercase, shift is uppercase. `hands` and `fingers` give
 * each letter's touch-typing hand (L/R) and finger (p/r/m/i).
 */
function letters(chars: string, hands: string, fingers: string): LayoutKey[] {
  return [...chars].map((ch, i) => ({
    code: `Key${ch.toUpperCase()}`,
    base: ch,
    shift: ch.toUpperCase(),
    hand: hands[i] === 'L' ? L : R,
    finger: FINGERS[fingers[i] ?? 'i'] ?? 'index',
  }));
}

/** US QWERTY, the first layout (REQUIREMENTS §5), with standard touch-typing fingering. */
export const US_QWERTY: KeyboardLayout = {
  id: 'us-qwerty',
  rows: [
    [
      { code: 'Backquote', base: '`', shift: '~', hand: L, finger: 'pinky' },
      { code: 'Digit1', base: '1', shift: '!', hand: L, finger: 'pinky' },
      { code: 'Digit2', base: '2', shift: '@', hand: L, finger: 'ring' },
      { code: 'Digit3', base: '3', shift: '#', hand: L, finger: 'middle' },
      { code: 'Digit4', base: '4', shift: '$', hand: L, finger: 'index' },
      { code: 'Digit5', base: '5', shift: '%', hand: L, finger: 'index' },
      { code: 'Digit6', base: '6', shift: '^', hand: R, finger: 'index' },
      { code: 'Digit7', base: '7', shift: '&', hand: R, finger: 'index' },
      { code: 'Digit8', base: '8', shift: '*', hand: R, finger: 'middle' },
      { code: 'Digit9', base: '9', shift: '(', hand: R, finger: 'ring' },
      { code: 'Digit0', base: '0', shift: ')', hand: R, finger: 'pinky' },
      { code: 'Minus', base: '-', shift: '_', hand: R, finger: 'pinky' },
      { code: 'Equal', base: '=', shift: '+', hand: R, finger: 'pinky' },
    ],
    [
      ...letters('qwertyuiop', 'LLLLLRRRRR', 'prmiiiimrp'),
      { code: 'BracketLeft', base: '[', shift: '{', hand: R, finger: 'pinky' },
      { code: 'BracketRight', base: ']', shift: '}', hand: R, finger: 'pinky' },
      { code: 'Backslash', base: '\\', shift: '|', hand: R, finger: 'pinky' },
    ],
    [
      ...letters('asdfghjkl', 'LLLLLRRRR', 'prmiiiimr'),
      { code: 'Semicolon', base: ';', shift: ':', hand: R, finger: 'pinky' },
      { code: 'Quote', base: "'", shift: '"', hand: R, finger: 'pinky' },
    ],
    [
      ...letters('zxcvbnm', 'LLLLLRR', 'prmiiii'),
      { code: 'Comma', base: ',', shift: '<', hand: R, finger: 'middle' },
      { code: 'Period', base: '.', shift: '>', hand: R, finger: 'ring' },
      { code: 'Slash', base: '/', shift: '?', hand: R, finger: 'pinky' },
    ],
    [{ code: 'Space', base: ' ', hand: 'both', finger: 'thumb', width: 6 }],
  ],
};

/** The layout key that types `char` (plain or shifted), if any. */
export function findKey(layout: KeyboardLayout, char: string): LayoutKey | undefined {
  return layout.rows.flat().find((k) => k.base === char || k.shift === char);
}

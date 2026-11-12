import type { KeyboardLayout, LayoutKey } from './types';

const L = 'left' as const;
const R = 'right' as const;

/** Letters: base is lowercase, shift is uppercase. */
function letters(chars: string, hands: string): LayoutKey[] {
  return [...chars].map((ch, i) => ({
    code: `Key${ch.toUpperCase()}`,
    base: ch,
    shift: ch.toUpperCase(),
    hand: hands[i] === 'L' ? L : R,
  }));
}

/** US QWERTY, the first layout (REQUIREMENTS §5). */
export const US_QWERTY: KeyboardLayout = {
  id: 'us-qwerty',
  rows: [
    [
      { code: 'Backquote', base: '`', shift: '~', hand: L },
      { code: 'Digit1', base: '1', shift: '!', hand: L },
      { code: 'Digit2', base: '2', shift: '@', hand: L },
      { code: 'Digit3', base: '3', shift: '#', hand: L },
      { code: 'Digit4', base: '4', shift: '$', hand: L },
      { code: 'Digit5', base: '5', shift: '%', hand: L },
      { code: 'Digit6', base: '6', shift: '^', hand: R },
      { code: 'Digit7', base: '7', shift: '&', hand: R },
      { code: 'Digit8', base: '8', shift: '*', hand: R },
      { code: 'Digit9', base: '9', shift: '(', hand: R },
      { code: 'Digit0', base: '0', shift: ')', hand: R },
      { code: 'Minus', base: '-', shift: '_', hand: R },
      { code: 'Equal', base: '=', shift: '+', hand: R },
    ],
    [
      ...letters('qwertyuiop', 'LLLLLRRRRR'),
      { code: 'BracketLeft', base: '[', shift: '{', hand: R },
      { code: 'BracketRight', base: ']', shift: '}', hand: R },
      { code: 'Backslash', base: '\\', shift: '|', hand: R },
    ],
    [
      ...letters('asdfghjkl', 'LLLLLRRRR'),
      { code: 'Semicolon', base: ';', shift: ':', hand: R },
      { code: 'Quote', base: "'", shift: '"', hand: R },
    ],
    [
      ...letters('zxcvbnm', 'LLLLLRR'),
      { code: 'Comma', base: ',', shift: '<', hand: R },
      { code: 'Period', base: '.', shift: '>', hand: R },
      { code: 'Slash', base: '/', shift: '?', hand: R },
    ],
    [{ code: 'Space', base: ' ', hand: 'both', width: 6 }],
  ],
};

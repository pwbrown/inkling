import { describe, expect, it } from 'vitest';
import { COLEMAK, DVORAK, US_QWERTY } from '../content/layouts';
import { fitSimilarity, handsArt } from './handsArt';

const colors = { ink: '#111', paper: '#fff', hand: '#ddd', highlight: '#ff0', margin: '#f00', rim: '#888' };
const count = (svg: string, text: string) => svg.split(text).length - 1;
/** Red-pen rings around keys (the space bar's is a rounded rect). */
const rings = (svg: string) => (svg.match(/<(circle|rect)[^>]*fill="none" stroke="#f00"/g) ?? []).length;

describe('handsArt', () => {
  it('circles each new key in red pen', () => {
    const { svg } = handsArt(US_QWERTY, ['f', 'j'], colors);
    expect(rings(svg)).toBe(2);
  });

  it('lights one finger per key, and both thumbs for space', () => {
    const lit = (keys: string[]) => new Set(handsArt(US_QWERTY, keys, colors).svg.match(/data-lit="[^"]*"/g)).size;
    expect(lit(['g'])).toBe(1);
    expect(lit(['f', 'j'])).toBe(2);
    expect(lit([' '])).toBe(2);
  });

  it('keeps the hands on the home row and points an arrow at keys off it', () => {
    const arrows = (keys: string[]) => count(handsArt(US_QWERTY, keys, colors).svg, 'stroke-dasharray');
    expect(arrows(['f', 'j'])).toBe(0);
    expect(arrows(['e'])).toBe(1);
    expect(arrows(['b', 'n'])).toBe(2);
    // Same hand pose whatever is being learned: only the highlights and arrows differ.
    const hands = (keys: string[]) => handsArt(US_QWERTY, keys, colors).svg.match(/<path data-hand="[^"]*" d="[^"]*"/g);
    expect(hands(['e'])).toHaveLength(2);
    expect(hands(['e'])).toEqual(hands(['f']));
  });

  it('rests the hands on the home keys of the layout in use', () => {
    const arrows = (layout: typeof US_QWERTY, keys: string[]) => count(handsArt(layout, keys, colors).svg, 'stroke-dasharray');
    expect(arrows(DVORAK, ['u', 'h', 'e', 's'])).toBe(0);
    expect(arrows(DVORAK, ['f'])).toBe(1);
    expect(arrows(COLEMAK, ['t', 'n', 'a', 'o'])).toBe(0);
    expect(arrows(COLEMAK, ['d', 'h'])).toBe(2);
    // The hands sit in the same place on every ANSI layout.
    const hands = (layout: typeof US_QWERTY) => handsArt(layout, ['e'], colors).svg.match(/<path data-hand="[^"]*" d="[^"]*"/g);
    expect(hands(DVORAK)).toEqual(hands(US_QWERTY));
    expect(handsArt(DVORAK, ['e'], colors).svg).toContain('>o<');
  });

  it('adds the number row only when a key needs it', () => {
    const letters = handsArt(US_QWERTY, ['e'], colors);
    const digits = handsArt(US_QWERTY, ['5'], colors);
    expect(digits.height).toBeGreaterThan(letters.height);
    expect(letters.svg).not.toContain('>5<');
    expect(digits.svg).toContain('>5<');
  });

  it('finds Shift characters on their key', () => {
    const { svg } = handsArt(US_QWERTY, ['E', '<'], colors);
    expect(rings(svg)).toBe(2);
    // Keys are labeled with their plain character, as on a real keyboard.
    expect(svg).toMatch(/fill="#111"[^>]*>,<\/text><circle[^>]*stroke="#f00"/);
  });

  it('fits a scale, turn and shift exactly when one exists', () => {
    // Turned 90°, doubled, then moved by (10, 5).
    const from = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
    const to = [{ x: 10, y: 5 }, { x: 10, y: 7 }, { x: 8, y: 5 }];
    const [a, b, c, d, e, f] = fitSimilarity(from, to);
    from.forEach((p, i) => {
      expect(a * p.x + c * p.y + e).toBeCloseTo(to[i]!.x);
      expect(b * p.x + d * p.y + f).toBeCloseTo(to[i]!.y);
    });
  });
});

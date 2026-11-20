import { describe, expect, it } from 'vitest';
import { capitalSpans } from './common';

const tenWide = () => 10;

describe('capitalSpans', () => {
  it('marks only the capitals, at their positions', () => {
    expect(capitalSpans('WoW', 5, tenWide)).toEqual([
      { x: 5, width: 10 },
      { x: 25, width: 10 },
    ]);
  });

  it('skips lowercase, digits, symbols and spaces', () => {
    expect(capitalSpans('cows 42 #!', 0, tenWide)).toEqual([]);
  });

  it('uses each letter’s own width', () => {
    const widths: Record<string, number> = { i: 4, M: 16, k: 9 };
    expect(capitalSpans('iMk', 0, (ch) => widths[ch] ?? 0)).toEqual([{ x: 4, width: 16 }]);
  });

  it('marks accented capitals too', () => {
    expect(capitalSpans('Éa', 0, tenWide)).toEqual([{ x: 0, width: 10 }]);
  });
});

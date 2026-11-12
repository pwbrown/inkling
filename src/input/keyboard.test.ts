import { describe, expect, it } from 'vitest';
import { isPrintable } from './keyboard';

describe('isPrintable', () => {
  it('accepts single characters, including space and symbols', () => {
    for (const key of ['a', 'A', '1', ';', ' ', '!', 'é']) expect(isPrintable(key)).toBe(true);
  });

  it('rejects named keys', () => {
    for (const key of ['Shift', 'Enter', 'ArrowLeft', 'Dead', 'Backspace', '']) expect(isPrintable(key)).toBe(false);
  });
});

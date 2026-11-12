import { describe, expect, it } from 'vitest';
import { applyEdit, correctPrefix, editDistance } from './editing';

describe('applyEdit', () => {
  const s = { buffer: 'cta', cursor: 3 };

  it('inserts at the cursor', () => {
    expect(applyEdit({ buffer: 'ct', cursor: 1 }, { type: 'insert', char: 'a' })).toEqual({ buffer: 'cat', cursor: 2 });
  });

  it('backspaces and deletes around the cursor, ignoring the edges', () => {
    expect(applyEdit(s, { type: 'backspace' })).toEqual({ buffer: 'ct', cursor: 2 });
    expect(applyEdit({ buffer: 'cta', cursor: 0 }, { type: 'backspace' })).toEqual({ buffer: 'cta', cursor: 0 });
    expect(applyEdit({ buffer: 'cta', cursor: 1 }, { type: 'delete' })).toEqual({ buffer: 'ca', cursor: 1 });
    expect(applyEdit(s, { type: 'delete' })).toEqual(s);
  });

  it('moves the cursor within bounds', () => {
    expect(applyEdit(s, { type: 'left' }).cursor).toBe(2);
    expect(applyEdit(s, { type: 'right' }).cursor).toBe(3);
    expect(applyEdit(s, { type: 'home' }).cursor).toBe(0);
    expect(applyEdit({ buffer: 'cta', cursor: 0 }, { type: 'end' }).cursor).toBe(3);
  });

  it('counts positions in code points', () => {
    expect(applyEdit({ buffer: 'aé', cursor: 2 }, { type: 'backspace' })).toEqual({ buffer: 'a', cursor: 1 });
  });
});

describe('editDistance and correctPrefix', () => {
  it('measures edits', () => {
    expect(editDistance('flask', 'flask')).toBe(0);
    expect(editDistance('falsk', 'flask')).toBe(2);
    expect(editDistance('flaask', 'flask')).toBe(1);
    expect(editDistance('', 'abc')).toBe(3);
  });

  it('finds the correct start of a buffer', () => {
    expect(correctPrefix('flx', 'flask')).toBe(2);
    expect(correctPrefix('', 'flask')).toBe(0);
    expect(correctPrefix('flask', 'flask')).toBe(5);
  });
});

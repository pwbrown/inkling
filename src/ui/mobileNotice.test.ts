import { describe, expect, it } from 'vitest';
import { isTouchOnly } from './mobileNotice';

describe('keyboard notice', () => {
  const media = (matches: Record<string, boolean>) => (q: string) => matches[q] ?? false;
  it('is for touch-only devices', () => {
    expect(isTouchOnly(media({ '(pointer: coarse)': true }))).toBe(true);
    // A tablet with a trackpad or mouse attached also has a fine pointer.
    expect(isTouchOnly(media({ '(pointer: coarse)': true, '(any-pointer: fine)': true }))).toBe(false);
    expect(isTouchOnly(media({ '(any-pointer: fine)': true }))).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { activeSeason, isSeasonId, thanksgivingDate } from './seasons';

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe('thanksgivingDate', () => {
  it('is the fourth Thursday of November', () => {
    expect(thanksgivingDate(2026).getDate()).toBe(26);
    expect(thanksgivingDate(2027).getDate()).toBe(25);
    expect(thanksgivingDate(2028).getDate()).toBe(23);
    expect(thanksgivingDate(2029).getDate()).toBe(22);
    expect(thanksgivingDate(2030).getDate()).toBe(28);
    for (let y = 2026; y <= 2040; y++) {
      const d = thanksgivingDate(y);
      expect(d.getDay()).toBe(4);
      expect(d.getMonth()).toBe(10);
      expect(d.getDate()).toBeGreaterThanOrEqual(22);
      expect(d.getDate()).toBeLessThanOrEqual(28);
    }
  });
});

describe('activeSeason', () => {
  it('covers two weeks before Thanksgiving through the Sunday after', () => {
    expect(activeSeason(day(2026, 11, 11, 23))).toBeNull();
    expect(activeSeason(day(2026, 11, 12, 0))).toBe('thanksgiving');
    expect(activeSeason(day(2026, 11, 26))).toBe('thanksgiving');
    expect(activeSeason(day(2026, 11, 29, 23))).toBe('thanksgiving');
    expect(activeSeason(day(2026, 11, 30))).toBeNull();
    // A late Thanksgiving (Nov 28, 2030) runs into December 1, which stays Thanksgiving.
    expect(activeSeason(day(2030, 12, 1))).toBe('thanksgiving');
    expect(activeSeason(day(2030, 12, 2))).toBe('christmas');
  });

  it('covers December for Christmas', () => {
    expect(activeSeason(day(2026, 12, 1, 0))).toBe('christmas');
    expect(activeSeason(day(2026, 12, 25))).toBe('christmas');
    expect(activeSeason(day(2026, 12, 31, 23))).toBe('christmas');
    expect(activeSeason(day(2027, 1, 1))).toBeNull();
    expect(activeSeason(day(2027, 7, 4))).toBeNull();
  });

  it('checks ids', () => {
    expect(isSeasonId('christmas')).toBe(true);
    expect(isSeasonId('easter')).toBe(false);
  });
});

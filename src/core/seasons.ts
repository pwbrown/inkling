/**
 * Holiday seasons: when the page, the creatures and the words dress up for
 * Thanksgiving or Christmas. By the player's local date, like the Daily Page.
 */
import { GAME_CONFIG } from './config';

export type SeasonId = 'thanksgiving' | 'christmas';
export const SEASONS: readonly SeasonId[] = ['thanksgiving', 'christmas'];

export function isSeasonId(value: unknown): value is SeasonId {
  return SEASONS.includes(value as SeasonId);
}

/** US Thanksgiving: the fourth Thursday of November, as a local date at midnight. */
export function thanksgivingDate(year: number): Date {
  const first = new Date(year, 10, 1).getDay(); // 0 = Sunday
  const firstThursday = 1 + ((4 - first + 7) % 7);
  return new Date(year, 10, firstThursday + 21);
}

/** Local midnight of `now`'s date. */
function dayOf(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** The holiday season `now` falls in, or null. */
export function activeSeason(now: Date): SeasonId | null {
  const today = dayOf(now).getTime();
  const { thanksgiving, christmas } = GAME_CONFIG.seasons;
  const turkeyDay = thanksgivingDate(now.getFullYear());
  if (today >= addDays(turkeyDay, -thanksgiving.daysBefore).getTime() && today <= addDays(turkeyDay, thanksgiving.daysAfter).getTime()) {
    return 'thanksgiving';
  }
  const year = now.getFullYear();
  const from = new Date(year, christmas.from.month - 1, christmas.from.day).getTime();
  const to = new Date(year, christmas.to.month - 1, christmas.to.day).getTime();
  if (today >= from && today <= to) return 'christmas';
  return null;
}

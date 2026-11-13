/**
 * English content pack (REQUIREMENTS §11). Loaded lazily so the large word
 * list lives in its own chunk instead of the main bundle.
 */
import { Blocklist } from '../blocklist';
import { CONTENT_LEVELS, levelTerms, type ContentLevel } from '../contentFilter';
import { entriesFromTiers, type WordEntry } from '../wordPool';

export interface ContentPack {
  locale: string;
  /** Every word the filter level allows. */
  wordsFor(level: ContentLevel): WordEntry[];
  /** What the filter level blocks: for made-up strings and downloaded words. */
  blocklistFor(level: ContentLevel): Blocklist;
}

export async function loadEnglishPack(): Promise<ContentPack> {
  const [wordsModule, blocklistModule] = await Promise.all([import('./words.json'), import('./blocklist.json')]);
  const pack = wordsModule.default as { tiers: string[]; levels: Record<string, string[]> };
  const blocked = blocklistModule.default;

  // Each level adds the words it lets through to the stricter levels' words.
  const words = new Map<ContentLevel, WordEntry[]>();
  let sofar: WordEntry[] = [];
  for (const level of CONTENT_LEVELS) {
    const added = entriesFromTiers(level === 'family' ? pack.tiers : (pack.levels[level] ?? []));
    sofar = [...sofar, ...added];
    words.set(level, sofar);
  }
  const blocklists = new Map<ContentLevel, Blocklist>();

  return {
    locale: 'en',
    wordsFor: (level) => words.get(level) ?? words.get('family')!,
    blocklistFor(level) {
      let list = blocklists.get(level);
      if (!list) {
        list = new Blocklist([...blocked.terms, ...levelTerms(level)], blocked.allow);
        blocklists.set(level, list);
      }
      return list;
    },
  };
}

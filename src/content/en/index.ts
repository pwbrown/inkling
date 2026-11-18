/**
 * English content pack (REQUIREMENTS §11). Loaded lazily so the large word
 * list lives in its own chunk instead of the main bundle.
 */
import { Blocklist } from '../blocklist';
import { entriesFromTiers, type WordEntry } from '../wordPool';

export interface ContentPack {
  locale: string;
  /** Every word the family-friendly filter allows. */
  words: WordEntry[];
  /** What the filter blocks: for made-up strings and downloaded words. */
  blocklist: Blocklist;
}

export async function loadEnglishPack(): Promise<ContentPack> {
  const [wordsModule, blocklistModule] = await Promise.all([import('./words.json'), import('./blocklist.json')]);
  const pack = wordsModule.default as { tiers: string[] };
  const blocked = blocklistModule.default;
  return {
    locale: 'en',
    words: entriesFromTiers(pack.tiers),
    blocklist: new Blocklist(blocked.terms, blocked.allow),
  };
}

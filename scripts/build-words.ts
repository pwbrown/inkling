/**
 * Builds the bundled English word pack and blocklist from their sources:
 *
 *   npm run words:build
 *
 * - Words: SCOWL size levels 10–50 (common to all English spellings), via the
 *   `wordlist-english` package. The level is kept as a frequency tier.
 * - Blocklist: LDNOOBW English list, via the `naughty-words` package.
 *
 * Writes src/content/en/words.json and src/content/en/blocklist.json, and
 * prints every word the blocklist removed so false positives can be reviewed
 * and added to ALLOW below. Each word is filed under the strictest word
 * filter level that allows it (src/content/contentFilter.ts).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blocklist } from '../src/content/blocklist.ts';
import { ALWAYS_BLOCKED, CONTENT_LEVELS, levelTerms } from '../src/content/contentFilter.ts';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/content/en');

/** SCOWL size levels, most common first. Index in this list = tier. */
const LEVELS = [10, 20, 35, 40, 50] as const;
const MIN_LENGTH = 2;
const MAX_LENGTH = 12;

/**
 * Real, harmless words the blocklist rules catch by mistake (reviewed by hand
 * from this script's output). Words that are technically fine but read as
 * offensive on screen stay blocked.
 */
const ALLOW: string[] = [
  'amusement', 'amusements', 'basement', 'basements', 'basemen', 'subbasement', 'subbasements',
  'casement', 'casements', 'appeasement', 'appeasements', 'chastisement', 'debasement',
  'debasements', 'abasement', 'advisement', 'disbursement', 'endorsement', 'endorsements',
  'butter', 'butters', 'butted', 'butting', 'buttes', 'socialism', 'socialist', 'socialists',
  'socialistic', 'specialist', 'specialists', 'brimming', 'trimming', 'trimmings', 'shrimping',
  'draping', 'scraping', 'cocoons', 'tycoons', 'spiced', 'spices', 'spicier', 'spiciest',
  'spicing', 'spicy', 'thumping', 'therapist', 'therapists', 'thorny', 'twinkle', 'twinkled',
  'twinkles', 'twinkling', 'twinklings', 'peacocks', 'gamecocks', 'haycocks', 'woodcocks',
  'weathercocks', 'shuttlecocks', 'stopcocks', 'pantyhose', 'horsemen', 'sclerotic', 'escort',
  'escorted', 'escorting', 'escorts', 'pussycat', 'pussycats', 'pussyfoot', 'pussyfooted',
  'pussyfooting', 'pussyfoots', 'snatch', 'snatched', 'snatches', 'snatching', 'snowballing',
  'monger', 'mongers', 'scat', 'scats', 'fingering', 'fingerings', 'domination', 'swinger',
  'swingers', 'debugger', 'debuggers', 'heroine', 'heroines', 'prickle', 'prickled', 'prickles',
  'pricklier', 'prickliest', 'prickling', 'prickly', 'pricked', 'pricking', 'pinprick', 'pinpricks',
  'scrappy', 'crapes', 'retardant', 'retardants',
  // Harmless words containing a term from contentFilter.ts.
  'abreast', 'breastplate', 'breastplates', 'breastbone', 'breastbones', 'breaststroke',
  'breastwork', 'breastworks', 'redbreast', 'redbreasts', 'condominium', 'condominiums',
  'crotchet', 'crotchets', 'crotchety', 'oxymoron', 'squawk', 'squawked', 'squawking', 'squawks',
  'burnoose', 'burnooses', 'congenital', 'congenitally', 'deuterium', 'neutering', 'scrapped',
  'scrapping', 'scrappier', 'scrappiest', 'psychology', 'psychologies', 'psychologist',
  'psychologists', 'angiosperm', 'angiosperms', 'gymnosperm', 'gymnosperms', 'spotty',
  'spottier', 'spottiest', 'spottiness',
];

function readJson<T>(modulePath: string): T {
  return JSON.parse(readFileSync(require.resolve(modulePath), 'utf8')) as T;
}

const rawTerms = readJson<string[]>('naughty-words/en.json');
/** Blocked at every filter level. */
const terms = [...rawTerms.filter((t) => !t.includes(' ')), ...ALWAYS_BLOCKED];
/** One blocklist per filter level, strictest first (src/content/contentFilter.ts). */
const levelBlocklists = CONTENT_LEVELS.map((level) => new Blocklist([...terms, ...levelTerms(level)], ALLOW));
const always = new Blocklist(terms, ALLOW);

const seen = new Set<string>();
/** byLevel[l][tier]: words first allowed at filter level l. */
const byLevel: string[][][] = CONTENT_LEVELS.map(() => []);
const removed: string[] = [];

LEVELS.forEach((level, tier) => {
  const words = readJson<string[]>(`wordlist-english/english-words-${level}.json`);
  for (const lists of byLevel) lists[tier] = [];
  for (const word of words) {
    if (!/^[a-z]+$/.test(word) || word.length < MIN_LENGTH || word.length > MAX_LENGTH) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    const first = always.blocksWord(word) ? -1 : levelBlocklists.findIndex((b) => !b.blocksWord(word));
    if (first < 0) {
      removed.push(word);
      continue;
    }
    byLevel[first]![tier]!.push(word);
  }
});

const joinTiers = (tiers: string[][]) => tiers.map((words) => words.sort().join(' '));
const [family, ...looser] = byLevel;

const wordsPack = {
  locale: 'en',
  source: 'SCOWL size levels 10, 20, 35, 40, 50 (english-words-*) via wordlist-english 1.2.1',
  license: 'SCOWL license, see licenses/SCOWL.txt',
  // Space-separated per tier to keep the bundle small. `tiers` is every word
  // the family-friendly filter allows; `levels` adds the words each looser
  // filter level lets through.
  tiers: joinTiers(family!),
  levels: Object.fromEntries(CONTENT_LEVELS.slice(1).map((level, i) => [level, joinTiers(looser[i]!)])),
};

const blocklistPack = {
  locale: 'en',
  source: 'List of Dirty, Naughty, Obscene, and Otherwise Bad Words (LDNOOBW) via naughty-words 1.2.0, plus terms in src/content/contentFilter.ts',
  license: 'CC-BY-4.0',
  // Blocked at every level. The filter groups are read from contentFilter.ts at runtime.
  terms: [...new Set(terms.map((t) => t.toLowerCase()))].sort(),
  allow: ALLOW,
};

writeFileSync(join(outDir, 'words.json'), JSON.stringify(wordsPack) + '\n');
writeFileSync(join(outDir, 'blocklist.json'), JSON.stringify(blocklistPack, null, 1) + '\n');

const count = (tiers: string[][]) => tiers.reduce((sum, t) => sum + t.length, 0);
console.log(`words: ${CONTENT_LEVELS.map((level, i) => `${level} +${count(byLevel[i]!)}`).join(', ')}`);
console.log(`blocklist: ${always.size} terms always; removed ${removed.length} words at every level:`);
console.log(removed.join(' '));

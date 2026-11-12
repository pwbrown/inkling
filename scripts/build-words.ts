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
 * and added to ALLOW below.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blocklist } from '../src/content/blocklist.ts';

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
];

/**
 * Slurs, crude words and sensitive topics that LDNOOBW misses (found by
 * reviewing the word pack). Inflections are matched automatically.
 */
const EXTRA_BLOCK: string[] = [
  'retard', 'chink', 'dyke', 'gook', 'gyp', 'gypped', 'damn', 'crap', 'crappy', 'piss',
  'bugger', 'prick', 'slag', 'hussy', 'harlot', 'strumpet', 'pimp', 'sodomite', 'shag',
  'suicide', 'cocaine', 'heroin',
];

function readJson<T>(modulePath: string): T {
  return JSON.parse(readFileSync(require.resolve(modulePath), 'utf8')) as T;
}

const rawTerms = readJson<string[]>('naughty-words/en.json');
const terms = [...rawTerms.filter((t) => !t.includes(' ')), ...EXTRA_BLOCK];
const blocklist = new Blocklist(terms, ALLOW);

const seen = new Set<string>();
const tiers: string[][] = [];
const removed: string[] = [];

for (const level of LEVELS) {
  const words = readJson<string[]>(`wordlist-english/english-words-${level}.json`);
  const kept: string[] = [];
  for (const word of words) {
    if (!/^[a-z]+$/.test(word) || word.length < MIN_LENGTH || word.length > MAX_LENGTH) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    if (blocklist.blocksWord(word)) {
      removed.push(word);
      continue;
    }
    kept.push(word);
  }
  tiers.push(kept.sort());
}

const wordsPack = {
  locale: 'en',
  source: 'SCOWL size levels 10, 20, 35, 40, 50 (english-words-*) via wordlist-english 1.2.1',
  license: 'SCOWL license, see licenses/SCOWL.txt',
  // Space-separated per tier to keep the bundle small.
  tiers: tiers.map((words) => words.join(' ')),
};

const blocklistPack = {
  locale: 'en',
  source: 'List of Dirty, Naughty, Obscene, and Otherwise Bad Words (LDNOOBW) via naughty-words 1.2.0',
  license: 'CC-BY-4.0',
  terms: [...new Set(terms.map((t) => t.toLowerCase()))].sort(),
  allow: ALLOW,
};

writeFileSync(join(outDir, 'words.json'), JSON.stringify(wordsPack) + '\n');
writeFileSync(join(outDir, 'blocklist.json'), JSON.stringify(blocklistPack, null, 1) + '\n');

const total = tiers.reduce((sum, t) => sum + t.length, 0);
console.log(`words: ${total} kept across ${tiers.length} tiers (${tiers.map((t) => t.length).join(' / ')})`);
console.log(`blocklist: ${blocklist.size} terms; removed ${removed.length} words:`);
console.log(removed.join(' '));

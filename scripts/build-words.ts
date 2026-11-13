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
  // Harmless words containing a term from the kid-friendliness review.
  'abreast', 'breastplate', 'breastplates', 'breastbone', 'breastbones', 'breaststroke',
  'breastwork', 'breastworks', 'redbreast', 'redbreasts', 'condominium', 'condominiums',
  'crotchet', 'crotchets', 'crotchety', 'oxymoron', 'squawk', 'squawked', 'squawking', 'squawks',
  'burnoose', 'burnooses', 'congenital', 'congenitally', 'deuterium', 'neutering', 'scrapped',
  'scrapping', 'scrappier', 'scrappiest', 'psychology', 'psychologies', 'psychologist',
  'psychologists', 'angiosperm', 'angiosperms', 'gymnosperm', 'gymnosperms', 'spotty',
  'spottier', 'spottiest', 'spottiness',
];

/**
 * Slurs, crude words and sensitive topics that LDNOOBW misses (found by
 * reviewing the word pack). Inflections are matched automatically.
 */
const EXTRA_BLOCK: string[] = [
  'retard', 'chink', 'dyke', 'gook', 'gyp', 'gypped', 'damn', 'crap', 'crappy', 'piss',
  'bugger', 'prick', 'slag', 'hussy', 'harlot', 'strumpet', 'pimp', 'sodomite', 'shag',
  'suicide', 'cocaine', 'heroin',
  // Kid-friendliness review (2026-11): words that aren't swearing but don't
  // belong in a children's typing game. Inflections are matched automatically;
  // terms of 5+ letters also block longer words containing them.
  // Sex, reproduction and private parts.
  'sperm', 'sexist', 'sexism', 'nonsexist', 'unisex', 'cybersex', 'oversexed', 'sexily', 'sexiness',
  'sexless', 'sexpot', 'sexting', 'sexton', 'sextet', 'sextant', 'sexagenarian', 'genital', 'genitalia',
  'pubic', 'puberty', 'testicle', 'scrotum', 'scrota', 'ovary', 'ovaries', 'ovarian', 'ovulate',
  'ovulation', 'uterus', 'uteri', 'uterine', 'womb', 'clitoral', 'phallus', 'phalli', 'phallic',
  'erection', 'erectile', 'ejaculate', 'copulate', 'copulation', 'coitus', 'fornicate', 'fornication',
  'adultery', 'adulterer', 'adulteress', 'adulterous', 'adulteries', 'breast', 'bosom', 'teat',
  'lactate', 'lactation', 'menstrual', 'menstruate', 'menstruation', 'tampon', 'condom', 'pregnant',
  'pregnancy', 'pregnancies', 'abortion', 'abortionist', 'fetus', 'placenta', 'miscarriage',
  'stillbirth', 'afterbirth', 'virgin', 'virginity', 'virginal', 'lust', 'lustful', 'lustily',
  'lustiness', 'lewd', 'smutty', 'smuttier', 'smuttiest', 'raunchy', 'raunchiness', 'raunchier',
  'raunchiest', 'bawdy', 'bawdily', 'bawdiness', 'bawdier', 'bawdiest', 'brothel', 'prostitute',
  'prostitution', 'courtesan', 'concubine', 'seduce', 'seduction', 'seductive', 'seducer', 'lecher',
  'lecherous', 'lechery', 'pervert', 'perversion', 'kinkier', 'kinkiest', 'fetish', 'orgies',
  'orgiastic', 'nudist', 'nudism', 'stripper', 'striptease', 'lingerie', 'brassiere', 'crotch',
  'groin', 'buttock', 'bum', 'rectum', 'rectal', 'bowel', 'excrement', 'turd', 'enema', 'laxative',
  'constipate', 'constipation', 'transvestite', 'transvestism', 'castrate', 'castration',
  'circumcise', 'circumcision', 'infidelity', 'infidelities', 'spank', 'spanking', 'sadist',
  'sadistic', 'masochist', 'masochism', 'masochistic', 'syphilis', 'syphilitic', 'herpes', 'venereal',
  // Crude words and insults.
  'jackass', 'damnation', 'damnable', 'damnably', 'damnedest', 'goddamn', 'hellhole', 'crapped',
  'crapping', 'crappier', 'crappiest', 'bloody', 'freaking', 'idiot', 'idiotic', 'moron', 'imbecile',
  'imbecilic', 'imbecility', 'stupid', 'bimbo', 'floozy', 'sluttish', 'trollop', 'wench', 'gigolo',
  'queer', 'queerly', 'queerness', 'cripple', 'midget', 'psycho', 'gringo', 'redskin', 'squaw',
  'gypsy', 'satanic', 'satanism', 'satanically',
  // Drugs, alcohol and tobacco.
  'opium', 'opiate', 'morphine', 'methadone', 'amphetamine', 'marijuana', 'cannabis', 'hashish',
  'narcotic', 'stoned', 'junkie', 'overdose', 'booze', 'boozer', 'drunk', 'drunken', 'drunkard',
  'drunkenly', 'drunkenness', 'liquor', 'whiskys', 'vodka', 'tequila', 'hangover', 'tipsy', 'beer',
  'wine', 'winery', 'wineries', 'wineglass', 'alcohol', 'alcoholic', 'alcoholism', 'cigar', 'cigarette',
  'cigarillo', 'tobacco', 'tobacconist', 'nicotine',
  // Graphic violence and death.
  'murder', 'murderer', 'murderous', 'murderess', 'murderously', 'homicide', 'homicidal',
  'slaughter', 'slaughterer', 'massacre', 'genocide', 'assassin', 'assassinate', 'strangle',
  'strangler', 'stranglehold', 'behead', 'decapitate', 'decapitation', 'dismember', 'mutilate',
  'mutilation', 'torture', 'torturer', 'maim', 'corpse', 'cadaver', 'cadaverous', 'suicidal',
  'lynch', 'lynching', 'gallows', 'noose', 'molest', 'molestation', 'molester', 'kidnap', 'kidnapper',
  'kidnapping', 'terrorism', 'terrorist', 'holocaust', 'executioner', 'electrocute', 'guillotine',
  'bloodbath', 'gunshot', 'gunman', 'gunmen', 'gunpoint', 'shootings',
  // Identity words: not offensive, but best explained by a grown-up rather
  // than met as a typing target in the family-friendly default.
  'gay', 'gayer', 'gayest', 'gayness', 'lesbian', 'lesbianism',
  // Toilet humor.
  'poop', 'nincompoop', 'fart', 'pee', 'weeing', 'burp', 'belch', 'puke', 'vomit', 'snot', 'snotty',
  'snottier', 'snottiest', 'flatulence', 'flatulent', 'potty', 'tush', 'fanny',
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

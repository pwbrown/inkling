/**
 * The word filter (REQUIREMENTS §6): how much the word list leaves out.
 *
 * Swearing, slurs and explicit words are always blocked. On top of that,
 * words that aren't swearing but don't suit young children are grouped
 * here, and each filter level says which groups it lets through:
 *
 * - family (default): none of them.
 * - olderKids: identity words, toilet humor and mild insults.
 * - grownUps: everything here, including body and reproduction words,
 *   drugs and alcohol, violence and grown-up themes.
 *
 * Self-contained (no imports) so the Node build script can use it too:
 * `npm run words:build` sorts every word into the level that first allows it.
 * Inflections are matched automatically; terms of 5+ letters also match
 * longer words containing them (see blocklist.ts).
 */

export type ContentLevel = 'family' | 'olderKids' | 'grownUps';

/** Strictest first. */
export const CONTENT_LEVELS: readonly ContentLevel[] = ['family', 'olderKids', 'grownUps'];

export const DEFAULT_CONTENT_LEVEL: ContentLevel = 'family';

export type ContentGroup = 'identity' | 'toilet' | 'insults' | 'body' | 'substances' | 'violence' | 'mature';

/** The groups each level lets through. Levels are nested: each allows everything the one before does. */
export const LEVEL_ALLOWS: Record<ContentLevel, readonly ContentGroup[]> = {
  family: [],
  olderKids: ['identity', 'toilet', 'insults'],
  grownUps: ['identity', 'toilet', 'insults', 'body', 'substances', 'violence', 'mature'],
};

/** Terms in each group (reviewed by hand against the word pack, 2026-11). */
export const GROUP_TERMS: Record<ContentGroup, readonly string[]> = {
  // Not offensive, but best explained by a grown-up rather than met as a typing target.
  identity: ['gay', 'gayer', 'gayest', 'gayness', 'lesbian', 'lesbianism'],
  toilet: [
    'poop', 'nincompoop', 'fart', 'pee', 'weeing', 'burp', 'belch', 'puke', 'vomit', 'snot', 'snotty',
    'snottier', 'snottiest', 'flatulence', 'flatulent', 'potty', 'tush', 'fanny', 'bum', 'turd',
  ],
  insults: [
    'jackass', 'damnation', 'damnable', 'damnably', 'damnedest', 'hellhole', 'crapped', 'crapping',
    'crappier', 'crappiest', 'bloody', 'freaking', 'idiot', 'idiotic', 'moron', 'imbecile', 'imbecilic',
    'imbecility', 'stupid',
  ],
  // Bodies, health and reproduction.
  body: [
    'sperm', 'sexist', 'sexism', 'nonsexist', 'unisex', 'sexless', 'sexton', 'sextet', 'sextant',
    'sexagenarian', 'genital', 'genitalia', 'pubic', 'puberty', 'testicle', 'scrotum', 'scrota', 'ovary',
    'ovaries', 'ovarian', 'ovulate', 'ovulation', 'uterus', 'uteri', 'uterine', 'womb', 'breast', 'bosom',
    'teat', 'lactate', 'lactation', 'menstrual', 'menstruate', 'menstruation', 'tampon', 'condom',
    'pregnant', 'pregnancy', 'pregnancies', 'abortion', 'abortionist', 'fetus', 'placenta', 'miscarriage',
    'stillbirth', 'afterbirth', 'virgin', 'virginity', 'virginal', 'crotch', 'groin', 'buttock', 'rectum',
    'rectal', 'bowel', 'excrement', 'enema', 'laxative', 'constipate', 'constipation', 'circumcise',
    'circumcision', 'syphilis', 'syphilitic', 'herpes', 'venereal',
  ],
  substances: [
    'opium', 'opiate', 'morphine', 'methadone', 'amphetamine', 'marijuana', 'cannabis', 'hashish',
    'narcotic', 'stoned', 'junkie', 'overdose', 'booze', 'boozer', 'drunk', 'drunken', 'drunkard',
    'drunkenly', 'drunkenness', 'liquor', 'whiskys', 'vodka', 'tequila', 'hangover', 'tipsy', 'beer',
    'wine', 'winery', 'wineries', 'wineglass', 'alcohol', 'alcoholic', 'alcoholism', 'cigar', 'cigarette',
    'cigarillo', 'tobacco', 'tobacconist', 'nicotine',
  ],
  // Graphic violence and death.
  violence: [
    'murder', 'murderer', 'murderous', 'murderess', 'murderously', 'homicide', 'homicidal', 'slaughter',
    'slaughterer', 'massacre', 'genocide', 'assassin', 'assassinate', 'strangle', 'strangler',
    'stranglehold', 'behead', 'decapitate', 'decapitation', 'dismember', 'mutilate', 'mutilation',
    'torture', 'torturer', 'maim', 'corpse', 'cadaver', 'cadaverous', 'suicidal', 'lynch', 'lynching',
    'gallows', 'noose', 'kidnap', 'kidnapper', 'kidnapping', 'terrorism', 'terrorist', 'holocaust',
    'executioner', 'electrocute', 'guillotine', 'bloodbath', 'gunshot', 'gunman', 'gunmen', 'gunpoint',
    'shootings', 'castrate', 'castration',
  ],
  // Grown-up themes: sex and relationships, without being explicit.
  mature: [
    'cybersex', 'oversexed', 'sexily', 'sexiness', 'sexpot', 'sexting', 'clitoral', 'phallus', 'phalli',
    'phallic', 'erection', 'erectile', 'ejaculate', 'copulate', 'copulation', 'coitus', 'fornicate',
    'fornication', 'adultery', 'adulterer', 'adulteress', 'adulterous', 'adulteries', 'lust', 'lustful',
    'lustily', 'lustiness', 'lewd', 'smutty', 'smuttier', 'smuttiest', 'raunchy', 'raunchiness',
    'raunchier', 'raunchiest', 'bawdy', 'bawdily', 'bawdiness', 'bawdier', 'bawdiest', 'brothel',
    'prostitute', 'prostitution', 'courtesan', 'concubine', 'seduce', 'seduction', 'seductive', 'seducer',
    'lecher', 'lecherous', 'lechery', 'pervert', 'perversion', 'kinkier', 'kinkiest', 'fetish', 'orgies',
    'orgiastic', 'nudist', 'nudism', 'stripper', 'striptease', 'lingerie', 'brassiere', 'transvestite',
    'transvestism', 'infidelity', 'infidelities', 'spank', 'spanking', 'sadist', 'sadistic', 'masochist',
    'masochism', 'masochistic', 'bimbo', 'floozy', 'trollop', 'wench', 'gigolo', 'molest', 'molestation',
    'molester',
  ],
};

/**
 * Blocked at every level, beyond the LDNOOBW list: slurs, crude words and
 * sensitive topics it misses.
 */
export const ALWAYS_BLOCKED: readonly string[] = [
  'retard', 'chink', 'dyke', 'gook', 'gyp', 'gypped', 'damn', 'crap', 'crappy', 'piss', 'bugger', 'prick',
  'slag', 'hussy', 'harlot', 'strumpet', 'pimp', 'sodomite', 'shag', 'suicide', 'cocaine', 'heroin',
  'goddamn', 'sluttish', 'queer', 'queerly', 'queerness', 'cripple', 'midget', 'psycho', 'gringo',
  'redskin', 'squaw', 'gypsy', 'satanic', 'satanism', 'satanically',
];

/** Groups a level still blocks. */
export function blockedGroups(level: ContentLevel): ContentGroup[] {
  const allowed = new Set(LEVEL_ALLOWS[level]);
  return (Object.keys(GROUP_TERMS) as ContentGroup[]).filter((g) => !allowed.has(g));
}

/** Every term a level blocks, on top of the always-blocked ones. */
export function levelTerms(level: ContentLevel): string[] {
  return blockedGroups(level).flatMap((g) => GROUP_TERMS[g]);
}

export function isContentLevel(value: unknown): value is ContentLevel {
  return CONTENT_LEVELS.includes(value as ContentLevel);
}

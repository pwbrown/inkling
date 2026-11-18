/**
 * The word filter (REQUIREMENTS §6). Every player gets the family-friendly
 * filter: swearing, slurs and explicit words are blocked, and so are the
 * words grouped below, which aren't swearing but don't suit young children.
 *
 * Self-contained (no imports) so the Node build script can use it too.
 * Inflections are matched automatically; terms of 5+ letters also match
 * longer words containing them (see blocklist.ts).
 */

export type ContentGroup = 'identity' | 'toilet' | 'insults' | 'body' | 'substances' | 'violence' | 'mature';

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
 * Slurs, crude words and sensitive topics the LDNOOBW list misses.
 */
export const ALWAYS_BLOCKED: readonly string[] = [
  'retard', 'chink', 'dyke', 'gook', 'gyp', 'gypped', 'damn', 'crap', 'crappy', 'piss', 'bugger', 'prick',
  'slag', 'hussy', 'harlot', 'strumpet', 'pimp', 'sodomite', 'shag', 'suicide', 'cocaine', 'heroin',
  'goddamn', 'sluttish', 'queer', 'queerly', 'queerness', 'cripple', 'midget', 'psycho', 'gringo',
  'redskin', 'squaw', 'gypsy', 'satanic', 'satanism', 'satanically',
];

/** Every term the filter blocks on top of the LDNOOBW list. */
export const FILTER_TERMS: readonly string[] = [...ALWAYS_BLOCKED, ...Object.values(GROUP_TERMS).flat()];

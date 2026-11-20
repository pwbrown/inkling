/**
 * Fair Copy: a typing-speed test. The player copies out a passage (or as
 * much text as they can in a timed test); the clock starts on the first key.
 *
 * Mistakes don't block: each key lands on the next letter, right or wrong,
 * and Backspace can take keys back. Mistakes still on the page when the test
 * ends cost net speed (`errorPenaltyChars` each); every wrong key counts
 * against accuracy, fixed or not.
 *
 * A timed test strings passages together; Enter moves on to the next one.
 */
import { GAME_CONFIG } from './config';
import { applyEdit } from './editing';
import { accuracy, wpm } from './stats';

export interface Passage {
  id: string;
  title: string;
  author: string;
  text: string;
}

/** Public-domain openings (Project Gutenberg), with plain ASCII punctuation so every character can be typed. */
export const PASSAGES: readonly Passage[] = [
  {
    id: 'austen-pride',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    text:
      'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. ' +
      'However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed ' +
      'in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.',
  },
  {
    id: 'dickens-two-cities',
    title: 'A Tale of Two Cities',
    author: 'Charles Dickens',
    text:
      'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, ' +
      'it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, ' +
      'it was the spring of hope, it was the winter of despair.',
  },
  {
    id: 'twain-huck',
    title: 'Adventures of Huckleberry Finn',
    author: 'Mark Twain',
    text:
      "You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter. " +
      'That book was made by Mr. Mark Twain, and he told the truth, mainly. There was things which he stretched, but mainly he told the truth.',
  },
  {
    id: 'melville-moby',
    title: 'Moby-Dick',
    author: 'Herman Melville',
    text:
      'Call me Ishmael. Some years ago - never mind how long precisely - having little or no money in my purse, and nothing particular ' +
      'to interest me on shore, I thought I would sail about a little and see the watery part of the world. ' +
      'It is a way I have of driving off the spleen and regulating the circulation.',
  },
  {
    id: 'tolstoy-anna',
    title: 'Anna Karenina',
    author: 'Leo Tolstoy',
    text:
      "Happy families are all alike; every unhappy family is unhappy in its own way. Everything was in confusion in the Oblonskys' house. " +
      'The wife had discovered that the husband was carrying on an intrigue with a French girl, who had been a governess in their family, ' +
      'and she had announced to her husband that she could not go on living in the same house with him.',
  },
  {
    id: 'carroll-alice',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    text:
      'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had ' +
      "peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' " +
      "thought Alice 'without pictures or conversations?'",
  },
  {
    id: 'bronte-jane',
    title: 'Jane Eyre',
    author: 'Charlotte Bronte',
    text:
      'There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; ' +
      'but since dinner (Mrs. Reed, when there was no company, dined early) the cold winter wind had brought with it clouds so sombre, ' +
      'and a rain so penetrating, that further out-door exercise was now out of the question.',
  },
  {
    id: 'fitzgerald-gatsby',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    text:
      "In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. " +
      '"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world ' +
      "haven't had the advantages that you've had.\"",
  },
  {
    id: 'barrie-peter',
    title: 'Peter Pan',
    author: 'J. M. Barrie',
    text:
      'All children, except one, grow up. They soon know that they will grow up, and the way Wendy knew was this. ' +
      'One day when she was two years old she was playing in a garden, and she plucked another flower and ran with it to her mother.',
  },
  {
    id: 'baum-oz',
    title: 'The Wonderful Wizard of Oz',
    author: 'L. Frank Baum',
    text:
      'Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer\'s wife. ' +
      'Their house was small, for the lumber to build it had to be carried by wagon many miles.',
  },
  {
    id: 'dickens-carol',
    title: 'A Christmas Carol',
    author: 'Charles Dickens',
    text:
      'Marley was dead: to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, ' +
      'the clerk, the undertaker, and the chief mourner. Scrooge signed it.',
  },
  {
    id: 'shelley-frankenstein',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    text:
      'You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such ' +
      'evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence ' +
      'in the success of my undertaking.',
  },
  {
    id: 'doyle-bohemia',
    title: 'A Scandal in Bohemia',
    author: 'Arthur Conan Doyle',
    text:
      'To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. ' +
      'In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler.',
  },
  {
    id: 'alcott-little-women',
    title: 'Little Women',
    author: 'Louisa May Alcott',
    text:
      '"Christmas won\'t be Christmas without any presents," grumbled Jo, lying on the rug. ' +
      '"It\'s so dreadful to be poor!" sighed Meg, looking down at her old dress. ' +
      '"I don\'t think it\'s fair for some girls to have plenty of pretty things, and other girls nothing at all," added little Amy, with an injured sniff.',
  },
  {
    id: 'burnett-secret-garden',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    text:
      'When Mary Lennox was sent to Misselthwaite Manor to live with her uncle everybody said she was the most disagreeable-looking child ever seen. ' +
      'It was true, too. She had a little thin face and a little thin body, thin light hair and a sour expression.',
  },
  {
    id: 'grahame-willows',
    title: 'The Wind in the Willows',
    author: 'Kenneth Grahame',
    text:
      'The Mole had been working very hard all the morning, spring-cleaning his little home. First with brooms, then with dusters; ' +
      'then on ladders and steps and chairs, with a brush and a pail of whitewash; till he had dust in his throat and eyes, ' +
      'and splashes of whitewash all over his black fur, and an aching back and weary arms.',
  },
  {
    id: 'london-call',
    title: 'The Call of the Wild',
    author: 'Jack London',
    text:
      'Buck did not read the newspapers, or he would have known that trouble was brewing, not alone for himself, ' +
      'but for every tide-water dog, strong of muscle and with warm, long hair, from Puget Sound to San Diego.',
  },
  {
    id: 'wilde-dorian',
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    text:
      'The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, ' +
      'there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.',
  },
  {
    id: 'dickens-expectations',
    title: 'Great Expectations',
    author: 'Charles Dickens',
    text:
      "My father's family name being Pirrip, and my Christian name Philip, my infant tongue could make of both names nothing longer " +
      'or more explicit than Pip. So, I called myself Pip, and came to be called Pip.',
  },
  {
    id: 'austen-emma',
    title: 'Emma',
    author: 'Jane Austen',
    text:
      'Emma Woodhouse, handsome, clever, and rich, with a comfortable home and happy disposition, seemed to unite some of the best blessings ' +
      'of existence; and had lived nearly twenty-one years in the world with very little to distress or vex her.',
  },
  {
    id: 'sewell-black-beauty',
    title: 'Black Beauty',
    author: 'Anna Sewell',
    text:
      'The first place that I can well remember was a large pleasant meadow with a pond of clear water in it. ' +
      'Some shady trees leaned over the pond, and rushes and water-lilies grew at the deep end.',
  },
  {
    id: 'kipling-jungle',
    title: 'The Jungle Book',
    author: 'Rudyard Kipling',
    text:
      "It was seven o'clock of a very warm evening in the Seeonee hills when Father Wolf woke up from his day's rest, scratched himself, " +
      'yawned, and spread out his paws one after the other to get rid of the sleepy feeling in their tips.',
  },
  {
    id: 'wells-time-machine',
    title: 'The Time Machine',
    author: 'H. G. Wells',
    text:
      'The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. ' +
      'His grey eyes shone and twinkled, and his usually pale face was flushed and animated.',
  },
  {
    id: 'conrad-heart',
    title: 'Heart of Darkness',
    author: 'Joseph Conrad',
    text:
      'The Nellie, a cruising yawl, swung to her anchor without a flutter of the sails, and was at rest. ' +
      'The flood had made, the wind was nearly calm, and being bound down the river, the only thing for it was to come to and wait for the turn of the tide.',
  },
  {
    id: 'nesbit-railway',
    title: 'The Railway Children',
    author: 'E. Nesbit',
    text:
      "They were not railway children to begin with. I don't suppose they had ever thought about railways except as a means of getting " +
      "to Maskelyne and Cook's, the Pantomime, Zoological Gardens, and Madame Tussaud's.",
  },
  {
    id: 'burnett-little-princess',
    title: 'A Little Princess',
    author: 'Frances Hodgson Burnett',
    text:
      "Once on a dark winter's day, when the yellow fog hung so thick and heavy in the streets of London that the lamps were lighted " +
      'and the shop windows blazed with gas as they do at night, an odd-looking little girl sat in a cab with her father ' +
      'and drove rather slowly through the big thoroughfares.',
  },
  {
    id: 'woolf-dalloway',
    title: 'Mrs Dalloway',
    author: 'Virginia Woolf',
    text:
      'Mrs. Dalloway said she would buy the flowers herself. For Lucy had her work cut out for her. ' +
      "The doors would be taken off their hinges; Rumpelmayer's men were coming. " +
      'And then, thought Clarissa Dalloway, what a morning, fresh as if issued to children on a beach.',
  },
];

export function isPassageId(value: unknown): value is string {
  return typeof value === 'string' && PASSAGES.some((p) => p.id === value);
}

/** What separates passages in a timed test: the player presses Enter, as for a new paragraph. */
export const PASSAGE_BREAK = '\n';

/**
 * Deals passages in a shuffled order, every one before any comes round again,
 * and never the same one twice in a row across a reshuffle.
 */
export class PassageDeck {
  private queue: Passage[] = [];
  private last: Passage | null = null;

  constructor(
    private readonly rand: () => number,
    private readonly passages: readonly Passage[] = PASSAGES,
  ) {}

  next(): Passage {
    if (this.queue.length === 0) {
      const deck = [...this.passages];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(this.rand() * (i + 1));
        [deck[i], deck[j]] = [deck[j]!, deck[i]!];
      }
      if (deck.length > 1 && deck[0] === this.last) [deck[0], deck[1]] = [deck[1]!, deck[0]!];
      this.queue = deck;
    }
    this.last = this.queue.shift()!;
    return this.last;
  }
}

/** Passages from `deck` for a timed test, `first` and then as many as it takes for at least `minChars` (more than anyone types in time). */
export function drawPassages(deck: { next(): Passage }, minChars: number, first: Passage = deck.next()): Passage[] {
  const passages = [first];
  let chars = first.text.length;
  // Skip one already in this test (a chosen `first` can come round in the deck), unless they've all been used.
  for (let skips = 0; chars < minChars; ) {
    const next = deck.next();
    if (passages.includes(next) && skips++ < PASSAGES.length) continue;
    passages.push(next);
    chars += 1 + next.text.length;
  }
  return passages;
}

/** A passage's place in a test's text (a timed test strings several together). */
export interface PassageSpan {
  passage: Passage;
  start: number;
}

/** Text for a test: the passages one after another, with a PASSAGE_BREAK (Enter) between each. */
export function chainPassages(passages: readonly Passage[]): { text: string; spans: PassageSpan[] } {
  const spans: PassageSpan[] = [];
  let text = '';
  for (const passage of passages) {
    if (text !== '') text += PASSAGE_BREAK;
    spans.push({ passage, start: [...text].length });
    text += passage.text;
  }
  return { text, spans };
}

export interface FairCopy {
  text: string;
  /** For a timed test, how long it lasts; null to copy the whole text. */
  limitMs: number | null;
  /** What the player has typed, mistakes and all. One character per character of `text`. */
  buffer: string;
  /** When the first key was pressed, or null before then. */
  startedAt: number | null;
  /** When the test ended (last character typed, or time up), or null while going. */
  finishedAt: number | null;
  /** Right and wrong keystrokes (Backspace isn't either). */
  correct: number;
  errors: number;
  missedKeys: Record<string, number>;
  /** Correct keys in a row, and the best run. */
  streak: number;
  bestStreak: number;
  /** Time spent on each key: the gap since the previous key, when both were right. */
  keyTimes: Record<string, { totalMs: number; presses: number }>;
  /** The time of the last keystroke, and whether it was right. */
  lastKeyAt: number | null;
  lastWasCorrect: boolean;
}

export type FairCopyEvent = 'started' | 'correct' | 'error' | 'ignored' | 'fixed' | 'finished';

export function createFairCopy(text: string, limitMs: number | null = null): FairCopy {
  return {
    text,
    limitMs,
    buffer: '',
    startedAt: null,
    finishedAt: null,
    correct: 0,
    errors: 0,
    missedKeys: {},
    streak: 0,
    bestStreak: 0,
    keyTimes: {},
    lastKeyAt: null,
    lastWasCorrect: false,
  };
}

/** Whether each typed character matches the text. */
export function marks(test: Pick<FairCopy, 'buffer' | 'text'>): boolean[] {
  const text = [...test.text];
  return [...test.buffer].map((c, i) => c === text[i]);
}

/** Mistakes still on the page. */
export function mistakesLeft(test: Pick<FairCopy, 'buffer' | 'text'>): number {
  return marks(test).filter((ok) => !ok).length;
}

export function isFinished(test: FairCopy): boolean {
  return test.finishedAt !== null;
}

/** Ends a timed test once its time is up. Call it before reading the clock. */
export function tick(test: FairCopy, now: number): FairCopyEvent[] {
  if (isFinished(test) || test.startedAt === null || test.limitMs === null) return [];
  if (now - test.startedAt < test.limitMs) return [];
  test.finishedAt = test.startedAt + test.limitMs;
  return ['finished'];
}

/** Type one character at `now` (ms). It lands on the next letter, right or wrong. The first key starts the clock. */
export function typeKey(test: FairCopy, char: string, now: number): FairCopyEvent[] {
  const ended = tick(test, now);
  if (isFinished(test)) return ended.length > 0 ? ended : ['ignored'];
  const events: FairCopyEvent[] = [];
  if (test.startedAt === null) {
    test.startedAt = now;
    events.push('started');
  }
  const text = [...test.text];
  const at = [...test.buffer].length;
  const expected = text[at];
  test.buffer = applyEdit({ buffer: test.buffer, cursor: at }, { type: 'insert', char }).buffer;
  if (char === expected) {
    test.correct++;
    test.streak++;
    test.bestStreak = Math.max(test.bestStreak, test.streak);
    if (test.lastKeyAt !== null && test.lastWasCorrect) {
      const slot = (test.keyTimes[char] ??= { totalMs: 0, presses: 0 });
      slot.totalMs += now - test.lastKeyAt;
      slot.presses++;
    }
    test.lastWasCorrect = true;
    events.push('correct');
  } else {
    test.errors++;
    test.streak = 0;
    if (expected !== undefined) test.missedKeys[expected] = (test.missedKeys[expected] ?? 0) + 1;
    test.lastWasCorrect = false;
    events.push('error');
  }
  test.lastKeyAt = now;
  // The last character ends it, right or wrong.
  if (at + 1 >= text.length) {
    test.finishedAt = now;
    events.push('finished');
  }
  return events;
}

/** Backspace: take back the last character (optional: mistakes left in just cost speed). */
export function backspace(test: FairCopy, now: number): FairCopyEvent[] {
  const ended = tick(test, now);
  if (isFinished(test)) return ended.length > 0 ? ended : ['ignored'];
  if (test.buffer === '') return ['ignored'];
  const wasWrong = marks(test).at(-1) === false;
  test.buffer = applyEdit({ buffer: test.buffer, cursor: [...test.buffer].length }, { type: 'backspace' }).buffer;
  test.lastKeyAt = now;
  test.lastWasCorrect = false;
  return wasWrong ? ['fixed'] : [];
}

/** Time on the clock: zero before the first key, frozen once finished. */
export function elapsedMs(test: FairCopy, now: number): number {
  if (test.startedAt === null) return 0;
  const ms = (test.finishedAt ?? now) - test.startedAt;
  return test.limitMs === null ? ms : Math.min(ms, test.limitMs);
}

/** Time left in a timed test (its full length before the first key), or null for a passage. */
export function remainingMs(test: FairCopy, now: number): number | null {
  return test.limitMs === null ? null : Math.max(0, test.limitMs - elapsedMs(test, now));
}

export interface FairCopyResult {
  /** Net speed: characters on the page, less `errorPenaltyChars` for each mistake left in. */
  netWpm: number;
  /** Raw speed: every keystroke, right or wrong. */
  rawWpm: number;
  /** Speed lost to mistakes left in (gross minus net). */
  penaltyWpm: number;
  /** Right keystrokes over all keystrokes, 0..1. */
  accuracy: number;
  ms: number;
  correct: number;
  errors: number;
  mistakesLeft: number;
  /** Characters on the page. */
  typed: number;
  bestStreak: number;
  /** Slowest keys first, by average time per press. */
  slowestKeys: { key: string; averageMs: number }[];
}

/** Live numbers while typing (`now`), or the final ones once finished. */
export function fairCopyResult(test: FairCopy, now: number): FairCopyResult {
  const ms = elapsedMs(test, now);
  const c = GAME_CONFIG.fairCopy;
  const typed = [...test.buffer].length;
  const left = mistakesLeft(test);
  const gross = wpm({ correct: typed, playMs: ms });
  const netWpm = wpm({ correct: Math.max(0, typed - left * c.errorPenaltyChars), playMs: ms });
  const slowestKeys = Object.entries(test.keyTimes)
    .filter(([, slot]) => slot.presses >= c.slowKeyMinPresses)
    .map(([key, slot]) => ({ key, averageMs: slot.totalMs / slot.presses }))
    .sort((a, b) => b.averageMs - a.averageMs || a.key.localeCompare(b.key))
    .slice(0, c.slowKeysShown);
  return {
    netWpm,
    rawWpm: wpm({ correct: test.correct + test.errors, playMs: ms }),
    penaltyWpm: gross - netWpm,
    accuracy: accuracy(test),
    ms,
    correct: test.correct,
    errors: test.errors,
    mistakesLeft: left,
    typed,
    bestStreak: test.bestStreak,
    slowestKeys,
  };
}

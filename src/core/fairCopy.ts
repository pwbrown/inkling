/**
 * Fair Copy: a typing-speed test. The player copies out a passage (or as
 * much text as they can in a timed test); the clock starts on the first key.
 *
 * Mistakes don't block: each key lands on the next letter, right or wrong,
 * and Backspace can take keys back. Mistakes still on the page when the test
 * ends cost net speed (`errorPenaltyChars` each); every wrong key counts
 * against accuracy, fixed or not.
 *
 * PROTOTYPE (M31): no saving yet; passages are hard-coded until the design is signed off.
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
];

/** A passage's place in a test's text (a timed test strings several together). */
export interface PassageSpan {
  passage: Passage;
  start: number;
}

/**
 * Text for a timed test: passages one after another from `first`, round and
 * round, until there's at least `minChars` (more than anyone types in time).
 */
export function chainPassages(first: number, minChars: number, passages: readonly Passage[] = PASSAGES): { text: string; spans: PassageSpan[] } {
  const spans: PassageSpan[] = [];
  let text = '';
  for (let i = first; text.length < minChars && passages.length > 0; i++) {
    const passage = passages[i % passages.length]!;
    if (text !== '') text += ' ';
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

import { describe, expect, it } from 'vitest';
import {
  PASSAGES,
  backspace,
  chainPassages,
  createFairCopy,
  elapsedMs,
  fairCopyResult,
  isFinished,
  marks,
  mistakesLeft,
  remainingMs,
  tick,
  typeKey,
} from './fairCopy';

type Test = ReturnType<typeof createFairCopy>;

/** Type `keys` one every `stepMs` from `from` ("\b" is Backspace). Returns the time of the last key. */
const type = (test: Test, keys: string, from = 0, stepMs = 200) => {
  let now = from;
  for (const ch of keys) {
    if (ch === '\b') backspace(test, now);
    else typeKey(test, ch, now);
    now += stepMs;
  }
  return now - stepMs;
};

describe('Fair Copy', () => {
  it('starts the clock on the first key and stops it on the last character', () => {
    const test = createFairCopy('ink pot');
    expect(elapsedMs(test, 5000)).toBe(0);
    expect(typeKey(test, 'i', 1000)).toEqual(['started', 'correct']);
    const end = type(test, 'nk pot', 1200);
    expect(isFinished(test)).toBe(true);
    expect(elapsedMs(test, end + 10_000)).toBe(end - 1000);
  });

  it('lets mistakes stand: each key lands on the next letter', () => {
    const test = createFairCopy('ink pot');
    type(test, 'inx pot');
    expect(marks(test)).toEqual([true, true, false, true, true, true, true]);
    expect(test.errors).toBe(1);
    expect(test.missedKeys).toEqual({ k: 1 });
    // The last character ends it, mistakes and all.
    expect(isFinished(test)).toBe(true);
    expect(mistakesLeft(test)).toBe(1);
  });

  it('lets Backspace fix a mistake, which still counts against accuracy', () => {
    const test = createFairCopy('ink pot');
    type(test, 'inx');
    expect(backspace(test, 1000)).toEqual(['fixed']);
    type(test, 'k pot', 1200);
    expect(mistakesLeft(test)).toBe(0);
    expect(fairCopyResult(test, 0).accuracy).toBeCloseTo(7 / 8);
  });

  it('charges a word of net speed for each mistake left in', () => {
    // 10 characters in 6 seconds is 20 WPM gross; one mistake left costs 5 characters: 10 WPM net.
    const test = createFairCopy('aaaa bbbbb');
    type(test, 'aaaa bbbbx', 0, 6000 / 9);
    const result = fairCopyResult(test, 99_999);
    expect(result.ms).toBeCloseTo(6000);
    expect(result.netWpm).toBeCloseTo(10);
    expect(result.penaltyWpm).toBeCloseTo(10);
    expect(result.rawWpm).toBeCloseTo(20);
    expect(result.mistakesLeft).toBe(1);
  });

  it('ends a timed test when its time is up, not before', () => {
    const test = createFairCopy(chainPassages(0, 2000).text, 30_000);
    expect(remainingMs(test, 0)).toBe(30_000);
    typeKey(test, 'I', 1000);
    expect(tick(test, 30_999)).toEqual([]);
    expect(remainingMs(test, 21_000)).toBe(10_000);
    expect(tick(test, 31_000)).toEqual(['finished']);
    expect(elapsedMs(test, 99_999)).toBe(30_000);
    // Keys after the bell don't count.
    expect(typeKey(test, 't', 31_500)).toEqual(['ignored']);
    expect(test.buffer).toBe('I');
  });

  it('reports the slowest keys by their average time', () => {
    const test = createFairCopy('aaa bbb');
    typeKey(test, 'a', 0);
    typeKey(test, 'a', 300);
    typeKey(test, 'a', 600);
    typeKey(test, ' ', 800);
    typeKey(test, 'b', 1600);
    typeKey(test, 'b', 2400);
    typeKey(test, 'b', 3200);
    expect(fairCopyResult(test, 0).slowestKeys.map((k) => k.key)).toEqual(['b', 'a']);
  });

  it('strings passages together for a timed test', () => {
    const { text, spans } = chainPassages(1, 600);
    expect(spans[0]!.passage).toBe(PASSAGES[1]);
    expect(text.startsWith(PASSAGES[1]!.text)).toBe(true);
    expect(text.length).toBeGreaterThanOrEqual(600);
    expect(text.slice(spans[1]!.start)).toMatch(new RegExp(`^${PASSAGES[2]!.text.slice(0, 10)}`));
  });

  it('has passages made only of plain, typeable characters', () => {
    for (const passage of PASSAGES) expect(passage.text).toMatch(/^[\x20-\x7e]+$/);
  });
});

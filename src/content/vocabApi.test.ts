import { describe, expect, it } from 'vitest';
import { Blocklist } from './blocklist';
import { VocabError, cleanTopic, cleanWords, fetchTopicWords, topicUrl } from './vocabApi';

const blocklist = new Blocklist(['darn']);

const fakeFetch = (body: unknown, status = 200) => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const impl = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { impl, calls };
};

describe('vocabulary download', () => {
  it('accepts plain topics and rejects odd ones', () => {
    expect(cleanTopic('  Deep   Sea ')).toBe('deep sea');
    expect(cleanTopic("rock 'n' roll")).toBe("rock 'n' roll");
    expect(cleanTopic('a')).toBeNull();
    expect(cleanTopic('<script>')).toBeNull();
    expect(cleanTopic('x'.repeat(41))).toBeNull();
  });

  it('asks only for related words, with nothing identifying', async () => {
    const { impl, calls } = fakeFetch([{ word: 'sea' }, { word: 'reef' }]);
    const result = await fetchTopicWords('Ocean', blocklist, impl);
    expect(result).toEqual({ topic: 'ocean', words: ['sea', 'reef'] });
    expect(calls[0]?.url).toBe(topicUrl('ocean'));
    expect(calls[0]?.url).toBe('https://api.datamuse.com/words?ml=ocean&max=500');
    expect(calls[0]?.init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' });
  });

  it('keeps single lowercase words and drops blocked or malformed ones', () => {
    expect(
      cleanWords([{ word: 'Sea' }, { word: 'deep sea' }, { word: 'darn' }, { word: 'x' }, { word: 'reef' }, { word: 'reef' }, 'junk'], blocklist),
    ).toEqual(['sea', 'reef']);
    expect(cleanWords({ not: 'a list' }, blocklist)).toEqual([]);
  });

  it('reports failures with a reason', async () => {
    const reason = async (p: Promise<unknown>) => p.then(() => 'ok', (e: VocabError) => e.reason);
    expect(await reason(fetchTopicWords('?', blocklist, fakeFetch([]).impl))).toBe('invalid-topic');
    expect(await reason(fetchTopicWords('ocean', blocklist, fakeFetch([], 500).impl))).toBe('failed');
    expect(await reason(fetchTopicWords('ocean', blocklist, fakeFetch([{ word: 'darn' }]).impl))).toBe('empty');
    const offline = (async () => {
      throw new TypeError('network');
    }) as unknown as typeof fetch;
    expect(await reason(fetchTopicWords('ocean', blocklist, offline))).toBe('offline');
  });
});

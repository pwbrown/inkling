/**
 * Optional topic vocabulary (REQUIREMENTS §6): downloads words related to a
 * topic from the free Datamuse API. Only ever runs when the player asks, and
 * sends nothing but the topic: no cookies, no referrer, no identifiers.
 */
import type { Blocklist } from './blocklist';

export const VOCAB_API_ORIGIN = 'https://api.datamuse.com';

/**
 * Most words to ask for. Datamuse documents up to 1000, but browsers get
 * CORS errors for max=1000 (checked 2026-11-12), so stay at 500.
 */
const MAX_WORDS = 500;

export class VocabError extends Error {
  constructor(
    message: string,
    readonly reason: 'invalid-topic' | 'offline' | 'failed' | 'empty',
  ) {
    super(message);
    this.name = 'VocabError';
  }
}

/** Letters, spaces, hyphens and apostrophes only; 2–40 characters. */
export function cleanTopic(topic: string): string | null {
  const clean = topic.trim().replace(/\s+/g, ' ').toLowerCase();
  return /^[\p{L}][\p{L} '-]{1,39}$/u.test(clean) ? clean : null;
}

/** Keep single lowercase a–z words of 2–14 letters that pass the blocklist. */
export function cleanWords(raw: unknown, blocklist: Blocklist): string[] {
  if (!Array.isArray(raw)) return [];
  const out = new Set<string>();
  for (const item of raw) {
    const word = typeof item === 'object' && item !== null ? (item as { word?: unknown }).word : undefined;
    if (typeof word !== 'string') continue;
    const lower = word.toLowerCase();
    if (/^[a-z]{2,14}$/.test(lower) && !blocklist.blocksWord(lower)) out.add(lower);
  }
  return [...out];
}

export function topicUrl(topic: string): string {
  const url = new URL('/words', VOCAB_API_ORIGIN);
  url.searchParams.set('ml', topic);
  url.searchParams.set('max', String(MAX_WORDS));
  return url.toString();
}

/** Download and clean words for a topic. Throws VocabError on failure. */
export async function fetchTopicWords(
  topic: string,
  blocklist: Blocklist,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<{ topic: string; words: string[] }> {
  const clean = cleanTopic(topic);
  if (!clean) throw new VocabError('Invalid topic', 'invalid-topic');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new VocabError('Offline', 'offline');

  let response: Response;
  try {
    response = await fetchImpl(topicUrl(clean), {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    });
  } catch {
    throw new VocabError('Network error', 'offline');
  }
  if (!response.ok) throw new VocabError(`HTTP ${response.status}`, 'failed');

  const words = cleanWords(await response.json().catch(() => null), blocklist);
  if (words.length === 0) throw new VocabError('No usable words', 'empty');
  return { topic: clean, words };
}

/**
 * The save file: everything Inkling keeps on the device (REQUIREMENTS §8).
 * It never leaves the device unless the player exports it themselves.
 *
 * Bump SAVE_VERSION and add a step to `MIGRATIONS` whenever the shape
 * changes, so older saves (and exported backups) keep loading.
 */
import { APPRENTICE_CHAPTERS, type GameMode } from '../core/campaign';
import { DEFAULT_DIFFICULTY, DEFAULT_KEYS, DIFFICULTIES, type Difficulty } from '../core/config';
import { isMechanic } from '../core/mechanics';
import { DEFAULT_COSMETICS, UNLOCKS, type Cosmetics } from '../core/rewards';
import { DEFAULT_CONTENT_LEVEL, isContentLevel, type ContentLevel } from '../content/contentFilter';

export const SAVE_VERSION = 7;

export interface KeyStat {
  /** Times typed correctly. */
  hits: number;
  /** Times missed (see input.ts for how misses are attributed). */
  misses: number;
}

export interface SavedPreset {
  id: string;
  name: string;
  chars: string[];
}

/** A notebook in progress, saved at the start of each page so it can be continued. */
export interface SavedNotebook {
  /** Added in version 3; older saves were all Practice. */
  mode: GameMode;
  difficulty: Difficulty;
  /** Chapter and page to resume at (0-based). */
  chapter: number;
  page: number;
  ink: number;
  score: number;
  correct: number;
  errors: number;
  destroyed: number;
  bestCombo: number;
  playMs: number;
  /** Ability charges and held passives when the page began (added in version 7). */
  charges: number;
  eraser: boolean;
  shield: boolean;
  /** ISO timestamp. */
  savedAt: string;
}

/** A downloaded topic word list (REQUIREMENTS §6, optional vocabulary fetch). */
export interface VocabList {
  id: string;
  topic: string;
  words: string[];
  /** Whether its words are used in the game. */
  enabled: boolean;
  /** ISO timestamp. */
  fetchedAt: string;
}

/** Apprentice campaign progress (added in version 3). */
export interface ApprenticeProgress {
  /** How many chapters are open to play (at least 1). */
  unlocked: number;
  /** Best stars (1–3) per page, keyed "chapter-page" (see starKey). */
  stars: Record<string, number>;
  /** The last chapter has been finished at least once. */
  completed: boolean;
}

/** Ink earned (XP) and equipped cosmetics (added in version 4). */
export interface Progression {
  /** Total ink earned; level and rank follow from it. */
  ink: number;
  cosmetics: Cosmetics;
}

export interface Records {
  bestScore: Partial<Record<Difficulty, number>>;
  /** Highest chapter reached (1-based). */
  furthestChapter: Partial<Record<Difficulty, number>>;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  keys: string[];
  difficulty: Difficulty;
  customPresets: SavedPreset[];
  keyStats: Record<string, KeyStat>;
  records: Records;
  notebook: SavedNotebook | null;
  /** Added in version 2. */
  vocab: VocabList[];
  /** Added in version 3. */
  apprentice: ApprenticeProgress;
  /** Added in version 4. */
  profile: Progression;
  /** How much the word list leaves out for this player (added in version 6). */
  contentLevel: ContentLevel;
  /** Which mechanics this player has been shown, and whether to show more (added in version 7). */
  tutorials: Tutorials;
}

export interface Tutorials {
  /** Show a briefing before a page that has something new. */
  enabled: boolean;
  /** Mechanic ids (core/mechanics.ts) already explained. */
  seen: string[];
}

/** File format for export/import. */
export interface SaveExport {
  app: 'inkling';
  exportedAt: string;
  save: SaveData;
}

export class SaveFormatError extends Error {
  constructor(
    message: string,
    /** 'invalid' = not an Inkling save; 'newer' = made by a newer version of the game. */
    readonly reason: 'invalid' | 'newer' = 'invalid',
  ) {
    super(message);
    this.name = 'SaveFormatError';
  }
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    keys: [...DEFAULT_KEYS],
    difficulty: DEFAULT_DIFFICULTY,
    customPresets: [],
    keyStats: {},
    records: { bestScore: {}, furthestChapter: {} },
    notebook: null,
    vocab: [],
    apprentice: { unlocked: 1, stars: {}, completed: false },
    profile: { ink: 0, cosmetics: { ...DEFAULT_COSMETICS } },
    contentLevel: DEFAULT_CONTENT_LEVEL,
    tutorials: { enabled: true, seen: [] },
  };
}

// --- Validation -------------------------------------------------------------
// Saves come from IndexedDB or from files the player imports, so every field
// is checked rather than trusted.

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const isDifficulty = (v: unknown): v is Difficulty => DIFFICULTIES.includes(v as Difficulty);
const count = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
/** A single character (one code point), as the game uses for keys. */
const isChar = (v: unknown): v is string => typeof v === 'string' && [...v].length === 1;

function chars(v: unknown): string[] {
  return Array.isArray(v) ? [...new Set(v.filter(isChar))] : [];
}

function difficultyRecord(v: unknown): Partial<Record<Difficulty, number>> {
  const out: Partial<Record<Difficulty, number>> = {};
  if (isObject(v)) for (const d of DIFFICULTIES) if (d in v) out[d] = count(v[d]);
  return out;
}

function sanitizeNotebook(v: unknown): SavedNotebook | null {
  if (!isObject(v) || !isDifficulty(v.difficulty)) return null;
  return {
    mode: v.mode === 'apprentice' ? 'apprentice' : 'practice',
    difficulty: v.difficulty,
    chapter: count(v.chapter),
    page: count(v.page),
    ink: count(v.ink),
    score: count(v.score),
    correct: count(v.correct),
    errors: count(v.errors),
    destroyed: count(v.destroyed),
    bestCombo: count(v.bestCombo),
    playMs: count(v.playMs),
    charges: count(v.charges),
    eraser: v.eraser === true,
    shield: v.shield === true,
    savedAt: typeof v.savedAt === 'string' ? v.savedAt : new Date(0).toISOString(),
  };
}

function sanitizeVocab(v: unknown): VocabList[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((list): VocabList[] => {
    if (!isObject(list) || typeof list.id !== 'string' || typeof list.topic !== 'string') return [];
    const words = Array.isArray(list.words)
      ? [...new Set(list.words.filter((w): w is string => typeof w === 'string' && /^[a-z]{2,14}$/.test(w)))]
      : [];
    if (words.length === 0) return [];
    return [
      {
        id: list.id,
        topic: list.topic.slice(0, 40),
        words,
        enabled: list.enabled !== false,
        fetchedAt: typeof list.fetchedAt === 'string' ? list.fetchedAt : new Date(0).toISOString(),
      },
    ];
  });
}

function sanitizeApprentice(v: unknown): ApprenticeProgress {
  const a = isObject(v) ? v : {};
  const stars: Record<string, number> = {};
  if (isObject(a.stars)) {
    for (const [key, value] of Object.entries(a.stars)) {
      if (/^\d+-\d+$/.test(key) && typeof value === 'number' && value >= 1 && value <= 3) stars[key] = Math.floor(value);
    }
  }
  return {
    unlocked: Math.min(APPRENTICE_CHAPTERS, Math.max(1, count(a.unlocked) || 1)),
    stars,
    completed: a.completed === true,
  };
}

function sanitizeProfile(v: unknown): Progression {
  const p = isObject(v) ? v : {};
  const c = isObject(p.cosmetics) ? p.cosmetics : {};
  const pick = <S extends keyof Cosmetics>(slot: S): Cosmetics[S] =>
    typeof c[slot] === 'string' && c[slot] in UNLOCKS[slot] ? (c[slot] as Cosmetics[S]) : DEFAULT_COSMETICS[slot];
  return { ink: count(p.ink), cosmetics: { nib: pick('nib'), splatter: pick('splatter'), paper: pick('paper') } };
}

/** Check every field of a current-version save. */
function sanitize(v: Json): SaveData {
  const base = defaultSave();
  const keys = chars(v.keys);

  const keyStats: Record<string, KeyStat> = {};
  if (isObject(v.keyStats)) {
    for (const [ch, stat] of Object.entries(v.keyStats)) {
      if (isChar(ch) && isObject(stat)) keyStats[ch] = { hits: count(stat.hits), misses: count(stat.misses) };
    }
  }

  const customPresets: SavedPreset[] = Array.isArray(v.customPresets)
    ? v.customPresets.flatMap((p): SavedPreset[] => {
        if (!isObject(p) || typeof p.id !== 'string' || typeof p.name !== 'string') return [];
        const presetChars = chars(p.chars);
        return presetChars.length > 0 ? [{ id: p.id, name: p.name.slice(0, 40), chars: presetChars }] : [];
      })
    : [];

  const records = isObject(v.records) ? v.records : {};

  return {
    version: SAVE_VERSION,
    keys: keys.length > 0 ? keys : base.keys,
    difficulty: isDifficulty(v.difficulty) ? v.difficulty : base.difficulty,
    customPresets,
    keyStats,
    records: { bestScore: difficultyRecord(records.bestScore), furthestChapter: difficultyRecord(records.furthestChapter) },
    notebook: sanitizeNotebook(v.notebook),
    vocab: sanitizeVocab(v.vocab),
    apprentice: sanitizeApprentice(v.apprentice),
    profile: sanitizeProfile(v.profile),
    contentLevel: isContentLevel(v.contentLevel) ? v.contentLevel : DEFAULT_CONTENT_LEVEL,
    tutorials: sanitizeTutorials(v.tutorials),
  };
}

function sanitizeTutorials(v: unknown): Tutorials {
  if (!isObject(v)) return { enabled: true, seen: [] };
  const seen = Array.isArray(v.seen) ? [...new Set(v.seen.filter(isMechanic))] : [];
  return { enabled: v.enabled !== false, seen };
}

/**
 * Mechanics that existed before version 7, with the first Apprentice chapter
 * (0-based) each appeared in. A player who had already finished that chapter
 * has met it, so the new briefings skip it.
 */
const MECHANICS_BEFORE_V7: Record<string, number> = {
  basics: 0,
  blotling: 0,
  combo: 0,
  blotter: 0,
  crimson: 4,
  spill: 6,
  ghost: 8,
  runon: 10,
  misprint: 15,
  violet: 16,
};

function seenBeforeV7(save: Json): string[] {
  const unlocked = isObject(save.apprentice) ? count(save.apprentice.unlocked) : 1;
  // Chapters finished: one fewer than the chapters opened.
  const finished = Math.max(0, unlocked - 1);
  return Object.entries(MECHANICS_BEFORE_V7)
    .filter(([, chapter]) => finished > chapter)
    .map(([id]) => id);
}

/** Upgrade steps: MIGRATIONS[n] turns a version-n save into version n+1. */
const MIGRATIONS: Record<number, (save: Json) => Json> = {
  // v2 added downloaded topic word lists.
  1: (save) => ({ ...save, version: 2, vocab: [] }),
  // v3 added the Apprentice campaign; existing saved notebooks were Practice.
  2: (save) => ({
    ...save,
    version: 3,
    apprentice: { unlocked: 1, stars: {}, completed: false },
    notebook: isObject(save.notebook) ? { ...save.notebook, mode: 'practice' } : null,
  }),
  // v4 added ink (XP) and cosmetics.
  3: (save) => ({ ...save, version: 4, profile: { ink: 0, cosmetics: { ...DEFAULT_COSMETICS } } }),
  // v5 rebuilt the Apprentice course (one key per chapter), so its old
  // chapter progress and stars no longer line up: start it fresh.
  4: (save) => ({
    ...save,
    version: 5,
    apprentice: { unlocked: 1, stars: {}, completed: false },
    notebook: isObject(save.notebook) && save.notebook.mode === 'apprentice' ? null : save.notebook,
  }),
  // v6 added the word filter, starting at the strictest level.
  5: (save) => ({ ...save, version: 6, contentLevel: DEFAULT_CONTENT_LEVEL }),
  // v7 added tutorials (players keep credit for what they'd already met) and
  // ability charges on a saved notebook.
  6: (save) => ({
    ...save,
    version: 7,
    tutorials: { enabled: true, seen: seenBeforeV7(save) },
    notebook: isObject(save.notebook) ? { ...save.notebook, charges: 0, eraser: false, shield: false } : null,
  }),
};

/** Load any supported save shape as the current version, or throw SaveFormatError. */
export function migrate(raw: unknown): SaveData {
  if (!isObject(raw)) throw new SaveFormatError('Not a save file');
  let data = raw;
  let version = typeof data.version === 'number' ? data.version : NaN;
  if (!Number.isInteger(version) || version < 1) throw new SaveFormatError('Missing save version');
  if (version > SAVE_VERSION) throw new SaveFormatError(`Save version ${version} is newer than this game`, 'newer');

  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new SaveFormatError(`No migration from version ${version}`);
    data = step(data);
    version++;
  }
  return sanitize(data);
}

export function toExport(save: SaveData, now = new Date()): SaveExport {
  return { app: 'inkling', exportedAt: now.toISOString(), save };
}

/** Parse an exported file's text. Throws SaveFormatError if it isn't one. */
export function fromExport(text: string): SaveData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SaveFormatError('Not valid JSON');
  }
  if (!isObject(parsed) || parsed.app !== 'inkling') throw new SaveFormatError('Not an Inkling save file');
  return migrate(parsed.save);
}

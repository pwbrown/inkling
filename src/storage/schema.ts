/**
 * The save file: everything Inkling keeps on the device (REQUIREMENTS §8).
 * It never leaves the device unless the player exports it themselves.
 *
 * Bump SAVE_VERSION and add a step to `MIGRATIONS` whenever the shape
 * changes, so older saves (and exported backups) keep loading.
 */
import { DEFAULT_DIFFICULTY, DEFAULT_KEYS, DIFFICULTIES, type Difficulty } from '../core/config';

export const SAVE_VERSION = 1;

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
  /** ISO timestamp. */
  savedAt: string;
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
    savedAt: typeof v.savedAt === 'string' ? v.savedAt : new Date(0).toISOString(),
  };
}

function sanitizeV1(v: Json): SaveData {
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
  };
}

/**
 * Upgrade steps: MIGRATIONS[n] turns a version-n save into version n+1.
 * Empty while there's only one version.
 */
const MIGRATIONS: Record<number, (save: Json) => Json> = {};

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
  return sanitizeV1(data);
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

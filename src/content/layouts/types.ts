/**
 * Keyboard layouts are data, not code (REQUIREMENTS §11): each describes its
 * physical keys and the characters they produce. New layouts are new files.
 */
export type Hand = 'left' | 'right' | 'both';

/** Touch-typing finger for a key. */
export type Finger = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';

/** 0 = number row, 1 = top, 2 = home, 3 = bottom, 4 = space bar row. */
export type RowIndex = 0 | 1 | 2 | 3 | 4;

export interface LayoutKey {
  /** KeyboardEvent.code of the physical key. */
  code: string;
  /** Character produced without Shift. */
  base: string;
  /** Character produced with Shift, if any. */
  shift?: string;
  /** Character produced with AltGr (Ctrl+Alt on Windows), if any (ISO layouts). */
  altGr?: string;
  /** Character produced with Shift+AltGr, if any. */
  altGrShift?: string;
  /**
   * Levels that are dead keys: pressing them types nothing until the next
   * key, which they combine with (`^` then `e` = `ê`; `^` then space = `^`).
   */
  dead?: readonly KeyLevel[];
  /** Hand used in standard touch typing. */
  hand: Hand;
  /** Finger used in standard touch typing. */
  finger: Finger;
  /** Relative key width (1 = a normal key). */
  width?: number;
  /** A home key, where a finger rests (one per finger, thumbs aside). */
  home?: true;
}

/** Which modifiers a character needs on its key. */
export type KeyLevel = 'base' | 'shift' | 'altGr' | 'altGrShift';

export const KEY_LEVELS: readonly KeyLevel[] = ['base', 'shift', 'altGr', 'altGrShift'];

/** The layouts Inky Keys knows. */
export type LayoutId = 'us-qwerty' | 'dvorak' | 'colemak' | 'fr-azerty' | 'es-iso';

/** Which computers a layout's key help is for: Macs label and place a few keys differently. */
export type Platform = 'mac' | 'pc';

/** Per-key changes on one platform (only the keys that differ). */
export type KeyOverrides = Readonly<Record<string, Partial<Pick<LayoutKey, 'base' | 'shift' | 'altGr' | 'altGrShift' | 'dead'>>>>;

export interface KeyboardLayout {
  id: LayoutId;
  /** Rows from the number row down to the space bar. */
  rows: LayoutKey[][];
  /**
   * The Apprentice course (core/campaign.ts): the keys each chapter
   * introduces, in teaching order. Every layout has the same number of
   * chapters, so progress carries over when a player switches.
   */
  lessons: readonly (readonly string[])[];
  /** Physical keyboard: ANSI (US-style) or ISO (the extra key left of Z, a tall Enter). */
  physical: 'ansi' | 'iso';
  /**
   * What each dead key makes with the key after it, by the dead key's own
   * character: `{ '^': { e: 'ê', ' ': '^' } }`. Empty for layouts without dead keys.
   */
  compose: Readonly<Record<string, Readonly<Record<string, string>>>>;
  /** Keys that type something else on a Mac (the PC layout is the default). */
  mac?: KeyOverrides;
}

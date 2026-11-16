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
  /** Hand used in standard touch typing. */
  hand: Hand;
  /** Finger used in standard touch typing. */
  finger: Finger;
  /** Relative key width (1 = a normal key). */
  width?: number;
  /** A home key, where a finger rests (one per finger, thumbs aside). */
  home?: true;
}

/** The layouts Inky Keys knows. */
export type LayoutId = 'us-qwerty' | 'dvorak' | 'colemak';

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
}

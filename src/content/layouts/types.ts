/**
 * Keyboard layouts are data, not code (REQUIREMENTS §11): each describes its
 * physical keys and the characters they produce. New layouts are new files.
 */
export type Hand = 'left' | 'right' | 'both';

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
  /** Relative key width (1 = a normal key). */
  width?: number;
}

export interface KeyboardLayout {
  id: string;
  /** Rows from the number row down to the space bar. */
  rows: LayoutKey[][];
}

/**
 * Buffer mode (REQUIREMENTS §3): Run-ons and Misprints keep a text buffer
 * with a cursor, edited with typing, Backspace, Delete and the arrow keys.
 * Pure string helpers; input.ts applies them to targets.
 */

export type EditAction =
  | { type: 'insert'; char: string }
  | { type: 'backspace' }
  | { type: 'delete' }
  | { type: 'left' }
  | { type: 'right' }
  | { type: 'home' }
  | { type: 'end' };

export interface BufferState {
  buffer: string;
  /** Cursor position in code points, 0..length. */
  cursor: number;
}

/** Apply one edit. Positions are in code points so non-ASCII characters work. */
export function applyEdit({ buffer, cursor }: BufferState, action: EditAction): BufferState {
  const chars = [...buffer];
  const at = Math.min(Math.max(0, cursor), chars.length);
  switch (action.type) {
    case 'insert':
      chars.splice(at, 0, action.char);
      return { buffer: chars.join(''), cursor: at + 1 };
    case 'backspace':
      if (at === 0) return { buffer, cursor: at };
      chars.splice(at - 1, 1);
      return { buffer: chars.join(''), cursor: at - 1 };
    case 'delete':
      if (at >= chars.length) return { buffer, cursor: at };
      chars.splice(at, 1);
      return { buffer: chars.join(''), cursor: at };
    case 'left':
      return { buffer, cursor: Math.max(0, at - 1) };
    case 'right':
      return { buffer, cursor: Math.min(chars.length, at + 1) };
    case 'home':
      return { buffer, cursor: 0 };
    case 'end':
      return { buffer, cursor: chars.length };
  }
}

/** Levenshtein edit distance in code points. */
export function editDistance(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const row = [i];
    for (let j = 1; j <= y.length; j++) {
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[y.length]!;
}

/** How many leading characters of `buffer` match `text`. */
export function correctPrefix(buffer: string, text: string): number {
  const b = [...buffer];
  const t = [...text];
  let n = 0;
  while (n < b.length && n < t.length && b[n] === t[n]) n++;
  return n;
}

/** Whether an edit changes the text (as opposed to moving the cursor). */
export function isTextEdit(action: EditAction): boolean {
  return action.type === 'insert' || action.type === 'backspace' || action.type === 'delete';
}

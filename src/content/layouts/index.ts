/** Every keyboard layout Inkling knows (REQUIREMENTS §11). */
import { COLEMAK } from './colemak';
import { DVORAK } from './dvorak';
import type { KeyboardLayout, LayoutId } from './types';
import { US_QWERTY } from './us-qwerty';

export { findKey } from './ansi';

export const LAYOUTS: readonly KeyboardLayout[] = [US_QWERTY, DVORAK, COLEMAK];

export const LAYOUT_IDS: readonly LayoutId[] = LAYOUTS.map((l) => l.id);

/** New players start on US QWERTY. */
export const DEFAULT_LAYOUT_ID: LayoutId = 'us-qwerty';

export function isLayoutId(value: unknown): value is LayoutId {
  return typeof value === 'string' && (LAYOUT_IDS as readonly string[]).includes(value);
}

/** The layout with this id, or US QWERTY for an unknown one. */
export function layoutById(id: string): KeyboardLayout {
  return LAYOUTS.find((l) => l.id === id) ?? US_QWERTY;
}

export { COLEMAK, DVORAK, US_QWERTY };

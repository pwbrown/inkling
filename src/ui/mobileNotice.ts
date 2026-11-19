/**
 * "Made for a keyboard" (M29): a one-time note on phones and tablets with no
 * mouse or trackpad, where the game may not work as intended. It never
 * stops anyone playing. Remembered per browser in localStorage.
 */
const STORAGE_KEY = 'inkling.keyboardNotice';

/** A touch screen is the only pointer: most likely a phone or tablet with no keyboard attached. */
export function isTouchOnly(media: (query: string) => boolean = (q) => globalThis.matchMedia?.(q).matches ?? false): boolean {
  return media('(pointer: coarse)') && !media('(any-pointer: fine)');
}

export function needsKeyboardNotice(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): boolean {
  if (!isTouchOnly()) return false;
  try {
    return storage?.getItem(STORAGE_KEY) !== 'seen';
  } catch {
    return true;
  }
}

export function markKeyboardNoticeSeen(storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(STORAGE_KEY, 'seen');
  } catch {
    // Blocked storage: it may show again next time, which is harmless.
  }
}

/**
 * DOM keyboard listener. Turns raw KeyboardEvents into game intents and keeps
 * the browser from acting on them (scrolling on Space, Quick Find on ' and /).
 */
export interface KeyboardHandlers {
  /** A printable character was typed. */
  onChar(char: string): void;
  /** Enter: start, continue, or restart. */
  onConfirm(): void;
  /** Escape: pause or resume. */
  onPause(): void;
  /**
   * Arrow keys, Backspace, Delete, Home, End and Tab: menu navigation or
   * text editing, depending on the screen. Return true if it was used, so
   * the browser's default (like Tab moving focus) is suppressed.
   */
  onSpecial(key: SpecialKey): boolean;
}

export const SPECIAL_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete', 'Home', 'End', 'Tab'] as const;
export type SpecialKey = (typeof SPECIAL_KEYS)[number];

const isSpecial = (key: string): key is SpecialKey => (SPECIAL_KEYS as readonly string[]).includes(key);

/** True for a single printable character (letters, digits, symbols, space). */
export function isPrintable(key: string): boolean {
  // Named keys ("Shift", "ArrowLeft", "Dead", …) are longer than one code
  // point. Spread handles characters outside the BMP.
  return [...key].length === 1;
}

/**
 * Starts listening on `target`. Returns a function that stops listening.
 * While `isSuspended()` is true (e.g. a menu screen is open) keys are left
 * for that screen to handle.
 */
export function bindKeyboard(
  target: Window,
  handlers: KeyboardHandlers,
  isSuspended: () => boolean = () => false,
): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (isSuspended() || event.defaultPrevented) return;
    // Leave browser and OS shortcuts alone. AltGr layouts are a later concern (REQUIREMENTS §11).
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      handlers.onPause();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) handlers.onConfirm();
    } else if (isSpecial(event.key)) {
      if (handlers.onSpecial(event.key)) event.preventDefault();
    } else if (isPrintable(event.key)) {
      event.preventDefault();
      // Holding a key down shouldn't machine-gun targets or errors.
      if (!event.repeat) handlers.onChar(event.key);
    }
  };

  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

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
}

/** True for a single printable character (letters, digits, symbols, space). */
export function isPrintable(key: string): boolean {
  // Named keys ("Shift", "ArrowLeft", "Dead", …) are longer than one code
  // point. Spread handles characters outside the BMP.
  return [...key].length === 1;
}

/** Starts listening on `target`. Returns a function that stops listening. */
export function bindKeyboard(target: Window, handlers: KeyboardHandlers): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    // Leave browser and OS shortcuts alone. AltGr layouts are a later concern (REQUIREMENTS §11).
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      handlers.onPause();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat) handlers.onConfirm();
    } else if (isPrintable(event.key)) {
      event.preventDefault();
      // Holding a key down shouldn't machine-gun targets or errors.
      if (!event.repeat) handlers.onChar(event.key);
    }
  };

  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}

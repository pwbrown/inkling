/**
 * DOM keyboard listener. Turns raw KeyboardEvents into game intents and keeps
 * the browser from acting on them (scrolling on Space, Quick Find on ' and /).
 *
 * Plain keys are read from `keydown`. Characters built from more than one key
 * (a dead key then a letter, `^` + `e` = `ê`, or anything an input method
 * composes) only reach a text field, so while the game listens a hidden
 * one, the typing field, holds the focus and its composed text is typed too.
 */
import type { Platform } from '../content/layouts/types';

/** A dead key was pressed: it types nothing yet, and combines with the next key. */
export interface DeadKeyPress {
  /** KeyboardEvent.code of the physical key. */
  code: string;
  shift: boolean;
  /** AltGr (or Option on a Mac). */
  altGr: boolean;
}

export interface KeyboardHandlers {
  /**
   * A printable character was typed. `code` is the physical key, or
   * undefined for a character composed from several keys.
   */
  onChar(char: string, code?: string): void;
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
  /** A dead key is waiting for its letter. Never a mistake. */
  onDeadKey?(press: DeadKeyPress): void;
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

/** What a keydown means to the game. */
export type KeyAction =
  | { type: 'ignore' }
  /** Left for the typing field: it arrives there as composed text. */
  | { type: 'compose' }
  | { type: 'dead'; press: DeadKeyPress }
  | { type: 'pause' }
  | { type: 'confirm' }
  | { type: 'special'; key: SpecialKey }
  | { type: 'char'; char: string; code: string };

/** The parts of a KeyboardEvent that decide what it means. */
export interface KeyDownLike {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  isComposing: boolean;
  keyCode?: number;
  /** AltGr, where the browser reports it (Firefox, Chrome on Windows). */
  altGraph?: boolean;
}

/**
 * Sort a keydown (pure, so it can be tested without a browser). On Windows
 * AltGr arrives as Ctrl+Alt, and it types characters, so it isn't treated as
 * a shortcut; on a Mac Option types characters too. Ctrl and Cmd shortcuts,
 * and Alt ones on a PC, are left to the browser and the OS.
 */
export function classifyKeyDown(event: KeyDownLike, platform: Platform): KeyAction {
  const altGr = event.altGraph === true || (event.ctrlKey && event.altKey);
  if ((event.ctrlKey || event.metaKey) && !altGr) return { type: 'ignore' };
  if (event.altKey && !altGr && platform === 'pc') return { type: 'ignore' };
  // Mid-composition (after a dead key, or in an input method): the typing field gets the result.
  if (event.isComposing || event.key === 'Process' || event.keyCode === 229) return { type: 'compose' };
  if (event.key === 'Dead') {
    return { type: 'dead', press: { code: event.code, shift: event.shiftKey, altGr: altGr || event.altKey } };
  }
  if (event.key === 'Escape') return { type: 'pause' };
  if (event.key === 'Enter') return { type: 'confirm' };
  if (isSpecial(event.key)) return { type: 'special', key: event.key };
  const char = event.key.normalize('NFC');
  if (isPrintable(char)) return { type: 'char', char, code: event.code };
  return { type: 'ignore' };
}

/**
 * Text from the typing field, one character at a time, in NFC (so `e` plus a
 * combining accent is the same `é` as a single key). Some browsers report a
 * dead key's result both as a keydown and as composed text; a repeat of the
 * character just typed from a keydown, within `windowMs`, is dropped.
 */
export class ComposedText {
  private last: { char: string; at: number } | null = null;

  constructor(private readonly windowMs = 50) {}

  /** A character was typed from a keydown. */
  typed(char: string, at: number): void {
    this.last = { char, at };
  }

  /** Characters to type from composed text arriving at `at`. */
  take(text: string, at: number): string[] {
    const chars = [...text.normalize('NFC')];
    const last = this.last;
    this.last = null;
    if (last && chars.length === 1 && chars[0] === last.char && at - last.at <= this.windowMs) return [];
    return chars;
  }
}

/** Which kind of computer this is, from what the browser says (read locally; nothing is sent). */
export function detectPlatform(nav: { platform?: string; userAgentData?: { platform?: string } } | undefined = globalThis.navigator): Platform {
  const name = nav?.userAgentData?.platform ?? nav?.platform ?? '';
  return /mac|iphone|ipad/i.test(name) ? 'mac' : 'pc';
}

let field: HTMLTextAreaElement | null = null;
let fieldLabel = 'Typing';

/** The accessible name of the typing field (set from the translations at startup). */
export function setTypingFieldLabel(label: string): void {
  fieldLabel = label;
  field?.setAttribute('aria-label', label);
}

/** The hidden typing field, made on first use. */
function typingField(): HTMLTextAreaElement {
  if (field?.isConnected) return field;
  const el = document.createElement('textarea');
  el.className = 'typing-field';
  el.setAttribute('aria-label', fieldLabel);
  el.setAttribute('autocapitalize', 'off');
  el.setAttribute('autocomplete', 'off');
  el.setAttribute('autocorrect', 'off');
  el.spellcheck = false;
  // A physical keyboard still types into it; a touch screen doesn't pop up its keyboard.
  el.inputMode = 'none';
  el.tabIndex = -1;
  el.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;resize:none;border:0;padding:0;';
  document.body.append(el);
  field = el;
  return el;
}

/** Put the focus in the typing field, unless something else (a menu, a text box) has it. */
function focusTypingField(): void {
  const el = typingField();
  const active = document.activeElement;
  if (active === el) return;
  // Leave the focus where the player put it (a button, a text box), unless that's hidden or gone.
  const elsewhere = active instanceof HTMLElement && active !== document.body && !(active instanceof HTMLCanvasElement);
  if (elsewhere && active.isConnected && active.offsetParent !== null) return;
  el.focus({ preventScroll: true });
}

let platform: Platform = 'pc';

/** Which kind of computer the player has (settings.keyboardKind): decides what Alt means. */
export function setKeyboardPlatform(next: Platform): void {
  platform = next;
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
  const composed = new ComposedText();
  const sink = typingField();
  let composing = false;

  const deliver = (chars: string[]) => {
    for (const ch of chars) handlers.onChar(ch);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (isSuspended() || event.defaultPrevented) return;
    focusTypingField();
    const action = classifyKeyDown(
      {
        key: event.key,
        code: event.code,
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        isComposing: event.isComposing,
        keyCode: event.keyCode,
        altGraph: event.getModifierState?.('AltGraph') ?? false,
      },
      platform,
    );
    switch (action.type) {
      case 'ignore':
      case 'compose':
        return;
      case 'dead':
        // Left alone, so the browser composes it with the next key.
        handlers.onDeadKey?.(action.press);
        return;
      case 'pause':
        event.preventDefault();
        handlers.onPause();
        return;
      case 'confirm':
        event.preventDefault();
        if (!event.repeat) handlers.onConfirm();
        return;
      case 'special':
        if (handlers.onSpecial(action.key)) event.preventDefault();
        return;
      case 'char':
        event.preventDefault();
        // Holding a key down shouldn't machine-gun targets or errors.
        if (event.repeat) return;
        composed.typed(action.char, event.timeStamp);
        handlers.onChar(action.char, action.code);
    }
  };

  const onCompositionStart = () => {
    composing = true;
  };
  const onCompositionEnd = (event: CompositionEvent) => {
    composing = false;
    sink.value = '';
    if (isSuspended()) return;
    deliver(composed.take(event.data ?? '', event.timeStamp));
  };
  const onBeforeInput = (event: InputEvent) => {
    // Composition text arrives with compositionend; plain text the keydown didn't take arrives here.
    if (composing || event.inputType !== 'insertText') return;
    event.preventDefault();
    if (isSuspended() || !event.data) return;
    deliver(composed.take(event.data, event.timeStamp));
  };
  const onInput = () => {
    if (!composing) sink.value = '';
  };
  const onPointerDown = () => {
    if (!isSuspended()) setTimeout(focusTypingField, 0);
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('pointerdown', onPointerDown);
  sink.addEventListener('compositionstart', onCompositionStart);
  sink.addEventListener('compositionend', onCompositionEnd);
  sink.addEventListener('beforeinput', onBeforeInput);
  sink.addEventListener('input', onInput);
  if (!isSuspended()) focusTypingField();
  return () => {
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('pointerdown', onPointerDown);
    sink.removeEventListener('compositionstart', onCompositionStart);
    sink.removeEventListener('compositionend', onCompositionEnd);
    sink.removeEventListener('beforeinput', onBeforeInput);
    sink.removeEventListener('input', onInput);
  };
}

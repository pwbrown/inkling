import { describe, expect, it } from 'vitest';
import { ComposedText, classifyKeyDown, detectPlatform, isPrintable, type KeyDownLike } from './keyboard';

describe('isPrintable', () => {
  it('accepts single characters, including space and symbols', () => {
    for (const key of ['a', 'A', '1', ';', ' ', '!', 'é']) expect(isPrintable(key)).toBe(true);
  });

  it('rejects named keys', () => {
    for (const key of ['Shift', 'Enter', 'ArrowLeft', 'Dead', 'Backspace', '']) expect(isPrintable(key)).toBe(false);
  });
});

const key = (over: Partial<KeyDownLike>): KeyDownLike => ({
  key: 'a',
  code: 'KeyA',
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  isComposing: false,
  ...over,
});

describe('classifyKeyDown', () => {
  it('types plain keys with their physical key', () => {
    expect(classifyKeyDown(key({ key: 'é', code: 'Digit2' }), 'pc')).toEqual({ type: 'char', char: 'é', code: 'Digit2' });
  });

  it('types AltGr characters, which Windows reports as Ctrl+Alt', () => {
    expect(classifyKeyDown(key({ key: '@', code: 'Digit0', ctrlKey: true, altKey: true }), 'pc')).toMatchObject({ type: 'char', char: '@' });
    expect(classifyKeyDown(key({ key: '€', code: 'KeyE', altGraph: true }), 'pc')).toMatchObject({ type: 'char', char: '€' });
  });

  it('types Option characters on a Mac, but leaves Alt shortcuts alone on a PC', () => {
    expect(classifyKeyDown(key({ key: 'ç', code: 'KeyC', altKey: true }), 'mac')).toMatchObject({ type: 'char', char: 'ç' });
    expect(classifyKeyDown(key({ key: 'f', code: 'KeyF', altKey: true }), 'pc')).toEqual({ type: 'ignore' });
  });

  it('leaves Ctrl and Cmd shortcuts to the browser', () => {
    expect(classifyKeyDown(key({ key: 'r', ctrlKey: true }), 'pc')).toEqual({ type: 'ignore' });
    expect(classifyKeyDown(key({ key: 'r', metaKey: true }), 'mac')).toEqual({ type: 'ignore' });
  });

  it('reports dead keys, which are never typed or missed', () => {
    expect(classifyKeyDown(key({ key: 'Dead', code: 'BracketLeft', shiftKey: true }), 'pc')).toEqual({
      type: 'dead',
      press: { code: 'BracketLeft', shift: true, altGr: false },
    });
    expect(classifyKeyDown(key({ key: 'Dead', code: 'KeyE', altKey: true }), 'mac')).toMatchObject({ type: 'dead', press: { altGr: true } });
  });

  it('leaves composing keys for the typing field', () => {
    expect(classifyKeyDown(key({ key: 'ê', isComposing: true }), 'mac')).toEqual({ type: 'compose' });
    expect(classifyKeyDown(key({ key: 'Process' }), 'pc')).toEqual({ type: 'compose' });
    expect(classifyKeyDown(key({ key: 'Unidentified', keyCode: 229 }), 'pc')).toEqual({ type: 'compose' });
  });

  it('normalizes a composed key to one character', () => {
    expect(classifyKeyDown(key({ key: 'e\u0301' }), 'pc')).toMatchObject({ type: 'char', char: 'é' });
  });

  it('keeps Escape, Enter and editing keys', () => {
    expect(classifyKeyDown(key({ key: 'Escape' }), 'pc')).toEqual({ type: 'pause' });
    expect(classifyKeyDown(key({ key: 'Enter' }), 'pc')).toEqual({ type: 'confirm' });
    expect(classifyKeyDown(key({ key: 'Backspace' }), 'pc')).toEqual({ type: 'special', key: 'Backspace' });
    expect(classifyKeyDown(key({ key: 'Shift' }), 'pc')).toEqual({ type: 'ignore' });
  });
});

describe('ComposedText', () => {
  it('splits composed text into NFC characters', () => {
    expect(new ComposedText().take('e\u0302', 0)).toEqual(['ê']);
    // A dead key before a letter it can't combine with gives both: the accent, then the letter.
    expect(new ComposedText().take('^z', 0)).toEqual(['^', 'z']);
  });

  it('drops a character just typed from a keydown, so it never counts twice', () => {
    const text = new ComposedText(50);
    text.typed('ê', 100);
    expect(text.take('ê', 120)).toEqual([]);
    text.typed('ê', 200);
    expect(text.take('ê', 300)).toEqual(['ê']);
    expect(text.take('ê', 301)).toEqual(['ê']);
  });
});

describe('detectPlatform', () => {
  it('tells a Mac from the rest', () => {
    expect(detectPlatform({ userAgentData: { platform: 'macOS' } })).toBe('mac');
    expect(detectPlatform({ platform: 'MacIntel' })).toBe('mac');
    expect(detectPlatform({ platform: 'Win32' })).toBe('pc');
    expect(detectPlatform({ userAgentData: { platform: 'Chrome OS' } })).toBe('pc');
    expect(detectPlatform({})).toBe('pc');
  });
});

import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadSettings, parseSettings, reducedMotion, saveSettings } from './settings';

describe('settings', () => {
  it('fills in defaults and drops bad values', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ textSize: 'huge', theme: 'night', volume: 7, muted: 'yes' })).toEqual({
      ...DEFAULT_SETTINGS,
      theme: 'night',
      volume: 1,
    });
    expect(parseSettings({ pageWriting: 'off' }).pageWriting).toBe('off');
    expect(parseSettings({ pageWriting: 'sometimes' }).pageWriting).toBe('on');
  });

  it('round-trips through storage', () => {
    const map = new Map<string, string>();
    const storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
    saveSettings({ ...DEFAULT_SETTINGS, textSize: 'larger', muted: true }, storage);
    expect(loadSettings(storage)).toMatchObject({ textSize: 'larger', muted: true });
  });

  it('survives blocked or corrupt storage', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadSettings(throwing)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS, throwing)).not.toThrow();
    expect(loadSettings({ getItem: () => '{not json' })).toEqual(DEFAULT_SETTINGS);
  });

  it('resolves motion against the system preference', () => {
    expect(reducedMotion({ ...DEFAULT_SETTINGS, motion: 'system' }, true)).toBe(true);
    expect(reducedMotion({ ...DEFAULT_SETTINGS, motion: 'full' }, true)).toBe(false);
    expect(reducedMotion({ ...DEFAULT_SETTINGS, motion: 'reduced' }, false)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { RELEASES } from './core/releases';
import { APP_VERSION, loadSeenVersion, saveSeenVersion } from './version';

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (k) => items.get(k) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (k) => void items.delete(k),
    setItem: (k, v) => void items.set(k, v),
  };
}

describe('version', () => {
  it('is the newest release', () => {
    expect(APP_VERSION).toBe(RELEASES[0]?.version);
  });

  it('remembers the last version seen', () => {
    const storage = memoryStorage();
    expect(loadSeenVersion(storage)).toBeNull();
    expect(saveSeenVersion('2.6.0', storage)).toBe(true);
    expect(loadSeenVersion(storage)).toBe('2.6.0');
  });

  it('ignores junk and copes with blocked storage', () => {
    const storage = memoryStorage();
    storage.setItem('inkling.lastVersion', 'not a version');
    expect(loadSeenVersion(storage)).toBeNull();
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadSeenVersion(blocked)).toBeNull();
    expect(saveSeenVersion('2.6.0', blocked)).toBe(false);
  });
});

/**
 * The running game's version (from package.json, set at build time) and the
 * version this browser last ran, so players see what's new after an update.
 * The last-seen version is per browser, not per player, so it lives in
 * localStorage beside the settings rather than in the save.
 */
import { isVersion } from './core/releases';

declare const __APP_VERSION__: string;

export const APP_VERSION: string = __APP_VERSION__;

// Keeps the game's first name (Inkling), like the settings key.
const STORAGE_KEY = 'inkling.lastVersion';

/** The version this browser last ran, or null if none was recorded. */
export function loadSeenVersion(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): string | null {
  try {
    const value = storage?.getItem(STORAGE_KEY);
    return isVersion(value) ? value : null;
  } catch {
    return null;
  }
}

/** Remember `version` as seen. Returns false if storage is blocked. */
export function saveSeenVersion(version: string, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, version);
    return true;
  } catch {
    return false;
  }
}

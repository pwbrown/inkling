/**
 * Where the save lives: IndexedDB, with an in-memory fallback when the
 * browser blocks storage (some private modes). REQUIREMENTS §8.
 */
import { defaultSave, migrate, type SaveData } from './schema';

// Still named after the game's first name (Inkling): renaming it would hide existing saves.
const DB_NAME = 'inkling';
const DB_VERSION = 1;
const STORE = 'saves';
/** Key of the first (or only) player's save. Other players' saves have their own keys (see profiles.ts). */
export const SAVE_KEY = 'main';

/**
 * Records stored by key: one save per player, plus the list of players.
 * `key` defaults to the first player's save.
 */
export interface SaveBackend {
  /** Whether saves survive a reload. */
  readonly persistent: boolean;
  load(key?: string): Promise<unknown>;
  save(data: object, key?: string): Promise<void>;
  clear(key?: string): Promise<void>;
}

export class MemoryBackend implements SaveBackend {
  readonly persistent = false;
  private readonly records = new Map<string, unknown>();

  async load(key = SAVE_KEY): Promise<unknown> {
    const data = this.records.get(key);
    return data === undefined ? undefined : structuredClone(data);
  }

  async save(data: object, key = SAVE_KEY): Promise<void> {
    this.records.set(key, structuredClone(data));
  }

  async clear(key = SAVE_KEY): Promise<void> {
    this.records.delete(key);
  }
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class IndexedDbBackend implements SaveBackend {
  readonly persistent = true;

  private constructor(private readonly db: IDBDatabase) {}

  static async open(factory: IDBFactory = indexedDB): Promise<IndexedDbBackend> {
    const req = factory.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    return new IndexedDbBackend(await request(req));
  }

  private store(mode: IDBTransactionMode): IDBObjectStore {
    return this.db.transaction(STORE, mode).objectStore(STORE);
  }

  async load(key = SAVE_KEY): Promise<unknown> {
    return request(this.store('readonly').get(key));
  }

  async save(data: object, key = SAVE_KEY): Promise<void> {
    await request(this.store('readwrite').put(data, key));
  }

  async clear(key = SAVE_KEY): Promise<void> {
    await request(this.store('readwrite').delete(key));
  }
}

/** IndexedDB if available, otherwise memory (the game still works, it just forgets). */
export async function openBackend(): Promise<SaveBackend> {
  try {
    if (typeof indexedDB === 'undefined') return new MemoryBackend();
    return await IndexedDbBackend.open();
  } catch {
    return new MemoryBackend();
  }
}

/** Load a save, falling back to a fresh one if it's missing or unreadable. */
async function loadSave(backend: SaveBackend, key: string): Promise<SaveData> {
  try {
    const raw = await backend.load(key);
    return raw === undefined ? defaultSave() : migrate(raw);
  } catch {
    // An unreadable save shouldn't stop the game from starting.
    return defaultSave();
  }
}

/**
 * Holds the current player's save and writes changes back, batching rapid
 * updates into one write.
 */
export class SaveStore {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: Promise<void> = Promise.resolve();

  private constructor(
    private readonly backend: SaveBackend,
    private current: SaveData,
    private readonly delayMs: number,
    private key: string,
  ) {}

  /** Load a player's save (the first player's by default). */
  static async open(backend: SaveBackend, delayMs = 250, key = SAVE_KEY): Promise<SaveStore> {
    return new SaveStore(backend, await loadSave(backend, key), delayMs, key);
  }

  /** The backend key of the save in use. */
  get saveKey(): string {
    return this.key;
  }

  /** Write the current save, then switch to another player's. */
  async switchTo(key: string): Promise<void> {
    if (key === this.key) return;
    await this.flush();
    this.current = await loadSave(this.backend, key);
    this.key = key;
  }

  get data(): Readonly<SaveData> {
    return this.current;
  }

  get persistent(): boolean {
    return this.backend.persistent;
  }

  /** Change the save. The write happens shortly after, batched with other changes. */
  update(change: (draft: SaveData) => void): void {
    const draft = structuredClone(this.current);
    change(draft);
    this.current = draft;
    this.schedule();
  }

  /** Replace the whole save (e.g. after an import). */
  replace(data: SaveData): Promise<void> {
    this.current = structuredClone(data);
    return this.flush();
  }

  /** Delete everything and start over. */
  async erase(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    await this.pending;
    await this.backend.clear(this.key);
    this.current = defaultSave();
  }

  /** Write now (e.g. before the page unloads). */
  flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const snapshot = this.current;
    const key = this.key;
    this.pending = this.pending.then(() => this.backend.save(snapshot, key)).catch(() => {});
    return this.pending;
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delayMs);
  }
}

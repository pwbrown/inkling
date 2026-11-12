/**
 * Where the save lives: IndexedDB, with an in-memory fallback when the
 * browser blocks storage (some private modes). REQUIREMENTS §8.
 */
import { defaultSave, migrate, type SaveData } from './schema';

const DB_NAME = 'inkling';
const DB_VERSION = 1;
const STORE = 'saves';
const SAVE_KEY = 'main';

export interface SaveBackend {
  /** Whether saves survive a reload. */
  readonly persistent: boolean;
  load(): Promise<unknown>;
  save(data: SaveData): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryBackend implements SaveBackend {
  readonly persistent = false;
  private data: unknown;

  async load(): Promise<unknown> {
    return this.data === undefined ? undefined : structuredClone(this.data);
  }

  async save(data: SaveData): Promise<void> {
    this.data = structuredClone(data);
  }

  async clear(): Promise<void> {
    this.data = undefined;
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

  async load(): Promise<unknown> {
    return request(this.store('readonly').get(SAVE_KEY));
  }

  async save(data: SaveData): Promise<void> {
    await request(this.store('readwrite').put(data, SAVE_KEY));
  }

  async clear(): Promise<void> {
    await request(this.store('readwrite').delete(SAVE_KEY));
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

/**
 * Holds the current save and writes changes back, batching rapid updates
 * into one write.
 */
export class SaveStore {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: Promise<void> = Promise.resolve();

  private constructor(
    private readonly backend: SaveBackend,
    private current: SaveData,
    private readonly delayMs: number,
  ) {}

  /** Load the save, falling back to a fresh one if it's missing or unreadable. */
  static async open(backend: SaveBackend, delayMs = 250): Promise<SaveStore> {
    let data = defaultSave();
    try {
      const raw = await backend.load();
      if (raw !== undefined) data = migrate(raw);
    } catch {
      // An unreadable save shouldn't stop the game from starting.
      data = defaultSave();
    }
    return new SaveStore(backend, data, delayMs);
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
    await this.backend.clear();
    this.current = defaultSave();
  }

  /** Write now (e.g. before the page unloads). */
  flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const snapshot = this.current;
    this.pending = this.pending.then(() => this.backend.save(snapshot)).catch(() => {});
    return this.pending;
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delayMs);
  }
}

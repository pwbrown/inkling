import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { defaultSave } from './schema';
import { IndexedDbBackend, MemoryBackend, SaveStore } from './store';

const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

describe('IndexedDbBackend', () => {
  it('persists a save across connections', async () => {
    const factory = new IDBFactory();
    const first = await IndexedDbBackend.open(factory);
    const save = defaultSave();
    save.keys = ['x', 'y'];
    await first.save(save);

    const second = await IndexedDbBackend.open(factory);
    expect(await second.load()).toEqual(save);

    await second.clear();
    expect(await second.load()).toBeUndefined();
  });
});

describe('SaveStore', () => {
  it('starts from a default save when nothing is stored', async () => {
    const store = await SaveStore.open(new MemoryBackend());
    expect(store.data).toEqual(defaultSave());
  });

  it('starts from a default save when the stored data is unreadable', async () => {
    const backend = new MemoryBackend();
    await backend.save({ version: 99 } as never);
    const store = await SaveStore.open(backend);
    expect(store.data).toEqual(defaultSave());
  });

  it('batches updates into one write', async () => {
    const backend = new MemoryBackend();
    let writes = 0;
    const original = backend.save.bind(backend);
    backend.save = async (data) => {
      writes++;
      return original(data);
    };
    const store = await SaveStore.open(backend, 10);

    store.update((s) => s.keys.push('q'));
    store.update((s) => s.keys.push('w'));
    expect(writes).toBe(0);
    await tick(30);
    expect(writes).toBe(1);
    expect(((await backend.load()) as { keys: string[] }).keys.slice(-2)).toEqual(['q', 'w']);
  });

  it('does not let callers mutate the stored save directly', async () => {
    const store = await SaveStore.open(new MemoryBackend());
    const before = store.data;
    store.update((s) => s.keys.push('é'));
    expect(before.keys).not.toContain('é');
  });

  it('flush writes immediately, and erase resets everything', async () => {
    const backend = new MemoryBackend();
    const store = await SaveStore.open(backend, 10_000);
    store.update((s) => {
      s.difficulty = 'expert';
    });
    await store.flush();
    expect(((await backend.load()) as { difficulty: string }).difficulty).toBe('expert');

    await store.erase();
    expect(store.data).toEqual(defaultSave());
    expect(await backend.load()).toBeUndefined();
  });

  it('reloads what it saved', async () => {
    const factory = new IDBFactory();
    const store = await SaveStore.open(await IndexedDbBackend.open(factory));
    store.update((s) => {
      s.records.bestScore.normal = 777;
    });
    await store.flush();

    const reopened = await SaveStore.open(await IndexedDbBackend.open(factory));
    expect(reopened.data.records.bestScore.normal).toBe(777);
    expect(reopened.persistent).toBe(true);
  });
});

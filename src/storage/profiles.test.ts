import { describe, expect, it } from 'vitest';
import { FIRST_PLAYER_ID, MAX_NAME_LENGTH, PROFILES_KEY, PlayerStore, sanitizePlayers, saveKeyFor } from './profiles';
import { MemoryBackend, SAVE_KEY, SaveStore } from './store';

describe('sanitizePlayers', () => {
  it('starts with one player on the original save', () => {
    const list = sanitizePlayers(undefined, 'Player 1');
    expect(list.players).toHaveLength(1);
    expect(list.activeId).toBe(FIRST_PLAYER_ID);
    expect(saveKeyFor(FIRST_PLAYER_ID)).toBe(SAVE_KEY);
    expect(list.players[0]!.name).toBe('Player 1');
  });

  it('drops malformed and duplicate players, and fixes a missing active id', () => {
    const list = sanitizePlayers(
      {
        activeId: 'gone',
        players: [{ id: 'a', name: '  Ada   Lovelace ', badge: 'teal' }, { id: 'a', name: 'dupe' }, { name: 'no id' }, 7, { id: 'b', name: 'x'.repeat(50), badge: 'nope' }],
      },
      'Player 1',
    );
    expect(list.players.map((p) => p.id)).toEqual(['a', 'b']);
    expect(list.players[0]!.name).toBe('Ada Lovelace');
    expect(list.players[1]!.name).toHaveLength(MAX_NAME_LENGTH);
    expect(list.players[1]!.badge).toBe('ink');
    expect(list.activeId).toBe('a');
  });
});

describe('PlayerStore', () => {
  it('adds, renames and switches players, keeping each save apart', async () => {
    const backend = new MemoryBackend();
    const players = await PlayerStore.open(backend, 'Player 1');
    const saves = await SaveStore.open(backend, 0, saveKeyFor(players.active.id));
    saves.update((s) => {
      s.keys = ['f', 'j'];
    });
    await saves.flush();

    const sam = (await players.add('Sam', 'gold', new Date(1000)))!;
    expect(sam.id).not.toBe(FIRST_PLAYER_ID);
    await players.setActive(sam.id);
    await saves.switchTo(saveKeyFor(sam.id));
    expect(saves.data.keys).not.toEqual(['f', 'j']);
    saves.update((s) => {
      s.keys = ['a'];
    });

    await saves.switchTo(saveKeyFor(FIRST_PLAYER_ID));
    expect(saves.data.keys).toEqual(['f', 'j']);
    await saves.switchTo(saveKeyFor(sam.id));
    expect(saves.data.keys).toEqual(['a']);

    await players.edit(sam.id, 'Samira', 'violet');
    const reopened = await PlayerStore.open(backend, 'Player 1');
    expect(reopened.list.players.map((p) => p.name)).toEqual(['Player 1', 'Samira']);
    expect(reopened.active.id).toBe(sam.id);
    expect(await backend.load(PROFILES_KEY)).toBeDefined();
  });

  it('removes a player and their save, but never the last one', async () => {
    const backend = new MemoryBackend();
    const players = await PlayerStore.open(backend, 'Player 1');
    const sam = (await players.add('Sam', 'gold'))!;
    await backend.save({ keys: ['z'] }, saveKeyFor(sam.id));
    await players.setActive(sam.id);

    expect(await players.remove(sam.id)).toBe(FIRST_PLAYER_ID);
    expect(await backend.load(saveKeyFor(sam.id))).toBeUndefined();
    expect(players.list.players).toHaveLength(1);
    await players.remove(FIRST_PLAYER_ID);
    expect(players.list.players).toHaveLength(1);
  });

  it('refuses blank names', async () => {
    const players = await PlayerStore.open(new MemoryBackend(), 'Player 1');
    expect(await players.add('   ', 'ink')).toBeNull();
  });
});

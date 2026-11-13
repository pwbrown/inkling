/**
 * Players sharing one browser. Each player has their own save (progress,
 * ink, cosmetics, keys and stats); display and sound settings stay shared.
 *
 * The list of players is stored beside the saves, under its own key and
 * with its own version, so it never changes the save format. The first
 * player keeps the original save key, so a browser that played before
 * players existed carries on with no migration.
 */
import { SAVE_KEY, type SaveBackend } from './store';

export const PROFILES_KEY = 'profiles';
export const PROFILES_VERSION = 1;

/** Color of a player's ink-drop badge. */
export type Badge = 'ink' | 'crimson' | 'violet' | 'teal' | 'gold' | 'moss';

export const BADGES: readonly Badge[] = ['ink', 'crimson', 'violet', 'teal', 'gold', 'moss'];

export interface Player {
  id: string;
  name: string;
  badge: Badge;
  createdAt: string;
}

export interface PlayerList {
  version: typeof PROFILES_VERSION;
  activeId: string;
  players: Player[];
}

/** Longest name allowed. */
export const MAX_NAME_LENGTH = 20;
/** Most players on one browser. */
export const MAX_PLAYERS = 8;

/** The first player's id: their save uses the original key. */
export const FIRST_PLAYER_ID = 'main';

/** Where a player's save is stored. */
export function saveKeyFor(id: string): string {
  return id === FIRST_PLAYER_ID ? SAVE_KEY : `save:${id}`;
}

export function cleanName(name: string): string {
  return [...name.replace(/\s+/g, ' ').trim()].slice(0, MAX_NAME_LENGTH).join('');
}

export function defaultPlayers(firstName: string, now = new Date()): PlayerList {
  return {
    version: PROFILES_VERSION,
    activeId: FIRST_PLAYER_ID,
    players: [{ id: FIRST_PLAYER_ID, name: cleanName(firstName), badge: 'ink', createdAt: now.toISOString() }],
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/** Check stored data, dropping anything malformed. Always returns at least one player. */
export function sanitizePlayers(raw: unknown, firstName: string): PlayerList {
  if (!isRecord(raw) || !Array.isArray(raw.players)) return defaultPlayers(firstName);
  const seen = new Set<string>();
  const players: Player[] = [];
  for (const p of raw.players) {
    if (!isRecord(p) || typeof p.id !== 'string' || !p.id || seen.has(p.id)) continue;
    const name = typeof p.name === 'string' ? cleanName(p.name) : '';
    seen.add(p.id);
    players.push({
      id: p.id,
      name: name || cleanName(firstName),
      badge: BADGES.includes(p.badge as Badge) ? (p.badge as Badge) : 'ink',
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date(0).toISOString(),
    });
    if (players.length >= MAX_PLAYERS) break;
  }
  if (players.length === 0) return defaultPlayers(firstName);
  const activeId = typeof raw.activeId === 'string' && seen.has(raw.activeId) ? raw.activeId : players[0]!.id;
  return { version: PROFILES_VERSION, activeId, players };
}

/** The list of players, written to the backend on every change. */
export class PlayerStore {
  private constructor(
    private readonly backend: SaveBackend,
    private current: PlayerList,
  ) {}

  /** Load the list. `firstName` names the first player when there's no list yet. */
  static async open(backend: SaveBackend, firstName: string): Promise<PlayerStore> {
    let raw: unknown;
    try {
      raw = await backend.load(PROFILES_KEY);
    } catch {
      raw = undefined;
    }
    return new PlayerStore(backend, sanitizePlayers(raw, firstName));
  }

  get list(): Readonly<PlayerList> {
    return this.current;
  }

  get active(): Player {
    return this.current.players.find((p) => p.id === this.current.activeId) ?? this.current.players[0]!;
  }

  get canAdd(): boolean {
    return this.current.players.length < MAX_PLAYERS;
  }

  async setActive(id: string): Promise<void> {
    if (!this.current.players.some((p) => p.id === id)) return;
    await this.write({ ...this.current, activeId: id });
  }

  /** Add a player and return them (null if the browser already has the most allowed). */
  async add(name: string, badge: Badge, now = new Date()): Promise<Player | null> {
    if (!this.canAdd) return null;
    const player: Player = { id: newId(now, this.current.players), name: cleanName(name), badge, createdAt: now.toISOString() };
    if (!player.name) return null;
    await this.write({ ...this.current, players: [...this.current.players, player] });
    return player;
  }

  async edit(id: string, name: string, badge: Badge): Promise<void> {
    const clean = cleanName(name);
    if (!clean) return;
    await this.write({
      ...this.current,
      players: this.current.players.map((p) => (p.id === id ? { ...p, name: clean, badge } : p)),
    });
  }

  /**
   * Remove a player and their save. The last player can't be removed. If the
   * active player is removed, the first remaining one becomes active; returns
   * the id that is active afterwards.
   */
  async remove(id: string): Promise<string> {
    const players = this.current.players.filter((p) => p.id !== id);
    if (players.length === 0 || players.length === this.current.players.length) return this.current.activeId;
    const activeId = this.current.activeId === id ? players[0]!.id : this.current.activeId;
    await this.write({ ...this.current, activeId, players });
    await this.backend.clear(saveKeyFor(id));
    return activeId;
  }

  private async write(next: PlayerList): Promise<void> {
    this.current = next;
    try {
      await this.backend.save(next, PROFILES_KEY);
    } catch {
      // Keep going in memory if storage fails.
    }
  }
}

function newId(now: Date, players: readonly Player[]): string {
  const base = `p${now.getTime().toString(36)}`;
  let id = base;
  for (let i = 2; players.some((p) => p.id === id); i++) id = `${base}-${i}`;
  return id;
}

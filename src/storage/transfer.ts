/**
 * Transfer links: a player's whole save, compressed into the part of a link
 * after `#t=`, so it can move to another device without any server. The
 * player sends the link to themselves however they like (email, notes, a
 * message); browsers never send the #fragment to the website.
 *
 * Downloaded word lists are left out to keep links short (they can be
 * downloaded again). Opening a link checks the save exactly as importing a
 * backup file does (schema.ts `migrate`).
 */
import { base64UrlToBytes, bytesToBase64Url } from '../core/base64url';
import { BADGES, cleanName, type Badge } from './profiles';
import { SaveFormatError, migrate, type SaveData } from './schema';

export interface Transfer {
  player: { name: string; badge: Badge };
  save: SaveData;
}

/** The fragment key: `#t=…`. */
export const TRANSFER_PARAM = 't';

/**
 * Longest link worth offering. Browsers take far longer ones, but some
 * messaging apps cut long links short; past this, the backup file is safer.
 */
export const MAX_TRANSFER_LENGTH = 12_000;

/** Most bytes a link may unpack to, so a hostile link can't fill memory. */
const MAX_UNPACKED = 2_000_000;

async function compress(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(bytes: Uint8Array): Promise<string> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_UNPACKED) {
      await reader.cancel();
      throw new SaveFormatError('Transfer link too large');
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(all);
}

/** Whether this browser can make and read transfer links. */
export function canTransfer(): boolean {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

/** The fragment for a transfer, e.g. "t=…" (no leading #). */
export async function encodeTransfer(save: SaveData, player: Transfer['player'], now = new Date()): Promise<string> {
  const payload = { app: 'inkling', kind: 'transfer', exportedAt: now.toISOString(), player, save: { ...save, vocab: [] } };
  return `${TRANSFER_PARAM}=${bytesToBase64Url(await compress(JSON.stringify(payload)))}`;
}

/** Whether a fragment carries a transfer (valid or not). */
export function hasTransfer(hash: string): boolean {
  return new URLSearchParams(hash.replace(/^#/, '')).has(TRANSFER_PARAM);
}

/**
 * Read a transfer from a URL fragment. Throws SaveFormatError if it's
 * damaged, isn't one, or comes from a newer version of the game.
 */
export async function decodeTransfer(hash: string): Promise<Transfer> {
  const code = new URLSearchParams(hash.replace(/^#/, '')).get(TRANSFER_PARAM);
  if (!code) throw new SaveFormatError('No transfer in link');
  let data: unknown;
  try {
    data = JSON.parse(await decompress(base64UrlToBytes(code)));
  } catch (error) {
    if (error instanceof SaveFormatError) throw error;
    throw new SaveFormatError('Damaged transfer link');
  }
  if (typeof data !== 'object' || data === null) throw new SaveFormatError('Not a transfer link');
  const v = data as Record<string, unknown>;
  if (v.app !== 'inkling' || v.kind !== 'transfer') throw new SaveFormatError('Not a transfer link');
  const p = (typeof v.player === 'object' && v.player !== null ? v.player : {}) as Record<string, unknown>;
  const name = cleanName(typeof p.name === 'string' ? p.name : '');
  const badge = BADGES.includes(p.badge as Badge) ? (p.badge as Badge) : 'ink';
  return { player: { name, badge }, save: migrate(v.save) };
}

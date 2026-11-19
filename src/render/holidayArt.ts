/**
 * Holiday trimmings (core/seasons.ts): hats, leaves, holly, turkey tails and
 * snowflakes, drawn in PixiJS for the page decor, the creatures, the scribe
 * and the Nib. Colors are fixed (not from the theme) so a Santa hat stays red.
 */
import type { Graphics } from 'pixi.js';
import type { SeasonId } from '../core/seasons';
import type { Target } from '../core/world';
import type { Variant } from './creatures/common';

export const HOLIDAY = {
  santaRed: 0xc62f2f,
  trim: 0xfbf8f1,
  pilgrim: 0x2f2a28,
  pilgrimBand: 0x5b4636,
  buckle: 0xd9b23a,
  holly: 0x2f7a43,
  hollyDark: 0x225c33,
  berry: 0xc62f2f,
  antler: 0x9a6a3f,
  snow: 0x9fbcd6,
  /** Autumn leaves: orange, rust, gold and brown. */
  leaves: [0xd9762b, 0xb4472d, 0xe0a72e, 0x9a6234] as const,
  feathers: [0xb4472d, 0xd9762b, 0xe0a72e, 0x9a6234, 0xd9762b] as const,
};

/** Points along a pointed leaf shape from its base, `len` long and `width` wide, pointing at `angle`. */
function bladePoints(x: number, y: number, len: number, width: number, angle: number, steps = 10): number[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const pts: number[] = [];
  const at = (along: number, across: number) => pts.push(x + along * cos - across * sin, y + along * sin + across * cos);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    at(u * len, Math.sin(u * Math.PI) * width * 0.5);
  }
  for (let i = steps - 1; i > 0; i--) {
    const u = i / steps;
    at(u * len, -Math.sin(u * Math.PI) * width * 0.5);
  }
  return pts;
}

/** An autumn leaf: a three-lobed maple shape with a stem, centered on (x, y). */
export function drawLeaf(g: Graphics, x: number, y: number, size: number, color: number, angle = 0, alpha = 1): void {
  const up = angle - Math.PI / 2;
  for (const [turn, len] of [
    [0, 1],
    [-0.9, 0.78],
    [0.9, 0.78],
    [-1.8, 0.5],
    [1.8, 0.5],
  ] as const) {
    g.poly(bladePoints(x, y, size * len, size * 0.62 * len, up + turn)).fill({ color, alpha });
  }
  const sx = x - Math.cos(up) * size * 0.45;
  const sy = y - Math.sin(up) * size * 0.45;
  g.moveTo(x, y).lineTo(sx, sy).stroke({ width: Math.max(1, size * 0.08), color, alpha, cap: 'round' });
  // Veins, lighter, so the leaf reads as a leaf even when small.
  g.moveTo(x, y)
    .lineTo(x + Math.cos(up) * size * 0.8, y + Math.sin(up) * size * 0.8)
    .stroke({ width: Math.max(0.6, size * 0.05), color: 0xfff3d6, alpha: alpha * 0.45 });
}

/** A holly sprig: two spiky leaves and three berries at (x, y). */
export function drawHolly(g: Graphics, x: number, y: number, size: number, angle = 0, alpha = 1): void {
  for (const side of [-1, 1]) {
    const dir = side > 0 ? angle + 0.5 : angle + Math.PI - 0.5;
    const len = size * 1.25;
    // Spiky edges: a blade with notches pushed in.
    const pts = bladePoints(x, y, len, size * 0.62, dir, 12);
    for (let i = 2; i < pts.length; i += 4) {
      pts[i] = x + (pts[i]! - x) * 0.88;
      pts[i + 1] = y + (pts[i + 1]! - y) * 0.88;
    }
    g.poly(pts).fill({ color: side > 0 ? HOLIDAY.holly : HOLIDAY.hollyDark, alpha });
  }
  const r = size * 0.24;
  for (const [dx, dy] of [
    [-r * 0.9, -r * 0.4],
    [r * 0.9, -r * 0.4],
    [0, r * 0.7],
  ] as const) {
    g.circle(x + dx, y + dy, r).fill({ color: HOLIDAY.berry, alpha });
  }
  g.circle(x - r * 1.1, y - r * 0.7, r * 0.3).fill({ color: 0xffffff, alpha: alpha * 0.6 });
}

/** A Santa hat sitting on (cx, baseY), `w` wide at the band, flopping to the right. */
export function drawSantaHat(g: Graphics, cx: number, baseY: number, w: number): void {
  const h = w * 0.95;
  g.moveTo(cx - w / 2, baseY)
    .quadraticCurveTo(cx - w * 0.2, baseY - h * 1.05, cx + w * 0.35, baseY - h * 0.95)
    .quadraticCurveTo(cx + w * 0.75, baseY - h * 0.85, cx + w * 0.85, baseY - h * 0.45)
    .quadraticCurveTo(cx + w * 0.45, baseY - h * 0.55, cx + w / 2, baseY)
    .closePath()
    .fill(HOLIDAY.santaRed);
  g.roundRect(cx - w * 0.58, baseY - w * 0.12, w * 1.16, w * 0.3, w * 0.15).fill(HOLIDAY.trim);
  g.circle(cx + w * 0.86, baseY - h * 0.42, w * 0.17).fill(HOLIDAY.trim);
}

/** A pilgrim hat sitting on (cx, baseY), `w` wide at the brim. */
export function drawPilgrimHat(g: Graphics, cx: number, baseY: number, w: number): void {
  const h = w * 0.72;
  g.ellipse(cx, baseY, w / 2, w * 0.1).fill(HOLIDAY.pilgrim);
  g.poly([cx - w * 0.3, baseY, cx - w * 0.25, baseY - h, cx + w * 0.25, baseY - h, cx + w * 0.3, baseY]).fill(HOLIDAY.pilgrim);
  g.rect(cx - w * 0.29, baseY - h * 0.36, w * 0.58, h * 0.2).fill(HOLIDAY.pilgrimBand);
  const b = w * 0.16;
  g.rect(cx - b / 2, baseY - h * 0.4, b, h * 0.28).stroke({ width: Math.max(1.2, w * 0.05), color: HOLIDAY.buckle });
  // A faint rim light so a dark hat still reads on a dark ink body.
  g.moveTo(cx - w * 0.25, baseY - h).lineTo(cx + w * 0.25, baseY - h).stroke({ width: Math.max(1, w * 0.04), color: 0xfff3d6, alpha: 0.35 });
}

/** Reindeer antlers growing up from either side of (cx, baseY). */
export function drawAntlers(g: Graphics, cx: number, baseY: number, size: number): void {
  const width = Math.max(1.5, size * 0.16);
  for (const side of [-1, 1]) {
    const x0 = cx + side * size * 0.45;
    const x1 = cx + side * size * 0.95;
    const y1 = baseY - size * 1.2;
    g.moveTo(x0, baseY).quadraticCurveTo(x0 + side * size * 0.05, baseY - size * 0.8, x1, y1);
    g.moveTo(x0 + side * size * 0.12, baseY - size * 0.55).lineTo(x0 + side * size * 0.6, baseY - size * 0.75);
    g.moveTo(x0 + side * size * 0.2, baseY - size * 0.9).lineTo(x0 - side * size * 0.05, baseY - size * 1.25);
    g.stroke({ width, color: HOLIDAY.antler, cap: 'round' });
  }
}

/** A turkey's tail: a fan of feathers spreading up and back from (x, y). */
export function drawTurkeyTail(g: Graphics, x: number, y: number, size: number): void {
  const n = HOLIDAY.feathers.length;
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i - (n - 1) / 2) * 0.38 + 0.35;
    g.poly(bladePoints(x, y, size, size * 0.42, angle)).fill(HOLIDAY.feathers[i]!);
    // A pale tip band on each feather.
    const tx = x + Math.cos(angle) * size * 0.78;
    const ty = y + Math.sin(angle) * size * 0.78;
    g.circle(tx, ty, size * 0.08).fill({ color: 0xfff3d6, alpha: 0.7 });
  }
}

/** A six-armed snowflake at (x, y). */
export function drawSnowflake(g: Graphics, x: number, y: number, r: number, color: number = HOLIDAY.snow, alpha = 1): void {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const ex = x + Math.cos(a) * r;
    const ey = y + Math.sin(a) * r;
    g.moveTo(x, y).lineTo(ex, ey);
    const mx = x + Math.cos(a) * r * 0.55;
    const my = y + Math.sin(a) * r * 0.55;
    for (const side of [-1, 1]) {
      g.moveTo(mx, my).lineTo(mx + Math.cos(a + side * 0.8) * r * 0.32, my + Math.sin(a + side * 0.8) * r * 0.32);
    }
  }
  g.stroke({ width: Math.max(1, r * 0.16), color, alpha, cap: 'round' });
}

/** What a creature wears for the season. */
export type Accessory = 'pilgrimHat' | 'turkeyTail' | 'leaf' | 'santaHat' | 'antlers' | 'holly';

/**
 * Pick a creature's accessory from its id, so it never changes mid-page.
 * Violet creatures keep their crown and get a sprig on it; crimson ones keep
 * their horns.
 */
export function accessoryFor(season: SeasonId | null | undefined, target: Pick<Target, 'id' | 'kind'>, variant: Variant): Accessory | null {
  if (!season) return null;
  const even = Math.abs(target.id) % 2 === 0;
  if (season === 'thanksgiving') {
    if (variant === 'violet') return 'leaf';
    if (target.kind === 'drip') return 'leaf';
    if (variant === 'crimson' || target.kind === 'runon') return variant === 'crimson' ? 'turkeyTail' : 'pilgrimHat';
    return even ? 'pilgrimHat' : 'turkeyTail';
  }
  if (variant === 'violet') return 'holly';
  if (target.kind === 'drip') return variant === 'plain' ? 'santaHat' : 'holly';
  if (variant === 'crimson' || target.kind === 'runon') return 'santaHat';
  return even ? 'santaHat' : 'antlers';
}

/** Draw a head accessory sitting on (cx, topY), sized to `size` (about an eye's width × 2). */
export function drawHeadAccessory(g: Graphics, accessory: Accessory, cx: number, topY: number, size: number, leafColor: number = HOLIDAY.leaves[0]): void {
  switch (accessory) {
    case 'pilgrimHat':
      drawPilgrimHat(g, cx, topY, size * 1.5);
      break;
    case 'santaHat':
      drawSantaHat(g, cx, topY, size * 1.5);
      break;
    case 'antlers':
      drawAntlers(g, cx, topY + size * 0.15, size * 0.9);
      break;
    case 'leaf':
      drawLeaf(g, cx + size * 0.3, topY - size * 0.45, size * 0.95, leafColor, 0.4);
      break;
    case 'holly':
      drawHolly(g, cx + size * 0.2, topY - size * 0.25, size * 0.7, -0.5);
      break;
    case 'turkeyTail':
      // Drawn at the back by the creature itself.
      break;
  }
}

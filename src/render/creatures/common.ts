/**
 * Shared pieces for the ink creatures (DESIGN §5): faces, moods, variant
 * colors and life pips. Everything is drawn procedurally in PixiJS.
 */
import { BlurFilter, CanvasTextMetrics, type Container, type Graphics, type Text, type TextStyle } from 'pixi.js';
import { MARGIN_X, isRevealed, revealXOf, type Target } from '../../core/world';
import { COLORS, TEXT_FONT } from '../theme';
import { GAME_CONFIG } from '../../core/config';

/** Per-frame information every creature needs. */
export interface FrameContext {
  timeMs: number;
  dtMs: number;
  /** The player is typing at this creature. */
  locked: boolean;
  /** Where the Nib is, relative to the creature's origin, for eyes to look at. */
  lookX: number;
  lookY: number;
  reducedMotion: boolean;
  /**
   * Finished: the last key was typed and the final drop of ink is on its way.
   * The creature shows it's beaten (x x eyes) until the ink lands.
   */
  defeated?: boolean;
  /** The player just mistyped at this creature: it grins for a moment. */
  taunting?: boolean;
  /** It can't be typed yet (a Squid's body behind its bubble): its word is drawn faded. */
  guarded?: boolean;
  /** About to do its boss move (a Squid tentacle about to squirt): it swells and flashes red pen. */
  warning?: boolean;
}

export interface CreatureView {
  root: Container;
  /** Drawn behind the body while the creature is locked. */
  highlight: Graphics;
  /** Body size, for centering effects on it. */
  width: number;
  height: number;
  update(target: Target, ctx: FrameContext): void;
  /**
   * Horizontal center of the letter at `index` in the text currently shown,
   * relative to the creature's origin (-1 = the last letter). Ink shots aim here.
   */
  letterX(index: number): number;
}

/** Center of character `index` (-1 = last) in `text` drawn from x = `left`. */
export function letterCenter(text: string, index: number, left: number, style: TextStyle): number {
  const chars = [...text];
  if (chars.length === 0) return left;
  const i = index < 0 || index >= chars.length ? chars.length - 1 : index;
  const before = chars.slice(0, i).join('');
  return left + measure(before, style) + measure(chars[i]!, style) / 2;
}

export type Mood = 'calm' | 'worried' | 'scared' | 'happy' | 'hurt' | 'angry' | 'defeated';

const isCapital = (ch: string) => /\p{Lu}/u.test(ch);

export const measure = (text: string, style: TextStyle) => CanvasTextMetrics.measureText(text, style).width;

/**
 * Where each capital letter in `text` sits, drawn from x = `left`, given each
 * character's width. Lowercase, digits and symbols are skipped.
 */
export function capitalSpans(text: string, left: number, widthOf: (ch: string) => number): { x: number; width: number }[] {
  const spans: { x: number; width: number }[] = [];
  let x = left;
  for (const ch of text) {
    const width = widthOf(ch);
    if (isCapital(ch)) spans.push({ x, width });
    x += width;
  }
  return spans;
}

/**
 * A short bar under each capital in `text` (drawn from x = `left`, vertically
 * centred on 0), so capitals can't be mistaken for lowercase (c/C, s/S, o/O…).
 */
export function drawCapTicks(g: Graphics, text: string, left: number, style: TextStyle, color: number): void {
  const size = Number(style.fontSize);
  const c = GAME_CONFIG.capitalTick;
  for (const { x, width } of capitalSpans(text, left, (ch) => measure(ch, style))) {
    const bar = Math.max(c.minWidthPx, width * c.widthShare);
    g.roundRect(x + (width - bar) / 2, size * c.offset, bar, Math.max(2, size * c.thickness), size * c.thickness / 2).fill(color);
  }
}

/** Extra space between letters on word creatures, as a fraction of the font size, for easier reading. */
export const WORD_LETTER_SPACING = 0.08;

export function labelStyle(fill: number, fontSize: number, letterSpacing = 0) {
  return { fontFamily: TEXT_FONT, fontSize, fontWeight: '600' as const, fill, letterSpacing: fontSize * letterSpacing };
}

/** Body color for a creature's remaining lives: violet (3), crimson (2), ink (1). */
export function bodyColor(lives: number): number {
  return lives >= 3 ? COLORS.inkViolet : lives === 2 ? COLORS.inkCrimson : COLORS.ink;
}

/**
 * Each variant has its own look, so lives never show by color alone:
 * plain ink is a soft blob, crimson is spiky with horns and a scowl, and
 * violet is lumpy, with a crown of drips, a third eye and a wavy hem.
 */
export type Variant = 'plain' | 'crimson' | 'violet';

export function variantOf(lives: number): Variant {
  return lives >= 3 ? 'violet' : lives === 2 ? 'crimson' : 'plain';
}

/** Two little curved horns either side of (cx, baseY), pointing up and out. */
export function drawHorns(g: Graphics, cx: number, baseY: number, spread: number, size: number, color: number): void {
  for (const side of [-1, 1]) {
    const x = cx + side * spread;
    g.moveTo(x - size * 0.45, baseY)
      .quadraticCurveTo(x + side * size * 0.1, baseY - size * 0.6, x + side * size * 0.55, baseY - size * 1.1)
      .quadraticCurveTo(x + side * size * 0.15, baseY - size * 0.35, x + size * 0.45, baseY)
      .closePath()
      .fill(color);
  }
}

/** A crown of three ink drips pointing up from (cx, baseY). */
export function drawCrown(g: Graphics, cx: number, baseY: number, width: number, color: number): void {
  const h = width * 0.55;
  g.moveTo(cx - width / 2, baseY)
    .lineTo(cx - width / 2, baseY - h * 0.55)
    .lineTo(cx - width / 4, baseY - h * 0.25)
    .lineTo(cx, baseY - h)
    .lineTo(cx + width / 4, baseY - h * 0.25)
    .lineTo(cx + width / 2, baseY - h * 0.55)
    .lineTo(cx + width / 2, baseY)
    .closePath()
    .fill(color);
  for (const [x, y] of [
    [cx - width / 2, baseY - h * 0.55],
    [cx, baseY - h],
    [cx + width / 2, baseY - h * 0.55],
  ] as const) {
    g.circle(x, y, width * 0.09).fill(color);
  }
}

/** Triangular spikes along a horizontal edge at `y`, pointing up (dir -1) or down (dir 1). */
export function drawSpikes(g: Graphics, x0: number, x1: number, y: number, count: number, size: number, dir: -1 | 1, color: number): void {
  const step = (x1 - x0) / count;
  for (let i = 0; i < count; i++) {
    const x = x0 + step * i;
    g.poly([x, y, x + step / 2, y + dir * size, x + step, y]).fill(color);
  }
}

/** A wavy, tentacled hem along the bottom edge at `y`, swaying with time. */
export function drawHem(g: Graphics, x0: number, x1: number, y: number, size: number, color: number, sway: number): void {
  const count = Math.max(3, Math.round((x1 - x0) / (size * 1.6)));
  const step = (x1 - x0) / count;
  for (let i = 0; i < count; i++) {
    const x = x0 + step * (i + 0.5);
    const wiggle = sway * size * 0.3 * (i % 2 === 0 ? 1 : -1);
    g.ellipse(x + wiggle, y + size * 0.35, step * 0.42, size * 0.75).fill(color);
  }
}

/**
 * Tracks what a creature is feeling: happy for a moment after a correct key,
 * hurt after losing a life, scared while locked, worried near the margin.
 * Also handles blinking.
 */
export class MoodTracker {
  private lastTyped = 0;
  private lastLives = 0;
  private lastText = '';
  private happyUntil = 0;
  private hurtUntil = 0;
  private nextBlink = 1500 + Math.random() * 3000;
  private blinkUntil = 0;

  update(target: Target, ctx: FrameContext): { mood: Mood; blink: boolean } {
    const t = ctx.timeMs;
    if (ctx.defeated) return { mood: 'defeated', blink: false };
    if (this.lastLives && target.lives < this.lastLives) this.hurtUntil = t + 350;
    else if (target.typed > this.lastTyped || (target.text !== this.lastText && this.lastText && target.lives === this.lastLives))
      this.happyUntil = t + 180;
    this.lastTyped = target.typed;
    this.lastLives = target.lives;
    this.lastText = target.text;

    if (t > this.nextBlink) {
      this.blinkUntil = t + 130;
      this.nextBlink = t + 2500 + Math.random() * 3500;
    }

    const mood: Mood =
      t < this.hurtUntil
        ? 'hurt'
        : t < this.happyUntil || ctx.taunting
          ? 'happy'
          : ctx.locked
            ? 'scared'
            : target.boss || target.lives >= 2
              ? 'angry'
              : target.x < MARGIN_X + 240
                ? 'worried'
                : 'calm';
    return { mood, blink: t < this.blinkUntil && mood !== 'hurt' };
  }
}

/**
 * Two eyes (and optionally a mouth) at (cx, cy). `r` is the eye radius.
 * Pupils look toward (lookX, lookY). Eye marks are drawn in the label color so
 * they stand out on any body color; open eyes use the theme's eye white, with
 * pupils in `pupil` unless the theme sets its own (night mode).
 */
export function drawFace(
  g: Graphics,
  cx: number,
  cy: number,
  r: number,
  mood: Mood,
  blink: boolean,
  lookX: number,
  lookY: number,
  pupil: number,
  mouth: { x: number; y: number } | null = null,
  /** Violet creatures have a third eye in the middle. */
  eyes: 2 | 3 = 2,
): void {
  const white = COLORS.label;
  const gap = r * 1.25;
  const len = Math.hypot(lookX - cx, lookY - cy) || 1;
  const dx = ((lookX - cx) / len) * r * 0.38;
  const dy = ((lookY - cy) / len) * r * 0.38;

  for (const offset of eyes === 3 ? [-2, 0, 2] : [-1, 1]) {
    const ex = cx + offset * gap;
    // Which way brows and > < marks slant (the middle eye leans like the right one).
    const side = Math.sign(offset) || 1;
    if (mood === 'defeated') {
      // x x
      const k = r * 0.65;
      g.moveTo(ex - k, cy - k)
        .lineTo(ex + k, cy + k)
        .moveTo(ex + k, cy - k)
        .lineTo(ex - k, cy + k)
        .stroke({ width: Math.max(1.5, r * 0.34), color: white, cap: 'round' });
    } else if (mood === 'happy') {
      // ^ ^
      g.moveTo(ex - r * 0.8, cy + r * 0.3)
        .lineTo(ex, cy - r * 0.5)
        .lineTo(ex + r * 0.8, cy + r * 0.3)
        .stroke({ width: Math.max(1.5, r * 0.35), color: white, cap: 'round', join: 'round' });
    } else if (mood === 'hurt') {
      // > <
      const s = side;
      g.moveTo(ex - s * r * 0.7, cy - r * 0.6)
        .lineTo(ex + s * r * 0.4, cy)
        .lineTo(ex - s * r * 0.7, cy + r * 0.6)
        .stroke({ width: Math.max(1.5, r * 0.32), color: white, cap: 'round', join: 'round' });
    } else if (blink) {
      g.moveTo(ex - r * 0.8, cy).lineTo(ex + r * 0.8, cy).stroke({ width: Math.max(1.5, r * 0.3), color: white, cap: 'round' });
    } else {
      const scared = mood === 'scared';
      const eyeR = r * (scared ? 1.15 : 1);
      g.circle(ex, cy, eyeR).fill(COLORS.eyeWhite);
      if (COLORS.eyeRing !== null) g.circle(ex, cy, eyeR).stroke({ width: Math.max(1, r * 0.2), color: COLORS.eyeRing });
      g.circle(ex + dx, cy + dy, r * (scared ? 0.32 : 0.55)).fill(COLORS.eyePupil ?? pupil);
      if (mood === 'angry') {
        // Brows slanting down toward the middle.
        g.moveTo(ex - side * r * 1.1, cy - r * 1.5)
          .lineTo(ex + side * r * 0.4, cy - r * 1.05)
          .stroke({ width: Math.max(1.5, r * 0.3), color: white, cap: 'round' });
      }
      if (mood === 'worried') {
        // Brows tilted up toward the middle.
        g.moveTo(ex - side * r * 0.9, cy - r * 1.25)
          .lineTo(ex + side * r * 0.5, cy - r * 1.7)
          .stroke({ width: Math.max(1.2, r * 0.25), color: white, cap: 'round' });
      }
    }
  }

  if (!mouth) return;
  const { x, y } = mouth;
  const w = r * 0.9;
  switch (mood) {
    case 'happy':
      g.moveTo(x - w, y).quadraticCurveTo(x, y + w * 1.2, x + w, y).stroke({ width: Math.max(1.4, r * 0.28), color: white, cap: 'round' });
      break;
    case 'scared':
      g.circle(x, y + w * 0.2, w * 0.45).fill(white);
      break;
    case 'defeated':
      // A dazed wavy line.
      g.moveTo(x - w, y + w * 0.2)
        .quadraticCurveTo(x - w * 0.5, y - w * 0.3, x, y + w * 0.2)
        .quadraticCurveTo(x + w * 0.5, y + w * 0.7, x + w, y + w * 0.2)
        .stroke({ width: Math.max(1.2, r * 0.24), color: white, cap: 'round' });
      break;
    case 'worried':
    case 'hurt':
    case 'angry':
      g.moveTo(x - w, y + w * 0.3)
        .quadraticCurveTo(x - w * 0.5, y - w * 0.2, x, y + w * 0.3)
        .quadraticCurveTo(x + w * 0.5, y + w * 0.8, x + w, y + w * 0.3)
        .stroke({ width: Math.max(1.2, r * 0.24), color: white, cap: 'round' });
      break;
    default:
      g.moveTo(x - w * 0.7, y).quadraticCurveTo(x, y + w * 0.6, x + w * 0.7, y).stroke({ width: Math.max(1.2, r * 0.24), color: white, cap: 'round' });
  }
}

/**
 * Lives still to go, as small dots in the creature's color: a shape cue, so
 * crimson and violet don't rely on color alone (DESIGN §7).
 */
export function drawPips(g: Graphics, x: number, y: number, lives: number, scale: number): void {
  if (lives <= 1) return;
  const r = 4.5 * scale;
  for (let i = 0; i < lives; i++) {
    g.circle(x + i * r * 2.6, y, r).fill(bodyColor(lives)).stroke({ width: 1.5, color: COLORS.paper });
  }
}

const ghostBlur = () => new BlurFilter({ strength: 7, quality: 2 });

/**
 * Invisible ink: until the creature reaches its reveal point, its text is blurred and
 * the body is faint. Returns true while hidden.
 */
export function applyGhost(target: Target, root: Container, labels: Text[], timeMs: number, reducedMotion: boolean): boolean {
  const hidden = !isRevealed(target);
  if (!target.ghost) return false;
  if (hidden) {
    root.alpha = reducedMotion ? 0.45 : 0.35 + 0.12 * Math.sin(timeMs / 260);
    for (const label of labels) if (!label.filters || (label.filters as unknown[]).length === 0) label.filters = [ghostBlur()];
  } else {
    // Fade in over the first stretch after the reveal line.
    const since = Math.max(0, revealXOf(target) - target.x);
    root.alpha = Math.min(1, 0.45 + since / 120);
    for (const label of labels) if (label.filters) label.filters = [];
  }
  return hidden;
}

/** Gentle oscillation helper that respects reduced motion. */
export function wave(ctx: FrameContext, speed: number, phase = 0): number {
  return ctx.reducedMotion ? 0 : Math.sin(ctx.timeMs * speed + phase);
}

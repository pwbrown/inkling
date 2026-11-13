/**
 * Shared pieces for the ink creatures (DESIGN §5): faces, moods, variant
 * colors and life pips. Everything is drawn procedurally in PixiJS.
 */
import { BlurFilter, CanvasTextMetrics, type Container, type Graphics, type Text, type TextStyle } from 'pixi.js';
import { GHOST_REVEAL_X, MARGIN_X, isRevealed, type Target } from '../../core/world';
import { COLORS, TEXT_FONT } from '../theme';

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
}

export interface CreatureView {
  root: Container;
  /** Drawn behind the body while the creature is locked. */
  highlight: Graphics;
  /** Body size, for centering effects on it. */
  width: number;
  height: number;
  update(target: Target, ctx: FrameContext): void;
}

export type Mood = 'calm' | 'worried' | 'scared' | 'happy' | 'hurt' | 'angry';

export const measure = (text: string, style: TextStyle) => CanvasTextMetrics.measureText(text, style).width;

export function labelStyle(fill: number, fontSize: number) {
  return { fontFamily: TEXT_FONT, fontSize, fontWeight: '600' as const, fill };
}

/** Body color for a creature's remaining lives: violet (3), crimson (2), ink (1). */
export function bodyColor(lives: number): number {
  return lives >= 3 ? COLORS.inkViolet : lives === 2 ? COLORS.inkCrimson : COLORS.ink;
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

  update(target: Target, ctx: FrameContext): { mood: Mood; blink: boolean; hurtMs: number } {
    const t = ctx.timeMs;
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
        : t < this.happyUntil
          ? 'happy'
          : ctx.locked
            ? 'scared'
            : target.boss
              ? 'angry'
              : target.x < MARGIN_X + 240
                ? 'worried'
                : 'calm';
    return { mood, blink: t < this.blinkUntil && mood !== 'hurt', hurtMs: Math.max(0, this.hurtUntil - t) };
  }
}

/**
 * Two eyes (and optionally a mouth) at (cx, cy). `r` is the eye radius.
 * Pupils look toward (lookX, lookY). Eyes are drawn in the label color so
 * they stand out on any body color, with pupils in `pupil`.
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
): void {
  const white = COLORS.label;
  const gap = r * 1.25;
  const len = Math.hypot(lookX - cx, lookY - cy) || 1;
  const dx = ((lookX - cx) / len) * r * 0.38;
  const dy = ((lookY - cy) / len) * r * 0.38;

  for (const side of [-1, 1]) {
    const ex = cx + side * gap;
    if (mood === 'happy') {
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
      g.circle(ex, cy, r * (scared ? 1.15 : 1)).fill(white);
      g.circle(ex + dx, cy + dy, r * (scared ? 0.32 : 0.55)).fill(pupil);
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
 * Invisible ink: until the creature reaches halfway, its text is blurred and
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
    const since = Math.max(0, GHOST_REVEAL_X - target.x);
    root.alpha = Math.min(1, 0.45 + since / 120);
    for (const label of labels) if (label.filters) label.filters = [];
  }
  return hidden;
}

/** Gentle oscillation helper that respects reduced motion. */
export function wave(ctx: FrameContext, speed: number, phase = 0): number {
  return ctx.reducedMotion ? 0 : Math.sin(ctx.timeMs * speed + phase);
}

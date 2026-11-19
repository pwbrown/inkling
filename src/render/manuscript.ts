/**
 * The manuscript: faint, illegible handwriting that fills the page's lines as
 * the player clears targets, so the last stroke lands with the last target.
 * It's scribbles, not words, so it never competes with text the player reads.
 *
 * `buildManuscript` and `revealWords` are pure (and tested); `Manuscript`
 * draws them.
 */
import { Container, Graphics } from 'pixi.js';
import { GAME_CONFIG } from '../core/config';
import { seeded } from '../core/rng';
import { MARGIN_X, WORLD_WIDTH } from '../core/world';
import { COLORS } from './theme';

/** One scribbled word: a polyline, flat [x0, y0, x1, y1, ...], and its length. */
export interface ScribbleWord {
  points: number[];
  length: number;
  /** Which line (index into the layout's baselines) it's on. */
  line: number;
}

export interface ManuscriptLayout {
  /** Baselines to write on, top to bottom. */
  baselines: readonly number[];
  left?: number;
  right?: number;
}

const between = (random: () => number, [lo, hi]: readonly number[]) => (lo ?? 0) + random() * ((hi ?? 0) - (lo ?? 0));

function polylineLength(points: readonly number[]): number {
  let length = 0;
  for (let i = 2; i < points.length; i += 2) length += Math.hypot(points[i]! - points[i - 2]!, points[i + 1]! - points[i - 1]!);
  return length;
}

/** One cursive-looking word starting at `x` on `baseline`; returns the word and where it ends. */
function scribbleWord(random: () => number, x: number, baseline: number, maxX: number, line: number): { word: ScribbleWord; end: number } | null {
  const c = GAME_CONFIG.manuscript;
  const letters = Math.round(between(random, c.wordLetters));
  const top = baseline - 2;
  const points: number[] = [x, top];
  let cursor = x;
  for (let i = 0; i < letters; i++) {
    const width = between(random, c.letterWidth);
    if (cursor + width > maxX) break;
    const roll = random();
    const tall = roll < c.ascenderChance;
    const below = roll > 1 - c.descenderChance;
    const loop = tall || below || random() < c.loopChance;
    // Up from the line (or down, for a descender), joined at the baseline like cursive.
    const height = tall ? c.ascender : below ? -c.descender : c.xHeight * (0.8 + random() * 0.35);
    // A stretched cycloid: when the bulge outgrows the step, the stroke runs back at its peak, making a loop.
    const r = width / (2 * Math.PI);
    const bulge = loop ? r + Math.abs(height) * between(random, c.loopWidth) : r * between(random, c.humpCurl);
    for (let s = 1; s <= c.letterSteps; s++) {
      const a = (s / c.letterSteps) * 2 * Math.PI;
      const rise = (height * (1 - Math.cos(a))) / 2;
      points.push(cursor + r * a + bulge * Math.sin(a) + rise * c.slant, top - rise);
    }
    cursor += width;
  }
  if (points.length < 6) return null;
  return { word: { points, length: polylineLength(points), line }, end: cursor };
}

/** Lay out a page of scribbles, the same every time for the same seed. */
export function buildManuscript(seed: number, layout: ManuscriptLayout): ScribbleWord[] {
  const c = GAME_CONFIG.manuscript;
  const random = seeded(seed, 'manuscript');
  const left = layout.left ?? MARGIN_X + c.insetLeft;
  const right = layout.right ?? WORLD_WIDTH - c.insetRight;
  const words: ScribbleWord[] = [];
  layout.baselines.forEach((baseline, line) => {
    const last = line === layout.baselines.length - 1;
    const end = last ? left + (right - left) * between(random, c.lastLine) : right;
    let x = left + (line === 0 ? c.indent : 0);
    for (;;) {
      const made = scribbleWord(random, x, baseline, end, line);
      if (!made) break;
      words.push(made.word);
      x = made.end + between(random, c.wordGap);
    }
  });
  return words;
}

/** Total length of all the words. */
export function totalLength(words: readonly ScribbleWord[]): number {
  return words.reduce((sum, word) => sum + word.length, 0);
}

/** The words visible at `fraction` (0..1) of the way through, the last one cut short. */
export function revealWords(words: readonly ScribbleWord[], fraction: number): ScribbleWord[] {
  let budget = Math.max(0, Math.min(1, fraction)) * totalLength(words);
  const out: ScribbleWord[] = [];
  for (const word of words) {
    if (budget <= 0) break;
    if (word.length <= budget) {
      out.push(word);
      budget -= word.length;
      continue;
    }
    // Cut the word part-way along.
    const points = [word.points[0]!, word.points[1]!];
    let left = budget;
    for (let i = 2; i < word.points.length && left > 0; i += 2) {
      const x0 = word.points[i - 2]!;
      const y0 = word.points[i - 1]!;
      const seg = Math.hypot(word.points[i]! - x0, word.points[i + 1]! - y0);
      const k = Math.min(1, left / seg);
      points.push(x0 + (word.points[i]! - x0) * k, y0 + (word.points[i + 1]! - y0) * k);
      left -= seg;
    }
    out.push({ points, length: budget, line: word.line });
    break;
  }
  return out;
}

/** Where to drop a blot on line `line`: somewhere in what's written there, or near its start if nothing is. */
export function blotSpot(visible: readonly ScribbleWord[], line: number, left: number, random: () => number): number {
  const onLine = visible.filter((word) => word.line === line);
  if (onLine.length === 0) return left + random() * GAME_CONFIG.manuscript.blotNoWriting;
  let lo = Infinity;
  let hi = -Infinity;
  for (const word of onLine) {
    for (let i = 0; i < word.points.length; i += 2) {
      lo = Math.min(lo, word.points[i]!);
      hi = Math.max(hi, word.points[i]!);
    }
  }
  return lo + random() * (hi - lo);
}

/** Draws a page's manuscript, eases its reveal toward the player's progress, and takes blots. */
export class Manuscript {
  readonly root = new Container();
  private readonly writing = new Graphics();
  private readonly blots = new Graphics();
  private words: ScribbleWord[] = [];
  private baselines: readonly number[] = [];
  private shown = 0;
  private drawn = -1;

  constructor() {
    this.root.addChild(this.writing, this.blots);
  }

  /** Start a new page's writing, with no blots. */
  reset(seed: number, baselines: readonly number[], fraction = 0): void {
    this.baselines = baselines;
    this.words = buildManuscript(seed, { baselines });
    this.shown = fraction;
    this.drawn = -1;
    this.blots.clear();
  }

  /** A creature got through on the line at `y`: spoil the writing there with a blot. */
  blot(y: number, random: () => number = Math.random): void {
    const c = GAME_CONFIG.manuscript;
    let line = 0;
    this.baselines.forEach((b, i) => {
      if (Math.abs(b - y) < Math.abs((this.baselines[line] ?? 0) - y)) line = i;
    });
    const baseline = this.baselines[line] ?? y;
    const x = blotSpot(revealWords(this.words, this.shown), line, MARGIN_X + c.insetLeft, random);
    const cy = baseline - c.xHeight / 2;
    const r = c.blotRadius[0]! + random() * (c.blotRadius[1]! - c.blotRadius[0]!);
    // A lumpy circle, with a few drops flung off it.
    const bumps = 9;
    const points: number[] = [];
    for (let i = 0; i < bumps; i++) {
      const a = (i / bumps) * Math.PI * 2;
      const k = 0.75 + random() * 0.45;
      points.push(x + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * 0.85);
    }
    const fill = { color: COLORS.ink, alpha: c.blotAlpha };
    this.blots.poly(points).fill(fill);
    for (let i = 0; i < 3; i++) {
      const a = random() * Math.PI * 2;
      const d = r * (1.4 + random() * 0.8);
      this.blots.circle(x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, 1.2 + random() * 2).fill(fill);
    }
  }

  /** Move toward `target` (0..1); jumps straight there with reduced motion. */
  update(target: number, frameMs: number, reducedMotion: boolean): void {
    const rate = GAME_CONFIG.manuscript.revealRate;
    this.shown = reducedMotion ? target : this.shown + (target - this.shown) * Math.min(1, (rate * frameMs) / 1000);
    if (Math.abs(this.shown - target) < 0.0005) this.shown = target;
    // Redraw only when the visible length changes by a pixel or so.
    const length = Math.round(this.shown * totalLength(this.words));
    if (length === this.drawn) return;
    this.drawn = length;
    const c = GAME_CONFIG.manuscript;
    const g = this.writing.clear();
    for (const word of revealWords(this.words, this.shown)) {
      g.moveTo(word.points[0]!, word.points[1]!);
      for (let i = 2; i < word.points.length; i += 2) g.lineTo(word.points[i]!, word.points[i + 1]!);
    }
    g.stroke({ width: c.strokeWidth, color: COLORS.ink, alpha: c.alpha, cap: 'round', join: 'round' });
  }
}

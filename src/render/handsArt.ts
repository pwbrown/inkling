/**
 * "Where do my fingers go?": a top-down picture of two hands resting on the
 * home row of a typewriter keyboard. The hands never move. The finger for
 * each new key is shaded in highlighter, the key itself is shaded and
 * circled in red pen, and a dashed red-pen arrow runs from the fingertip to
 * the key when it isn't the one already under that finger.
 *
 * Pure string building (no DOM, no PixiJS), so the Type Case can inline it
 * and the in-game chapter card can draw it as an image. Colors are passed in:
 * CSS variables for the DOM, hex strings for the canvas.
 */
import type { Finger, KeyboardLayout, LayoutKey } from '../content/layouts/types';
import { FINGERS, NAILS, OUTLINE, ROTATE, SKIN, TIPS } from './handDrawing';

export interface HandsColors {
  /** Outlines and key caps. */
  ink: string;
  /** Key labels and fingernails. */
  paper: string;
  /** The hands: a pale ink wash. */
  hand: string;
  /** The finger to use, and the key it presses. */
  highlight: string;
  /** Red pen: ring around the key and the arrow to it. */
  margin: string;
  /** Chrome rim of each typewriter key. */
  rim: string;
}

export interface HandsArt {
  svg: string;
  /** Size in SVG units; the picture keeps this aspect ratio. */
  width: number;
  height: number;
}

type Side = 'left' | 'right';
type Digit = Exclude<Finger, 'thumb'>;

interface Point {
  x: number;
  y: number;
}

/** One key pitch in SVG units. */
const U = 40;
/** How far each row is shifted right, in key pitches (like a real keyboard's stagger). */
const ROW_OFFSET = [0, 0.5, 0.75, 1.25];
const DIGITS: Digit[] = ['pinky', 'ring', 'middle', 'index'];

const r1 = (n: number) => Math.round(n * 10) / 10;
const add = (a: Point, b: Point, k = 1): Point => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const unit = (v: Point): Point => {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
};
const normal = (d: Point): Point => ({ x: -d.y, y: d.x });
/** A point in key pitches, as SVG coordinates. */
const pt = (p: Point) => `${r1(p.x * U)} ${r1(p.y * U)}`;

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The scale, turn and shift that best carries `from` onto `to` (least
 * squares), as the six numbers of an SVG `matrix()`.
 */
export function fitSimilarity(from: readonly Point[], to: readonly Point[]): [number, number, number, number, number, number] {
  const n = from.length;
  const mean = (ps: readonly Point[]) => ({ x: ps.reduce((t, p) => t + p.x, 0) / n, y: ps.reduce((t, p) => t + p.y, 0) / n });
  const fm = mean(from);
  const tm = mean(to);
  let dot = 0;
  let cross = 0;
  let norm = 0;
  from.forEach((p, i) => {
    const a = sub(p, fm);
    const b = sub(to[i]!, tm);
    dot += a.x * b.x + a.y * b.y;
    cross += a.x * b.y - a.y * b.x;
    norm += a.x * a.x + a.y * a.y;
  });
  const cos = dot / norm;
  const sin = cross / norm;
  return [cos, sin, -sin, cos, tm.x - (cos * fm.x - sin * fm.y), tm.y - (sin * fm.x + cos * fm.y)];
}

/**
 * A finger's area in the drawing: from the line where it meets the hand,
 * out past its tip. Clipped to the skin, that's just the finger.
 */
function fingerArea(finger: Finger): string {
  const [a, b] = FINGERS[finger].map(([x, y]) => ({ x, y })) as [Point, Point];
  const [tx, ty] = TIPS[finger];
  const out = unit(sub({ x: tx, y: ty }, add(a, sub(b, a), 0.5)));
  const far = 700;
  const corners = [a, add(a, out, far), add(b, out, far), b];
  return `M ${corners.map((c) => `${r1(c.x)} ${r1(c.y)}`).join(' L ')} Z`;
}

/** The finger that types `key`. Space can be either thumb. */
function fingerFor(key: LayoutKey): { side: Side; finger: Finger } {
  if (key.finger === 'thumb' || key.hand === 'both') return { side: 'left', finger: 'thumb' };
  return { side: key.hand, finger: key.finger };
}

/**
 * The picture for `keys` (characters; Shift characters use their key). Rows
 * shown: top, home, bottom and space, plus the number row when a key needs it.
 */
export function handsArt(layout: KeyboardLayout, keys: readonly string[], colors: HandsColors): HandsArt {
  const all = layout.rows.flat();
  const targets = keys
    .map((ch) => all.find((k) => k.base === ch || k.shift === ch))
    .filter((k): k is LayoutKey => k !== undefined);
  const targetCodes = new Set(targets.map((k) => k.code));
  const firstRow = targets.some((k) => layout.rows[0]?.includes(k)) ? 0 : 1;

  // Key centers, in key pitches.
  const centers = new Map<string, Point>();
  const top = 0.6;
  layout.rows.forEach((row, r) => {
    if (r < firstRow || r > 3) return;
    row.forEach((key, i) => centers.set(key.code, { x: 0.5 + (ROW_OFFSET[r] ?? 0) + i + 0.5, y: top + (r - firstRow) + 0.5 }));
  });
  // Where each finger rests: the layout's home key for it.
  const homeOf = (side: Side, finger: Digit) => {
    const key = all.find((k) => k.home && k.hand === side && k.finger === finger);
    return key ? centers.get(key.code) : undefined;
  };
  const f = homeOf('left', 'index') ?? { x: 4.75, y: 2.1 };
  const j = homeOf('right', 'index') ?? { x: 7.75, y: 2.1 };
  const spaceY = top + (4 - firstRow) + 0.5;
  const spaceKey = layout.rows[4]?.[0];
  const spaceW = spaceKey?.width ?? 6;
  const spaceX = (f.x + j.x) / 2;
  if (spaceKey) centers.set(spaceKey.code, { x: spaceX, y: spaceY });

  const widest = Math.max(...layout.rows.slice(firstRow, 4).map((row, r) => row.length + (ROW_OFFSET[r + firstRow] ?? 0)));
  const width = widest + 1;
  const height = spaceY + 2.3;

  // Which fingers are used, and the keys they reach for.
  const lit = new Set<string>();
  const reaches: { from: Point; to: Point }[] = [];
  for (const key of targets) {
    const { side, finger } = fingerFor(key);
    const at = centers.get(key.code);
    if (finger === 'thumb') {
      lit.add('left-thumb').add('right-thumb');
      continue;
    }
    lit.add(`${side}-${finger}`);
    const home = homeOf(side, finger);
    if (at && home && (at.x !== home.x || at.y !== home.y)) reaches.push({ from: home, to: at });
  }

  // --- Hands ---------------------------------------------------------------

  // Each hand is the drawing in handDrawing.ts, scaled and turned so its
  // fingertips sit on the home keys as closely as they can; the right hand is
  // the same drawing mirrored.
  const hands = (['left', 'right'] as const).map((side) => {
    const mirror = side === 'right' ? -1 : 1;
    const pairs = DIGITS.map((digit) => {
      const home = homeOf(side, digit);
      const [x, y] = TIPS[digit];
      return home ? { from: { x: x * mirror, y }, to: { x: home.x * U, y: home.y * U } } : null;
    }).filter((pair) => pair !== null);
    if (pairs.length < 2) return '';
    const m = fitSimilarity(
      pairs.map((pair) => pair.from),
      pairs.map((pair) => pair.to),
    );
    const place = `matrix(${m.map((v) => Math.round(v * 1e4) / 1e4).join(' ')})${mirror < 0 ? ' scale(-1 1)' : ''}`;
    const fingers = (['pinky', 'ring', 'middle', 'index', 'thumb'] as const).filter((finger) => lit.has(`${side}-${finger}`));
    return (
      `<g transform="translate(${4 * mirror} 7) ${place}"><path d="${SKIN}" transform="${ROTATE}" fill="${colors.ink}" opacity="0.16"/></g>` +
      `<g transform="${place}">` +
      `<path data-hand="${side}" d="${SKIN}" transform="${ROTATE}" fill="${colors.hand}"/>` +
      `<g clip-path="url(#inkling-hand-skin)" fill="${colors.highlight}">` +
      fingers.map((finger) => `<path data-lit="${side}-${finger}" d="${fingerArea(finger)}"/>`).join('') +
      `</g>` +
      `<path d="${NAILS}" transform="${ROTATE}" fill="${colors.paper}"/>` +
      `<path d="${OUTLINE}" transform="${ROTATE}" fill="${colors.ink}"/>` +
      `</g>`
    );
  });

  // --- Keys ----------------------------------------------------------------

  const keyCaps: string[] = [];
  const marks: string[] = [];
  const label = (ch: string, p: Point, color: string, size = 0.42) =>
    `<text x="${r1(p.x * U)}" y="${r1(p.y * U)}" fill="${color}" font-size="${r1(size * U)}" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="700" text-anchor="middle" dominant-baseline="central">${escapeXml(ch)}</text>`;
  for (const [code, p] of centers) {
    const key = all.find((k) => k.code === code);
    if (!key) continue;
    const isTarget = targetCodes.has(code);
    if (key.base === ' ') {
      const x = (p.x - spaceW / 2) * U;
      const bar = (inset: number, color: string) =>
        `<rect x="${r1(x + inset)}" y="${r1((p.y - 0.28) * U + inset)}" width="${r1(spaceW * U - inset * 2)}" height="${r1(0.56 * U - inset * 2)}" rx="${r1(0.28 * U - inset)}" fill="${color}"/>`;
      keyCaps.push(bar(0, colors.rim), bar(3, isTarget ? colors.highlight : colors.ink));
      if (isTarget)
        marks.push(
          `<rect x="${r1(x - 6)}" y="${r1((p.y - 0.28) * U - 6)}" width="${r1(spaceW * U + 12)}" height="${r1(0.56 * U + 12)}" rx="${r1(0.28 * U + 6)}" fill="none" stroke="${colors.margin}" stroke-width="3"/>`,
        );
      continue;
    }
    const cx = r1(p.x * U);
    const cy = r1(p.y * U);
    keyCaps.push(
      `<circle cx="${cx}" cy="${cy}" r="${r1(0.42 * U)}" fill="${colors.rim}"/>`,
      `<circle cx="${cx}" cy="${cy}" r="${r1(0.34 * U)}" fill="${isTarget ? colors.highlight : colors.ink}"/>`,
      label(key.base, p, isTarget ? colors.ink : colors.paper),
    );
    // The bumps on F and J.
    if (key.base === 'f' || key.base === 'j')
      keyCaps.push(
        `<line x1="${r1((p.x - 0.1) * U)}" y1="${r1((p.y + 0.24) * U)}" x2="${r1((p.x + 0.1) * U)}" y2="${r1((p.y + 0.24) * U)}" stroke="${isTarget ? colors.ink : colors.paper}" stroke-width="2" stroke-linecap="round"/>`,
      );
    if (isTarget) {
      // Over the hands too, so a key under a finger is still plain to see.
      marks.push(
        `<circle cx="${cx}" cy="${cy}" r="${r1(0.36 * U)}" fill="${colors.highlight}" stroke="${colors.ink}" stroke-width="2"/>`,
        label(key.base, p, colors.ink, 0.46),
        `<circle cx="${cx}" cy="${cy}" r="${r1(0.53 * U)}" fill="none" stroke="${colors.margin}" stroke-width="3"/>`,
      );
    }
  }

  // Dashed red-pen arrows from a resting fingertip to the key it reaches for.
  const arrows = reaches.map(({ from, to }) => {
    const d = unit(sub(to, from));
    const start = add(from, d, 0.3);
    const end = add(to, d, -0.62);
    const bend = add(add(start, sub(end, start), 0.5), normal(d), 0.22);
    const dir = unit(sub(end, bend));
    const across = normal(dir);
    const head = [add(end, dir, 0.08), add(add(end, dir, -0.2), across, 0.13), add(add(end, dir, -0.2), across, -0.13)];
    return (
      `<path d="M ${pt(start)} Q ${pt(bend)} ${pt(end)}" fill="none" stroke="${colors.margin}" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round"/>` +
      `<path d="M ${head.map(pt).join(' L ')} Z" fill="${colors.margin}"/>`
    );
  });

  const w = r1(width * U);
  const h = r1(height * U);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false">` +
    `<defs><clipPath id="inkling-hand-skin"><path d="${SKIN}" transform="${ROTATE}"/></clipPath></defs>` +
    `<g>${keyCaps.join('')}</g>` +
    hands.join('') +
    `<g>${marks.join('')}${arrows.join('')}</g>` +
    `</svg>`;
  return { svg, width: w, height: h };
}

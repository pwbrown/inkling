/**
 * The Daily Page result as a picture: a page of the notebook with the score,
 * each page's grade, and the streak. Drawn on a canvas right here, so it
 * works offline and nothing is sent anywhere; the player decides where it
 * goes (the system share sheet, the clipboard, or a saved file).
 */
import type { Grade } from '../core/grade';
import type { PageMark } from '../core/daily';
import { formatNumber, t } from '../i18n';

export interface ShareCardData {
  id: number;
  score: number;
  wpm: number;
  accuracy: number;
  pages: { page: number; grade: Grade | null; mark: PageMark }[];
  streak: number;
  /** Where to say the game is, e.g. "inkykeys.com". */
  site: string;
}

const W = 1200;
const H = 630;
const PAPER = '#f7f1e3';
const INK = '#1f2a44';
const INK_LIGHT = '#3a4a6b';
const RULE = '#b9cfe0';
const MARGIN = '#d9534f';
const TEXT_FONT = "'Atkinson Hyperlegible Next', system-ui, sans-serif";
const HAND_FONT = "Caveat, 'Segoe Print', cursive";
const MARK_COLORS: Record<PageMark, string> = { good: '#7cc47a', fair: '#f1d25a', poor: '#f0a24f', failed: '#e06a5c', notReached: PAPER };

/** The flame-drop mascot (ui/art.ts), as canvas paths in a 48 × 64 box. */
const FLAME = 'M24 62 C12 62 6 53 8 43 C10 34 16 30 14 14 C20 20 22 24 22 27 C21 17 22 9 24 2 C29 11 30 18 28 26 C31 22 33 17 35 12 C38 24 41 32 40 43 C42 53 36 62 24 62 Z';
const CORE = 'M24 58 C16 58 12 52 13 45 C14 39 18 36 19 30 C21 34 23 36 24 38 C25 34 27 31 29 28 C31 34 35 39 35 46 C35 52 31 58 24 58 Z';
const DROP = 'M44 6 L26 48 A21 21 0 1 0 62 48 Z';

function drawFlame(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#e8611a';
  ctx.fill(new Path2D(FLAME));
  ctx.fillStyle = '#f8c537';
  ctx.fill(new Path2D(CORE));
  ctx.fillStyle = INK;
  for (const cx of [19.5, 28.5]) {
    ctx.beginPath();
    ctx.arc(cx, 47, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(20.5, 52.5);
  ctx.quadraticCurveTo(24, 55.5, 27.5, 52.5);
  ctx.stroke();
  ctx.restore();
}

/** Draw the card. Fonts should already be loaded (they are, once the game is running). */
export function drawShareCard(canvas: HTMLCanvasElement, d: ShareCardData): void {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Notebook paper: ruled lines and a red margin.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = RULE;
  ctx.lineWidth = 2;
  for (let y = 150; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.strokeStyle = MARGIN;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(110, 0);
  ctx.lineTo(110, H);
  ctx.stroke();

  // Title, and the game's ink drop and name in the corner.
  ctx.fillStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 84px ${HAND_FONT}`;
  ctx.fillText(t('shareCard.title', { id: d.id }), 150, 112);
  ctx.save();
  ctx.translate(W - 290, 40);
  ctx.scale(0.75, 0.75);
  ctx.fill(new Path2D(DROP));
  ctx.restore();
  ctx.font = `700 40px ${TEXT_FONT}`;
  ctx.fillText('Inky Keys', W - 230, 92);

  // The score, big.
  ctx.font = `700 132px ${TEXT_FONT}`;
  const score = formatNumber(d.score);
  ctx.fillText(score, 150, 300);
  const scoreWidth = ctx.measureText(score).width;
  ctx.font = `600 40px ${TEXT_FONT}`;
  ctx.fillStyle = INK_LIGHT;
  ctx.fillText(t('shareCard.points'), 150 + scoreWidth + 18, 300);
  ctx.fillText(t('shareCard.stats', { wpm: d.wpm, accuracy: d.accuracy }), 150, 362);

  // One tile per page.
  const tileW = 150;
  const tileH = 110;
  d.pages.forEach((p, i) => {
    const x = 150 + i * (tileW + 22);
    const y = 410;
    ctx.beginPath();
    ctx.roundRect(x, y, tileW, tileH, 16);
    ctx.fillStyle = MARK_COLORS[p.mark];
    ctx.fill();
    if (p.mark === 'notReached') {
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = INK_LIGHT;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.font = `600 26px ${TEXT_FONT}`;
    ctx.fillText(t('daily.pageLabel', { page: p.page }), x + tileW / 2, y + 38);
    ctx.font = `700 48px ${TEXT_FONT}`;
    ctx.fillText(p.grade ?? t('daily.notReached'), x + tileW / 2, y + 92);
    ctx.textAlign = 'left';
  });

  // The streak, with the flame drop.
  if (d.streak > 0) {
    drawFlame(ctx, 760, 390, 2.3);
    ctx.fillStyle = INK;
    ctx.font = `700 96px ${TEXT_FONT}`;
    ctx.fillText(String(d.streak), 885, 520);
    const w = ctx.measureText(String(d.streak)).width;
    ctx.font = `600 34px ${TEXT_FONT}`;
    ctx.fillStyle = INK_LIGHT;
    ctx.fillText(t('daily.streakUnit'), 885 + w + 14, 520);
  }

  ctx.fillStyle = INK_LIGHT;
  ctx.font = `600 30px ${TEXT_FONT}`;
  ctx.fillText(d.site, 150, 590);
}

/** The card as a PNG file. */
export async function shareCardFile(d: ShareCardData): Promise<File> {
  const canvas = document.createElement('canvas');
  drawShareCard(canvas, d);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not draw the share card');
  return new File([blob], `inky-keys-daily-${d.id}.png`, { type: 'image/png' });
}

/**
 * Send the card on: the system share sheet where there is one, otherwise
 * the clipboard, otherwise a saved file.
 */
export async function shareCard(d: ShareCardData): Promise<'shared' | 'copied' | 'saved' | 'cancelled'> {
  const file = await shareCardFile(d);
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: t('shareCard.title', { id: d.id }) });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': file })]);
      return 'copied';
    } catch {
      // Fall through to saving it.
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'saved';
}

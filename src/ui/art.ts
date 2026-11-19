/**
 * Small inline SVG pictures for the DOM screens: player badges and the
 * Desk's unlockable pens, ink and paper, drawn to match the game's shapes
 * (renderer.ts) so a reward looks like what you'll see on the page.
 * Pictures are decorative (aria-hidden); their names are always shown as text.
 */
import type { Cosmetics, CosmeticSlot } from '../core/rewards';
import type { Badge } from '../storage/profiles';

const GOLD = '#c9a227';

/** Badge and splatter colors. Ink and paper follow the theme through CSS variables. */
const HUES: Record<Badge | Cosmetics['splatter'], string> = {
  ink: 'var(--tc-ink)',
  crimson: '#a3203a',
  violet: '#5b2a86',
  teal: '#1f7f86',
  gold: GOLD,
  moss: '#4f7a3a',
};

const svg = (viewBox: string, body: string, className: string) =>
  `<svg class="${className}" viewBox="${viewBox}" aria-hidden="true" focusable="false">${body}</svg>`;

/**
 * The streak mascot: while a streak is going, the ink drop *is* a flame,
 * with flickering tips and a bright core where its face is. With no streak
 * it's a plain ink drop, asleep, with a wisp of smoke where the flame was.
 */
export function streakDropSvg(lit: boolean): string {
  if (!lit) {
    return svg(
      '0 0 48 64',
      `<path d="M25 11 q-4 -3 -1 -6 q3 -3 0 -5" fill="none" stroke="var(--tc-ink-light)" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
       <path d="M24 14 L10 42 A15 15 0 1 0 38 42 Z" fill="var(--tc-ink)"/>
       <circle cx="17" cy="41" r="2.4" fill="var(--tc-paper)" opacity="0.5"/>
       <path d="M16.5 49 h5 M26.5 49 h5 M21.5 55 h5" stroke="var(--tc-paper)" stroke-width="2" stroke-linecap="round"/>`,
      'art art-streak',
    );
  }
  return svg(
    '0 0 48 64',
    `<path d="M24 62 C12 62 6 53 8 43 C10 34 16 30 14 14 C20 20 22 24 22 27 C21 17 22 9 24 2 C29 11 30 18 28 26 C31 22 33 17 35 12 C38 24 41 32 40 43 C42 53 36 62 24 62 Z" fill="#e8611a"/>
     <path d="M24 58 C16 58 12 52 13 45 C14 39 18 36 19 30 C21 34 23 36 24 38 C25 34 27 31 29 28 C31 34 35 39 35 46 C35 52 31 58 24 58 Z" fill="#f8c537"/>
     <circle cx="19.5" cy="47" r="2.6" fill="var(--tc-ink)"/><circle cx="28.5" cy="47" r="2.6" fill="var(--tc-ink)"/>
     <path d="M20.5 52.5 q3.5 3 7 0" fill="none" stroke="var(--tc-ink)" stroke-width="2" stroke-linecap="round"/>`,
    'art art-streak',
  );
}

/** A small ink drop, for a day played on the streak strip. */
export function dayDropSvg(): string {
  return svg('0 0 24 30', `<path d="M12 1 L3.5 18 A9.2 9.2 0 1 0 20.5 18 Z" fill="var(--tc-ink)"/>`, 'art art-day');
}

/** A player's badge: a little ink drop with a face, in their color. */
export function badgeSvg(badge: Badge): string {
  const fill = HUES[badge];
  return svg(
    '20 2 48 80',
    `<path d="M44 6 L26 48 A21 21 0 1 0 62 48 Z" fill="${fill}"/>
     <circle cx="38" cy="54" r="4.2" fill="var(--tc-paper)"/><circle cx="52" cy="54" r="4.2" fill="var(--tc-paper)"/>
     <circle cx="34" cy="44" r="3" fill="var(--tc-paper)" opacity="0.5"/>
     <path d="M39 63 q6 5 12 0" fill="none" stroke="var(--tc-paper)" stroke-width="2.4" stroke-linecap="round"/>`,
    'art art-badge',
  );
}

function nibSvg(style: Cosmetics['nib']): string {
  switch (style) {
    case 'quill':
      return svg(
        '0 0 120 60',
        `<polygon points="14,26 30,10 66,18 116,30 66,38 30,40 14,32" fill="var(--tc-ink-light)"/>
         ${[22, 29, 36, 43, 50, 57, 64].map((x) => `<line x1="${x}" y1="29" x2="${x + 8}" y2="${17 + (x - 22) * 0.05}" stroke="var(--tc-paper)" stroke-width="1" opacity="0.6"/>`).join('')}
         <line x1="10" y1="31" x2="116" y2="30" stroke="var(--tc-ink)" stroke-width="2"/>`,
        'art art-nib',
      );
    case 'brush':
      return svg(
        '0 0 120 60',
        `<rect x="12" y="25" width="40" height="10" rx="4" fill="#8a5a33"/>
         <rect x="50" y="23" width="12" height="14" fill="#8c95a8"/>
         <path d="M62 21 Q92 22 112 30 Q92 38 62 39 Z" fill="var(--tc-ink)"/>`,
        'art art-nib',
      );
    default: {
      const fill = style === 'gold' ? GOLD : 'var(--tc-ink)';
      const shine = style === 'gold' ? '<polygon points="36,16 62,24 36,24" fill="#fff1b8" opacity="0.6"/>' : '';
      return svg(
        '0 0 120 60',
        `<polygon points="32,8 88,30 32,52 42,30" fill="${fill}"/>
         <line x1="46" y1="30" x2="82" y2="30" stroke="var(--tc-paper)" stroke-width="2"/>
         <circle cx="52" cy="30" r="4" fill="var(--tc-paper)"/>${shine}`,
        'art art-nib',
      );
    }
  }
}

function splatterSvg(color: Cosmetics['splatter']): string {
  const fill = HUES[color];
  return svg(
    '0 0 120 60',
    `<path d="M60 10 C70 12 72 20 80 18 C90 16 94 26 88 32 C84 37 92 44 84 48 C76 52 70 46 62 50 C52 55 44 48 40 44 C32 40 24 40 28 32 C31 26 26 18 36 16 C44 14 50 8 60 10 Z" fill="${fill}"/>
     <circle cx="98" cy="18" r="5" fill="${fill}"/><circle cx="20" cy="46" r="4" fill="${fill}"/><circle cx="104" cy="44" r="3" fill="${fill}"/>
     <circle cx="16" cy="20" r="2.5" fill="${fill}"/>`,
    'art art-splatter',
  );
}

/** A tiny leaf or snowflake for the holiday papers' printed border. */
const LEAF = (x: number, y: number, fill: string) =>
  `<path d="M${x} ${y + 5} C${x - 6} ${y + 2} ${x - 6} ${y - 4} ${x} ${y - 6} C${x + 6} ${y - 4} ${x + 6} ${y + 2} ${x} ${y + 5} Z" fill="${fill}" opacity="0.7"/>`;
const FLAKE = (x: number, y: number) =>
  `<path d="M${x - 4} ${y} h8 M${x - 2} ${y - 3.5} l4 7 M${x + 2} ${y - 3.5} l-4 7" stroke="#7fa8d1" stroke-width="1.3" stroke-linecap="round"/>`;

function paperSvg(style: Cosmetics['paper']): string {
  const paper = { parchment: '#ead7a6', harvest: '#f1dcb6', winter: '#e9f0f7' }[style as string] ?? 'var(--tc-paper)';
  const border =
    style === 'harvest'
      ? [34, 54, 74, 94].map((x, i) => LEAF(x, 50, ['#d9762b', '#b4472d', '#e0a72e', '#9a6234'][i]!)).join('')
      : style === 'winter'
        ? [34, 54, 74, 94].map((x) => FLAKE(x, 50)).join('')
        : '';
  const grid =
    style === 'graph'
      ? Array.from({ length: 13 }, (_, i) => `<line x1="${i * 10}" y1="0" x2="${i * 10}" y2="60" stroke="var(--tc-rule)" stroke-width="0.8" opacity="0.6"/>`).join('') +
        Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="${i * 10 + 5}" x2="120" y2="${i * 10 + 5}" stroke="var(--tc-rule)" stroke-width="0.8" opacity="0.6"/>`).join('')
      : '';
  const lines = [15, 35, 55].map((y) => `<line x1="0" y1="${y}" x2="120" y2="${y}" stroke="var(--tc-rule)" stroke-width="1.6"/>`).join('');
  return svg(
    '0 0 120 60',
    `<rect x="0" y="0" width="120" height="60" rx="6" fill="${paper}" stroke="var(--tc-ink)" stroke-width="1.5"/>
     ${grid}${lines}${border}<line x1="22" y1="0" x2="22" y2="60" stroke="var(--tc-margin)" stroke-width="2"/>`,
    'art art-paper',
  );
}

/** The fountain nib wearing a holiday hat (or none). */
function hatSvg(hat: Cosmetics['hat']): string {
  const santa = `<g transform="translate(46 15) rotate(21)">
      <path d="M-11 0 Q-4 -19 8 -18 Q15 -17 17 -9 Q9 -10 11 0 Z" fill="#c62f2f"/>
      <rect x="-13" y="-3" width="26" height="6" rx="3" fill="#fbf8f1"/><circle cx="17" cy="-8" r="3.5" fill="#fbf8f1"/></g>`;
  const pilgrim = `<g transform="translate(46 16) rotate(21)">
      <ellipse cx="0" cy="0" rx="14" ry="2.8" fill="#2f2a28"/><path d="M-8 0 L-7 -19 L7 -19 L8 0 Z" fill="#2f2a28"/>
      <rect x="-7.6" y="-8" width="15.2" height="4" fill="#5b4636"/><rect x="-2.2" y="-8.8" width="4.4" height="5.6" fill="none" stroke="#d9b23a" stroke-width="1.3"/></g>`;
  return svg(
    '0 0 120 60',
    `<polygon points="32,8 88,30 32,52 42,30" fill="var(--tc-ink)"/>
     <line x1="46" y1="30" x2="82" y2="30" stroke="var(--tc-paper)" stroke-width="2"/>
     <circle cx="52" cy="30" r="4" fill="var(--tc-paper)"/>${hat === 'santa' ? santa : hat === 'pilgrim' ? pilgrim : ''}`,
    'art art-nib',
  );
}

/** A picture of an unlockable item. */
export function cosmeticSvg(slot: CosmeticSlot, item: string): string {
  switch (slot) {
    case 'nib':
      return nibSvg(item as Cosmetics['nib']);
    case 'splatter':
      return splatterSvg(item as Cosmetics['splatter']);
    case 'paper':
      return paperSvg(item as Cosmetics['paper']);
    case 'hat':
      return hatSvg(item as Cosmetics['hat']);
  }
}

/** An element holding inline SVG markup (built only from the constants above). */
export function artElement(markup: string, className = 'art-wrap'): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = className;
  span.innerHTML = markup;
  return span;
}

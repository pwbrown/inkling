/** Shared colors and fonts for the Inkwell look (DESIGN §7). */
export type ThemeId = 'classic' | 'contrast' | 'night';

export const THEMES: readonly ThemeId[] = ['classic', 'contrast', 'night'];

type Palette = {
  desk: number;
  paper: number;
  rule: number;
  margin: number;
  ink: number;
  inkLight: number;
  inkFaded: number;
  highlighter: number;
  pencil: number;
  /** Text drawn on top of ink (target labels). */
  label: number;
};

/**
 * Palettes. None relies on red/green, and state is never shown by color
 * alone (shapes, underlines, strikethroughs too), so all are colorblind-safe.
 */
export const PALETTES: Record<ThemeId, Palette> = {
  classic: {
    desk: 0x2b2622,
    paper: 0xf7f1e3,
    rule: 0xb9cfe0,
    margin: 0xd9534f,
    ink: 0x1f2a44,
    inkLight: 0x3a4a6b,
    inkFaded: 0x8a96b0,
    highlighter: 0xffe066,
    pencil: 0x5b5b5b,
    label: 0xf7f1e3,
  },
  // Maximum contrast: pure black on white, with a strong blue margin.
  contrast: {
    desk: 0x000000,
    paper: 0xffffff,
    rule: 0x8aa4bf,
    margin: 0x0050c8,
    ink: 0x000000,
    inkLight: 0x1a1a1a,
    inkFaded: 0x9a9a9a,
    highlighter: 0xffd400,
    pencil: 0x333333,
    label: 0xffffff,
  },
  // Dark paper, pale ink (DESIGN §7, "night mode").
  night: {
    desk: 0x0d0f16,
    paper: 0x1d2130,
    rule: 0x34405a,
    margin: 0xff8a7a,
    ink: 0xe9e4d4,
    inkLight: 0xc4bfae,
    inkFaded: 0x6f7486,
    highlighter: 0x8a6d00,
    pencil: 0xa8a8a8,
    label: 0x1d2130,
  },
};

/** The active palette. Mutated by `setTheme`; the renderer rebuilds afterwards. */
export const COLORS: Palette = { ...PALETTES.classic };

export function setTheme(theme: ThemeId): void {
  Object.assign(COLORS, PALETTES[theme]);
}

/** Legible text for anything the player has to read or type (DESIGN §7). */
export const TEXT_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Decorative headings. A bundled handwriting font replaces this later. */
export const DISPLAY_FONT = 'Georgia, "Times New Roman", serif';

/** The OS "reduce motion" setting (REQUIREMENTS §10). Settings can override it. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** How to show a character on a target: space gets a visible symbol. */
export function glyph(text: string): string {
  return text === ' ' ? '␣' : text;
}

/** How to show a key in UI text. */
export function keyLabel(key: string): string {
  return key === ' ' ? 'Space' : key;
}

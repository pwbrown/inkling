/** Shared colors and fonts for the Inkwell look (DESIGN §7). */
export const COLORS = {
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
} as const;

/** Legible text for anything the player has to read or type (DESIGN §7). */
export const TEXT_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Decorative headings. A bundled handwriting font replaces this later. */
export const DISPLAY_FONT = 'Georgia, "Times New Roman", serif';

/** Honor the OS "reduce motion" setting (REQUIREMENTS §10). */
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

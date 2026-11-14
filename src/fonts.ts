/**
 * Bundled fonts (REQUIREMENTS §7, offline: no font CDN). Atkinson
 * Hyperlegible was designed for low-vision readers, so look-alike characters
 * such as l I 1 | and 0 O are clearly different. That matters in a typing
 * game. Licensed under the SIL OFL 1.1 (see CREDITS.md).
 */
import '@fontsource/atkinson-hyperlegible-next/latin-400.css';
import '@fontsource/atkinson-hyperlegible-next/latin-600.css';
import '@fontsource/atkinson-hyperlegible-next/latin-700.css';
import '@fontsource/atkinson-hyperlegible-mono/latin-600.css';
// Caveat: a handwriting face for headings and the teacher's red-pen marks (DESIGN §7).
import '@fontsource/caveat/latin-700.css';

/**
 * Wait for the fonts before drawing any canvas text: PixiJS measures and
 * rasterises text once, so text drawn before the font loads would stay in the
 * fallback font. Never blocks for long, and a failure just means the fallback.
 */
export async function loadFonts(timeoutMs = 3000): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const loads = Promise.all([
    document.fonts.load('400 20px "Atkinson Hyperlegible Next"'),
    document.fonts.load('600 20px "Atkinson Hyperlegible Next"'),
    document.fonts.load('700 20px "Atkinson Hyperlegible Next"'),
    document.fonts.load('600 20px "Atkinson Hyperlegible Mono"'),
    document.fonts.load('700 20px "Caveat"'),
  ]);
  await Promise.race([loads.catch(() => undefined), new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}

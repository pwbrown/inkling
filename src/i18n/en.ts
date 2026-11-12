/**
 * English UI strings. Every user-facing string goes through `t()` so other
 * locales can be added later as sibling files (REQUIREMENTS §11).
 */
export const en = {
  'hud.ink': 'Ink',
  'hud.score': 'Score {score}',
  'hud.multiplier': '×{multiplier}',
  'hud.page': 'Page {page} · {done}/{total}',

  'overlay.ready.title': 'Inkling',
  'overlay.ready.body': 'Type the letter on each ink drip before it reaches the red margin.',
  'overlay.ready.prompt': 'Press Enter to start',

  'overlay.paused.title': 'Paused',
  'overlay.paused.prompt': 'Press Esc to resume',

  'overlay.pageCleared.title': 'Page {page} complete',
  'overlay.pageCleared.prompt': 'Press Enter to turn the page',

  'overlay.gameOver.title': 'Out of ink',
  'overlay.gameOver.prompt': 'Press Enter to start a new notebook',

  'overlay.stats': 'Score {score} · {wpm} WPM · {accuracy}% accuracy',
  'overlay.missed': 'Watch your: {keys}',
} as const;

export type MessageKey = keyof typeof en;

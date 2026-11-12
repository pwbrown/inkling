/**
 * English UI strings. Every user-facing string goes through `t()` so other
 * locales can be added later as sibling files (REQUIREMENTS §11).
 */
export const en = {
  'hud.ink': 'Ink',
  'hud.score': 'Score {score}',
  'hud.multiplier': '×{multiplier}',
  'hud.page': 'Chapter {chapter} · Page {page} of {pages} · {done}/{total}',

  'overlay.ready.title': 'New notebook',
  'overlay.ready.body': 'Type the letters and words on the ink creatures before they reach the red margin.',
  'overlay.ready.choose': 'Choose a difficulty (↑ ↓ or 1–4):',
  'overlay.ready.prompt': 'Press Enter to start',

  'difficulty.relaxed': 'Relaxed',
  'difficulty.relaxed.description': 'Slower ink, gentle mistakes. Good for learning new keys.',
  'difficulty.normal': 'Normal',
  'difficulty.normal.description': 'The intended pace.',
  'difficulty.hard': 'Hard',
  'difficulty.hard.description': 'Faster, busier pages and longer words.',
  'difficulty.expert': 'Expert',
  'difficulty.expert.description': 'For keys you already know cold.',

  'overlay.paused.title': 'Paused',
  'overlay.paused.prompt': 'Press Esc to resume',

  'overlay.pageCleared.title': 'Page {page} complete',
  'overlay.pageCleared.prompt': 'Press Enter to turn the page',

  'overlay.chapterCleared.title': 'Chapter {chapter} complete',
  'overlay.chapterCleared.refill': 'Your ink well was topped up by {ink}.',
  'overlay.chapterCleared.prompt': 'Press Enter to start chapter {next}',

  'overlay.gameOver.title': 'Out of ink',
  'overlay.gameOver.reached': '{difficulty} · reached chapter {chapter}, page {page}',
  'overlay.gameOver.prompt': 'Press Enter to start a new notebook',

  'overlay.stats': 'Score {score} · {wpm} WPM · {accuracy}% accuracy',
  'overlay.missed': 'Watch your: {keys}',
} as const;

export type MessageKey = keyof typeof en;

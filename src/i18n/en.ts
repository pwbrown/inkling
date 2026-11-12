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
  'overlay.ready.keys': 'Keys: {preset} · {count} keys',
  'overlay.ready.changeKeys': 'Change keys (K)',

  'typeCase.title': 'Type Case',
  'typeCase.intro': 'Pick the keys you want to practice. Click a key (or press it) to add or remove it. The top of each key is its Shift character.',
  'typeCase.presets': 'Presets',
  'typeCase.yourPresets': 'Your presets',
  'typeCase.groups': 'Select a group',
  'typeCase.keyboard': 'Keyboard',
  'typeCase.savePlaceholder': 'Name this selection',
  'typeCase.save': 'Save preset',
  'typeCase.delete': 'Delete preset {name}',
  'typeCase.clear': 'Clear all',
  'typeCase.cancel': 'Cancel',
  'typeCase.done': 'Use these keys',
  'typeCase.summary': '{keys} keys selected · {words} words possible',
  'typeCase.warnEmpty': 'Pick at least one key.',
  'typeCase.warnFewWords': 'Only a few real words use just these keys, so word pages will mix in made-up strings.',
  'typeCase.warnNoWords': 'No real words use just these keys, so word pages will use made-up strings.',
  'typeCase.key': '{char} key',
  'typeCase.space': 'Space',

  'preset.homeRow': 'Home row',
  'preset.homeRowEI': 'Home row + E I',
  'preset.homeTopRows': 'Home + top rows',
  'preset.allLetters': 'All letters',
  'preset.lettersCapitals': 'Letters + capitals',
  'preset.lettersPunctuation': 'Sentences',
  'preset.leftHand': 'Left hand',
  'preset.rightHand': 'Right hand',
  'preset.numbers': 'Numbers',
  'preset.numberSymbols': 'Number-row symbols',
  'preset.code': 'Code symbols',
  'preset.everything': 'Everything',
  'preset.custom': 'Custom',

  'region.lowercase': 'Lowercase',
  'region.uppercase': 'Capitals',
  'region.digits': 'Digits',
  'region.symbols': 'Symbols',
  'region.shiftedSymbols': 'Shifted symbols',
  'region.space': 'Space',
  'region.numberRow': 'Number row',
  'region.topRow': 'Top row',
  'region.homeRow': 'Home row',
  'region.bottomRow': 'Bottom row',
  'region.leftHand': 'Left hand',
  'region.rightHand': 'Right hand',

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

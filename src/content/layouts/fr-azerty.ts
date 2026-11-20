import { lessonPlan } from './ansi';
import { isoLayout, marked } from './iso';

/**
 * French AZERTY (France), on an ISO keyboard. Digits are on Shift; é è ç à ù
 * have their own keys; ^ and ¨ are dead keys (^ then e = ê). The PC layout
 * is the default; a Mac moves a few symbols (`mac`).
 */
export const FR_AZERTY = isoLayout(
  'fr-azerty',
  [
    { base: '²&é"\'(-è_çà)=', shift: ' 1234567890°+' },
    { base: 'azertyuiop^$', shift: 'AZERTYUIOP¨£' },
    { base: 'qsdfghjklmù*', shift: 'QSDFGHJKLM%µ' },
    { base: '<wxcvbn,;:!', shift: '>WXCVBN?./§' },
  ],
  // F and J (the keys with bumps), the rest of the home row, space, then the
  // letters, common ones first. The home row is all letters, so the comma
  // takes the place QWERTY gives the semicolon.
  lessonPlan('fj', 'dkslqmgh', 'eirutyon,cvbxpazw'),
  {
    altGr: {
      Digit2: ['~'],
      Digit3: ['#'],
      Digit4: ['{'],
      Digit5: ['['],
      Digit6: ['|'],
      Digit7: ['`'],
      Digit8: ['\\'],
      Digit9: ['^'],
      Digit0: ['@'],
      Minus: [']'],
      Equal: ['}'],
      KeyE: ['€'],
      BracketRight: ['¤'],
    },
    dead: { BracketLeft: ['base', 'shift'], Digit2: ['altGr'], Digit7: ['altGr'] },
    compose: {
      '^': marked('aeiou', 'âêîôû', '^'),
      '¨': marked('aeiouy', 'äëïöüÿ', '¨'),
      '`': marked('aeiou', 'àèìòù', '`'),
      '~': marked('ano', 'ãñõ', '~'),
    },
    mac: {
      Backquote: { base: '@', shift: '#' },
      Digit6: { base: '§' },
      Digit8: { base: '!' },
      Equal: { base: '-', shift: '_' },
      BracketRight: { shift: '*' },
      Backslash: { base: '`', shift: '£', dead: ['base'] },
      Slash: { base: '=', shift: '+' },
    },
  },
);

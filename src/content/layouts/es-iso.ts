import { lessonPlan } from './ansi';
import { isoLayout, marked } from './iso';

/**
 * Spanish (Spain), on an ISO keyboard. ñ has its own key on the home row;
 * ´ and ¨ are dead keys (´ then a = á), and so are ` and ^; ¡ and ¿ are
 * right of 0.
 */
export const ES_ISO = isoLayout(
  'es-iso',
  [
    { base: 'º1234567890\'¡', shift: 'ª!"·$%&/()=?¿' },
    { base: 'qwertyuiop`+', shift: 'QWERTYUIOP^*' },
    { base: 'asdfghjklñ´ç', shift: 'ASDFGHJKLÑ¨Ç' },
    { base: '<zxcvbnm,.-', shift: '>ZXCVBNM;:_' },
  ],
  // The letters sit where US QWERTY has them, so the course is the same, with
  // ñ where QWERTY has the semicolon.
  lessonPlan('fj', 'dkslañgh', 'eirutyownmcvbxpqz'),
  {
    altGr: {
      Backquote: ['\\'],
      Digit1: ['|'],
      Digit2: ['@'],
      Digit3: ['#'],
      Digit6: ['¬'],
      KeyE: ['€'],
      BracketLeft: ['['],
      BracketRight: [']'],
      Quote: ['{'],
      Backslash: ['}'],
    },
    dead: { BracketLeft: ['base', 'shift'], Quote: ['base', 'shift'] },
    compose: {
      '´': marked('aeiou', 'áéíóú', '´'),
      '¨': marked('aeiou', 'äëïöü', '¨'),
      '`': marked('aeiou', 'àèìòù', '`'),
      '^': marked('aeiou', 'âêîôû', '^'),
    },
  },
);

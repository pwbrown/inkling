import { ansiLayout, lessonPlan } from './ansi';

/** Colemak: QWERTY with the most common letters moved onto the home row. */
export const COLEMAK = ansiLayout(
  'colemak',
  [
    { base: '`1234567890-=', shift: '~!@#$%^&*()_+' },
    { base: 'qwfpgjluy;[]\\', shift: 'QWFPGJLUY:{}|' },
    { base: "arstdhneio'", shift: 'ARSTDHNEIO"' },
    { base: 'zxcvbkm,./', shift: 'ZXCVBKM<>?' },
  ],
  // T and N (under the index fingers), the rest of the home row, space, then
  // the other letters, common ones first.
  lessonPlan('tn', 'seriaodh', 'ulfpywgmcvbk;jxqz'),
);

import { ansiLayout, lessonPlan } from './ansi';

/** US Dvorak: vowels under the left hand, common consonants under the right. */
export const DVORAK = ansiLayout(
  'dvorak',
  [
    { base: '`1234567890[]', shift: '~!@#$%^&*(){}' },
    { base: "',.pyfgcrl/=\\", shift: '"<>PYFGCRL?+|' },
    { base: 'aoeuidhtns-', shift: 'AOEUIDHTNS_' },
    { base: ';qjkxbmwvz', shift: ':QJKXBMWVZ' },
  ],
  // U and H (under the index fingers), the rest of the home row, space, then
  // the other letters, common ones first. The home row is all letters, so
  // the period takes the place QWERTY gives the semicolon.
  lessonPlan('uh', 'etonasid', 'rlcgpyfmwbvk.jxqz'),
);

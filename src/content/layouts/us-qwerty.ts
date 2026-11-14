import { ansiLayout, lessonPlan } from './ansi';

export { findKey } from './ansi';

/** US QWERTY, the first layout (REQUIREMENTS §5). */
export const US_QWERTY = ansiLayout(
  'us-qwerty',
  [
    { base: '`1234567890-=', shift: '~!@#$%^&*()_+' },
    { base: 'qwertyuiop[]\\', shift: 'QWERTYUIOP{}|' },
    { base: "asdfghjkl;'", shift: 'ASDFGHJKL:"' },
    { base: 'zxcvbnm,./', shift: 'ZXCVBNM<>?' },
  ],
  // F and J (the keys with bumps), the rest of the home row, space, then the
  // letters in roughly the order typing courses teach them.
  lessonPlan('fj', 'dksla;gh', 'eirutyownmcvbxpqz'),
);

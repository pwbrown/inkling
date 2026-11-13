/** Picks the right creature drawing for a target (DESIGN §5). */
import type { Target } from '../../core/world';
import { createBlotling } from './blotling';
import type { CreatureView } from './common';
import { createDrip } from './drip';
import { createMisprint } from './misprint';
import { createRunon } from './runon';

export type { CreatureView, FrameContext } from './common';

export function createCreature(target: Target, scale: number): CreatureView {
  switch (target.kind) {
    case 'drip':
      return createDrip(target, scale);
    case 'blotling':
      return createBlotling(target, scale);
    case 'runon':
      return createRunon(target, scale);
    case 'misprint':
      return createMisprint(target, scale);
  }
}

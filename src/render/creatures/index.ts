/** Picks the right creature drawing for a target (DESIGN §5). */
import { sizeScale, type Target } from '../../core/world';
import { createBlotling } from './blotling';
import { createBottle } from './bottle';
import type { CreatureView } from './common';
import { createDrip } from './drip';
import { createRunon } from './runon';

export type { CreatureView, FrameContext } from './common';

export function createCreature(target: Target, baseScale: number): CreatureView {
  const scale = baseScale * sizeScale(target);
  if (target.bottle) return createBottle(target, scale);
  switch (target.kind) {
    case 'drip':
      return createDrip(target, scale);
    case 'blotling':
      return createBlotling(target, scale);
    case 'runon':
      return createRunon(target, scale);
  }
}

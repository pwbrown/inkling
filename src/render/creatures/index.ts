/** Picks the right creature drawing for a target (DESIGN §5). */
import type { Target } from '../../core/world';
import { createBlotling } from './blotling';
import { createBottle } from './bottle';
import type { CreatureView } from './common';
import { createDrip } from './drip';
import { createRunon } from './runon';

export type { CreatureView, FrameContext } from './common';

/** How much bigger the Spill (boss) is than a normal Scrawler. */
export const BOSS_SCALE = 1.5;

export function createCreature(target: Target, baseScale: number): CreatureView {
  const scale = target.boss ? baseScale * BOSS_SCALE : baseScale;
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

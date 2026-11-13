/**
 * Ink shots: drops of ink the Nib flicks at the letter you type. Hits land
 * on the letter; misses splash onto the page beside the creature.
 */
import { Container, Graphics } from 'pixi.js';
import type { Point } from './aim';

interface Shot {
  g: Graphics;
  from: Point;
  to: Point;
  elapsedMs: number;
  durationMs: number;
  onLand: (at: Point) => void;
}

/** Ink speed in page pixels per second: quick, but readable. */
export const SHOT_SPEED = 2400;

export class InkShots {
  readonly layer = new Container();
  private shots: Shot[] = [];

  constructor(
    private readonly reducedMotion: boolean,
    private readonly color: number,
  ) {}

  /** Fire from `from` to `to`, arriving after `seconds`. With reduced motion, lands at once. */
  fire(from: Point, to: Point, seconds: number, onLand: (at: Point) => void): void {
    if (this.reducedMotion) {
      onLand(to);
      return;
    }
    const g = new Graphics();
    this.layer.addChild(g);
    this.shots.push({ g, from, to, elapsedMs: 0, durationMs: Math.max(40, seconds * 1000), onLand });
  }

  update(dtMs: number): void {
    this.shots = this.shots.filter((shot) => {
      shot.elapsedMs += dtMs;
      const p = Math.min(1, shot.elapsedMs / shot.durationMs);
      const x = shot.from.x + (shot.to.x - shot.from.x) * p;
      const y = shot.from.y + (shot.to.y - shot.from.y) * p;
      if (p >= 1) {
        shot.g.destroy();
        shot.onLand(shot.to);
        return false;
      }
      // A drop with a short tapering trail behind it.
      const dx = shot.to.x - shot.from.x;
      const dy = shot.to.y - shot.from.y;
      const len = Math.hypot(dx, dy) || 1;
      const tail = Math.min(36, len * p);
      const tx = x - (dx / len) * tail;
      const ty = y - (dy / len) * tail;
      shot.g
        .clear()
        .moveTo(tx, ty)
        .lineTo(x, y)
        .stroke({ width: 3, color: this.color, alpha: 0.45, cap: 'round' })
        .circle(x, y, 4.5)
        .fill(this.color);
      return true;
    });
  }
}

import { describe, expect, it } from 'vitest';
import { intercept } from './aim';

describe('intercept', () => {
  it('aims straight at a still target', () => {
    const aim = intercept({ x: 0, y: 0 }, { x: 300, y: 400 }, 0, 0, 1000);
    expect(aim.x).toBeCloseTo(300);
    expect(aim.y).toBeCloseTo(400);
    expect(aim.t).toBeCloseTo(0.5);
  });

  it('leads a moving target so the ink and the letter arrive together', () => {
    const from = { x: 50, y: 360 };
    const letter = { x: 900, y: 200 };
    const vx = -120;
    const speed = 2600;
    const aim = intercept(from, letter, vx, 0, speed);
    // The aim point is ahead of (left of) the letter's current position…
    expect(aim.x).toBeLessThan(letter.x);
    // …exactly where the letter will be after the flight time…
    expect(aim.x).toBeCloseTo(letter.x + vx * aim.t);
    // …and the ink covers that distance in that same time.
    expect(Math.hypot(aim.x - from.x, aim.y - from.y)).toBeCloseTo(speed * aim.t, 4);
  });

  it('falls back to a straight shot when the target is impossibly fast', () => {
    const aim = intercept({ x: 0, y: 0 }, { x: 100, y: 0 }, 5000, 0, 100);
    expect(aim.x).toBe(100);
    expect(aim.t).toBeCloseTo(1);
  });
});

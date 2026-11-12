import { describe, expect, it } from 'vitest';
import { FixedStepLoop } from './loop';

describe('FixedStepLoop', () => {
  it('runs one update per full step and carries the remainder', () => {
    const steps: number[] = [];
    const loop = new FixedStepLoop((ms) => steps.push(ms), { stepMs: 10 });

    expect(loop.advance(25)).toBeCloseTo(0.5);
    expect(steps).toEqual([10, 10]);

    // Remainder (5) + 5 completes a third step exactly.
    expect(loop.advance(5)).toBeCloseTo(0);
    expect(steps).toHaveLength(3);
  });

  it('runs no update when the frame is shorter than a step', () => {
    let calls = 0;
    const loop = new FixedStepLoop(() => calls++, { stepMs: 16 });
    expect(loop.advance(8)).toBeCloseTo(0.5);
    expect(calls).toBe(0);
  });

  it('clamps huge frame gaps to maxFrameMs', () => {
    let calls = 0;
    const loop = new FixedStepLoop(() => calls++, { stepMs: 10, maxFrameMs: 100 });
    loop.advance(10_000);
    expect(calls).toBe(10);
  });

  it('ignores negative and non-finite frame times', () => {
    let calls = 0;
    const loop = new FixedStepLoop(() => calls++, { stepMs: 10 });
    loop.advance(-50);
    loop.advance(Number.NaN);
    loop.advance(Number.POSITIVE_INFINITY);
    expect(calls).toBe(0);
  });

  it('reset() drops the partial step', () => {
    let calls = 0;
    const loop = new FixedStepLoop(() => calls++, { stepMs: 10 });
    loop.advance(9);
    loop.reset();
    loop.advance(9);
    expect(calls).toBe(0);
  });

  it('rejects a non-positive step size', () => {
    expect(() => new FixedStepLoop(() => {}, { stepMs: 0 })).toThrow(RangeError);
  });
});

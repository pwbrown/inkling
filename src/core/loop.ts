/**
 * Fixed-timestep game loop (REQUIREMENTS §7).
 *
 * Game logic always advances in identical `stepMs` increments, no matter the
 * display's frame rate. The renderer uses the returned `alpha` (0..1) to
 * interpolate between the previous and current simulation states, so motion
 * stays smooth on 60 Hz, 120 Hz or uneven frame times.
 */
export interface FixedStepOptions {
  /** Simulation step in milliseconds. 1000 / 60 by default. */
  stepMs: number;
  /**
   * Longest frame time accepted, in milliseconds. Larger gaps (tab switched
   * away, debugger pause) are clamped so the game doesn't fast-forward or
   * get stuck in a "spiral of death" catching up.
   */
  maxFrameMs: number;
}

export const DEFAULT_LOOP_OPTIONS: FixedStepOptions = {
  stepMs: 1000 / 60,
  maxFrameMs: 250,
};

export class FixedStepLoop {
  private accumulator = 0;
  private readonly options: FixedStepOptions;

  constructor(
    private readonly update: (stepMs: number) => void,
    options: Partial<FixedStepOptions> = {},
  ) {
    this.options = { ...DEFAULT_LOOP_OPTIONS, ...options };
    if (!(this.options.stepMs > 0)) {
      throw new RangeError('stepMs must be greater than 0');
    }
  }

  /**
   * Feed in the real time since the last frame. Runs as many fixed updates
   * as fit and returns the interpolation alpha for rendering.
   */
  advance(frameMs: number): number {
    const { stepMs, maxFrameMs } = this.options;
    const elapsed = Number.isFinite(frameMs) ? Math.min(Math.max(frameMs, 0), maxFrameMs) : 0;
    this.accumulator += elapsed;

    while (this.accumulator >= stepMs) {
      this.update(stepMs);
      this.accumulator -= stepMs;
    }

    return this.accumulator / stepMs;
  }

  /** Drop any partial step, e.g. when resuming from pause. */
  reset(): void {
    this.accumulator = 0;
  }
}

/**
 * Aiming for the Nib's ink shots. A creature keeps crawling while the ink is
 * in flight, so the Nib "leads" it: it fires at where the letter will be when
 * the ink arrives, not where it is now.
 *
 * Shot from S at speed s; the letter starts at P and moves at velocity v.
 * They meet after time t where |P + v·t − S| = s·t. With d = P − S:
 *
 *   (v·v − s²)·t² + 2(d·v)·t + d·d = 0
 *
 * The smallest positive root is the earliest meeting point. If there's none
 * (the letter outruns the ink, which can't happen at our speeds), fall back
 * to aiming straight at P.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Aim extends Point {
  /** Flight time in seconds. */
  t: number;
}

export function intercept(from: Point, target: Point, vx: number, vy: number, speed: number): Aim {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const a = vx * vx + vy * vy - speed * speed;
  const b = 2 * (dx * vx + dy * vy);
  const c = dx * dx + dy * dy;

  let t: number;
  if (Math.abs(a) < 1e-9) {
    // Equal speeds: the equation is linear.
    t = b !== 0 ? -c / b : Number.NaN;
  } else {
    const disc = b * b - 4 * a * c;
    if (disc < 0) {
      t = Number.NaN;
    } else {
      const root = Math.sqrt(disc);
      const roots = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter((r) => r > 0);
      t = roots.length ? Math.min(...roots) : Number.NaN;
    }
  }
  if (!Number.isFinite(t) || t <= 0) return { x: target.x, y: target.y, t: Math.hypot(dx, dy) / speed };
  return { x: target.x + vx * t, y: target.y + vy * t, t };
}

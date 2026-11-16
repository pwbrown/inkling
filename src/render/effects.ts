/**
 * Short-lived visual effects: ink splatters, smudges and score pop-ups.
 * Smudges (from mistakes) and margin stains stay until the page turns, as a
 * gentle record of how messy the page got (DESIGN §5).
 */
import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, DISPLAY_FONT, DISPLAY_PADDING, TEXT_FONT } from './theme';
import { outBack, outCubic } from './tween';

interface Particle {
  node: Graphics | Text;
  vx: number;
  vy: number;
  gravity: number;
  lifeMs: number;
  maxLifeMs: number;
  /** Scale at the start and end of its life (droplets shrink, rings grow). */
  scaleFrom: number;
  scaleTo: number;
  /** Pops in with an overshoot over this long (labels and banners). */
  popMs: number;
  /** Fraction of its life it stays fully visible before fading. */
  hold: number;
  /** Radians per second. */
  spin: number;
  /** Flies to this point instead of using velocity, then calls `onArrive`. */
  to?: { x: number; y: number; fromX: number; fromY: number; onArrive?: () => void };
}

type ParticleOptions = Partial<Pick<Particle, 'vx' | 'vy' | 'gravity' | 'scaleFrom' | 'scaleTo' | 'popMs' | 'hold' | 'spin' | 'to'>>;

const MAX_STAINS = 80;

export class Effects {
  /** Persistent marks, drawn under the targets. */
  readonly stainLayer = new Container();
  /** Moving particles, drawn over the targets. */
  readonly particleLayer = new Container();
  private particles: Particle[] = [];

  constructor(
    private readonly reducedMotion: boolean,
    /** Color of destroy splatters (an unlockable cosmetic). */
    private readonly splatterColor: number = COLORS.ink,
  ) {}

  /** Burst of ink droplets when a target is destroyed: round drops that shrink as they fly. */
  splatter(x: number, y: number, count = 9, color: number = this.splatterColor): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.reducedMotion ? 0 : 90 + Math.random() * 220;
      const r = 2.5 + Math.random() * 4.5;
      // Fast drops stretch into streaks along their path.
      const stretch = this.reducedMotion ? 1 : 1 + speed / 260;
      const dot = new Graphics().ellipse(0, 0, r * stretch, r).fill(color);
      dot.rotation = angle;
      dot.position.set(x + (this.reducedMotion ? Math.cos(angle) * 14 : 0), y + (this.reducedMotion ? Math.sin(angle) * 14 : 0));
      this.add(dot, 380 + Math.random() * 200, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (this.reducedMotion ? 0 : 60),
        gravity: 420,
        scaleTo: 0.35,
      });
    }
  }

  /**
   * An expanding ring, for impacts and pickups. `hold` is the share of its
   * life it stays fully visible before fading (for rings meant to be noticed).
   */
  ring(x: number, y: number, color: number = this.splatterColor, radius = 26, lifeMs = 320, hold = 0): void {
    const g = new Graphics().circle(0, 0, radius).stroke({ width: 3, color });
    g.position.set(x, y);
    this.add(g, lifeMs, { scaleFrom: this.reducedMotion ? 1 : 0.25, scaleTo: 1, hold });
  }

  /** A red-pen cross where a wrong key landed. */
  cross(x: number, y: number, size = 11): void {
    const g = new Graphics()
      .moveTo(-size, -size)
      .lineTo(size, size)
      .moveTo(size, -size)
      .lineTo(-size, size)
      .stroke({ width: 4, color: COLORS.margin, cap: 'round' });
    g.position.set(x, y);
    g.rotation = (Math.random() - 0.5) * 0.4;
    this.add(g, 520, { popMs: 140, hold: 0.45 });
  }

  /** Big centered announcement, e.g. "The Spill!", that pops in, rises and fades. */
  banner(x: number, y: number, label: string, color: number = COLORS.margin): void {
    const text = new Text({
      text: label,
      style: { fontFamily: DISPLAY_FONT, padding: DISPLAY_PADDING, fontSize: 66, fontWeight: '700', fill: color },
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    text.rotation = -0.04;
    this.add(text, 1600, { vy: this.reducedMotion ? 0 : -18, popMs: 260, hold: 0.6 });
  }

  /** The Blotter: a sweep of ink splashes across the whole page. */
  blotterWave(width: number, height: number): void {
    const count = this.reducedMotion ? 10 : 28;
    for (let i = 0; i < count; i++) {
      this.splatter(160 + Math.random() * (width - 200), 80 + Math.random() * (height - 140), 4);
    }
  }

  /** Floating label such as "+25": pops in, drifts up and fades. */
  popup(x: number, y: number, label: string, options: { color?: number; size?: number } = {}): void {
    const text = new Text({
      text: label,
      style: { fontFamily: TEXT_FONT, fontSize: options.size ?? 18, fontWeight: '700', fill: options.color ?? COLORS.inkLight },
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    this.add(text, 800, { vy: this.reducedMotion ? 0 : -46, popMs: 160, hold: 0.4 });
  }

  /** A drop that flies to a point (e.g. the ink bar), then calls `onArrive`. */
  flyTo(fromX: number, fromY: number, toX: number, toY: number, color: number, onArrive?: () => void, lifeMs = 520): void {
    if (this.reducedMotion) {
      onArrive?.();
      return;
    }
    const drop = new Graphics().circle(0, 0, 6).fill(color);
    drop.position.set(fromX, fromY);
    this.add(drop, lifeMs, { hold: 1, to: { x: toX, y: toY, fromX, fromY, ...(onArrive ? { onArrive } : {}) } });
  }

  /** A band of color that sweeps across the page (the Highlighter). */
  sweep(width: number, height: number, color: number): void {
    const band = new Graphics().rect(-90, 0, 180, height).fill({ color, alpha: 0.5 });
    band.skew.set(-0.25, 0);
    band.position.set(this.reducedMotion ? width / 2 : -100, 0);
    this.add(band, 520, { vx: this.reducedMotion ? 0 : (width + 300) / 0.52, hold: 0.7 });
  }

  /** A sheet of blotting paper slapped down where a creature was soaked up. */
  sheet(x: number, y: number): void {
    const g = new Graphics()
      .roundRect(-34, -44, 68, 88, 4)
      .fill(COLORS.paper)
      .stroke({ width: 2, color: COLORS.inkFaded })
      .circle(-4, 6, 16)
      .circle(10, -8, 9)
      .fill({ color: COLORS.ink, alpha: 0.55 });
    g.position.set(x, y);
    g.rotation = -0.12;
    this.add(g, 900, { popMs: 200, hold: 0.6 });
  }

  /** Eraser crumbs: a little puff of rubbings where a slip was rubbed out. */
  crumbs(x: number, y: number): void {
    this.splatter(x, y, 7, 0xe7a3ad);
    this.ring(x, y, 0xe7a3ad, 20, 300);
  }

  /** The letter just typed jumps off the creature and fades, like a fresh pen mark. */
  letterPop(x: number, y: number, char: string, size: number): void {
    if (char.trim() === '') return;
    const text = new Text({ text: char, style: { fontFamily: TEXT_FONT, fontSize: size, fontWeight: '700', fill: this.splatterColor } });
    text.anchor.set(0.5);
    text.position.set(x, y);
    this.add(text, 380, { vy: this.reducedMotion ? 0 : -70, scaleFrom: 1, scaleTo: this.reducedMotion ? 1 : 1.6 });
  }

  /** A Drip's end: it pops with a flick of ink thrown up and back (DESIGN §5). */
  flick(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = -Math.PI / 2 + 0.2 + (Math.random() - 0.3) * 1.3;
      const speed = this.reducedMotion ? 0 : 220 + Math.random() * 200;
      const r = 2 + Math.random() * 3.5;
      const drop = new Graphics().ellipse(0, 0, r * 2.2, r).fill(this.splatterColor);
      drop.rotation = angle;
      drop.position.set(x, y);
      this.add(drop, 520, { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, gravity: 900, scaleTo: 0.4, spin: (Math.random() - 0.5) * 6 });
    }
  }

  /** A Scrawler's end: it is blotted up, a puddle soaking into the page and leaving a faint mark. */
  blotUp(x: number, y: number, width: number): void {
    const puddle = new Graphics();
    for (let i = 0; i < 5; i++) puddle.circle((i / 4 - 0.5) * width * 0.7, (Math.random() - 0.5) * 10, 12 + Math.random() * 9);
    puddle.fill(this.splatterColor);
    puddle.position.set(x, y);
    this.add(puddle, 360, { scaleFrom: 1.1, scaleTo: this.reducedMotion ? 1 : 0.15, hold: 0.2 });
    const mark = new Graphics().ellipse(0, 0, width * 0.35, 9).fill({ color: this.splatterColor, alpha: 0.12 });
    mark.position.set(x, y + 6);
    this.addStain(mark);
  }

  /** A faint mistake smudge that stays on the page. */
  smudge(x: number, y: number): void {
    const g = new Graphics()
      .ellipse(0, 0, 10 + Math.random() * 8, 5 + Math.random() * 4)
      .fill({ color: COLORS.pencil, alpha: 0.18 });
    g.position.set(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 16);
    g.rotation = Math.random() * Math.PI;
    this.addStain(g);
  }

  /** A blot where a target hit the margin. */
  marginStain(x: number, y: number): void {
    const g = new Graphics();
    for (let i = 0; i < 4; i++) {
      g.circle((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 22, 6 + Math.random() * 9);
    }
    g.fill({ color: COLORS.ink, alpha: 0.55 });
    g.position.set(x, y);
    this.addStain(g);
    this.splatter(x, y, 10);
    this.ring(x, y, COLORS.margin, 44, 420);
  }

  clearStains(): void {
    for (const child of this.stainLayer.removeChildren()) child.destroy();
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;
    // Callbacks run after the sweep: they may add particles (a ring where a
    // drop lands), and anything pushed onto the old array mid-filter would be
    // dropped from the list and left on screen forever.
    const arrived: Array<() => void> = [];
    this.particles = this.particles.filter((p) => {
      p.lifeMs += dtMs;
      const t = Math.min(1, p.lifeMs / p.maxLifeMs);
      if (p.to) {
        // Arc toward the goal, speeding up as it goes.
        const k = t * t;
        p.node.x = p.to.fromX + (p.to.x - p.to.fromX) * k;
        p.node.y = p.to.fromY + (p.to.y - p.to.fromY) * k - Math.sin(t * Math.PI) * 40;
      } else {
        p.vy += p.gravity * dt;
        p.node.x += p.vx * dt;
        p.node.y += p.vy * dt;
      }
      if (p.lifeMs >= p.maxLifeMs) {
        if (p.to?.onArrive) arrived.push(p.to.onArrive);
        p.node.destroy();
        return false;
      }
      p.node.rotation += p.spin * dt;
      const grow = p.scaleFrom + (p.scaleTo - p.scaleFrom) * outCubic(t);
      const pop = p.popMs > 0 && !this.reducedMotion ? outBack(Math.min(1, p.lifeMs / p.popMs)) : 1;
      p.node.scale.set(grow * pop);
      p.node.alpha = t <= p.hold ? 1 : 1 - (t - p.hold) / (1 - p.hold || 1);
      return true;
    });
    for (const callback of arrived) callback();
  }

  private add(node: Graphics | Text, maxLifeMs: number, options: ParticleOptions = {}): void {
    this.particleLayer.addChild(node);
    this.particles.push({
      node,
      vx: 0,
      vy: 0,
      scaleFrom: 1,
      scaleTo: 1,
      popMs: 0,
      hold: 0,
      spin: 0,
      lifeMs: 0,
      maxLifeMs,
      ...options,
      gravity: this.reducedMotion ? 0 : (options.gravity ?? 0),
    });
  }

  private addStain(node: Graphics): void {
    this.stainLayer.addChild(node);
    while (this.stainLayer.children.length > MAX_STAINS) this.stainLayer.children[0]?.destroy();
  }
}

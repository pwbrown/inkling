/**
 * Short-lived visual effects: ink splatters, smudges and score pop-ups.
 * Smudges (from mistakes) and margin stains stay until the page turns, as a
 * gentle record of how messy the page got (DESIGN §5).
 */
import { Container, Graphics, Text } from 'pixi.js';
import { COLORS, TEXT_FONT } from './theme';

interface Particle {
  node: Graphics | Text;
  vx: number;
  vy: number;
  gravity: number;
  lifeMs: number;
  maxLifeMs: number;
}

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

  /** Burst of ink droplets when a target is destroyed. */
  splatter(x: number, y: number, count = 9): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.reducedMotion ? 0 : 90 + Math.random() * 180;
      const dot = new Graphics().circle(0, 0, 2.5 + Math.random() * 4.5).fill(this.splatterColor);
      dot.position.set(x + (this.reducedMotion ? Math.cos(angle) * 14 : 0), y + (this.reducedMotion ? Math.sin(angle) * 14 : 0));
      this.add(dot, Math.cos(angle) * speed, Math.sin(angle) * speed - (this.reducedMotion ? 0 : 60), 420, 380 + Math.random() * 200);
    }
  }

  /** Big centered announcement, e.g. "The Spill!", that rises and fades. */
  banner(x: number, y: number, label: string, color: number = COLORS.margin): void {
    const text = new Text({
      text: label,
      style: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 54, fontStyle: 'italic', fontWeight: '700', fill: color },
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    this.add(text, 0, this.reducedMotion ? 0 : -25, 0, 1600);
  }

  /** The Blotter: a sweep of ink splashes across the whole page. */
  blotterWave(width: number, height: number): void {
    const count = this.reducedMotion ? 10 : 28;
    for (let i = 0; i < count; i++) {
      this.splatter(160 + Math.random() * (width - 200), 80 + Math.random() * (height - 140), 4);
    }
  }

  /** Floating "+points" label. */
  popup(x: number, y: number, label: string): void {
    const text = new Text({
      text: label,
      style: { fontFamily: TEXT_FONT, fontSize: 18, fontWeight: '700', fill: COLORS.inkLight },
    });
    text.anchor.set(0.5);
    text.position.set(x, y);
    this.add(text, 0, this.reducedMotion ? 0 : -50, 0, 700);
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
    this.splatter(x, y, 6);
  }

  clearStains(): void {
    for (const child of this.stainLayer.removeChildren()) child.destroy();
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;
    this.particles = this.particles.filter((p) => {
      p.lifeMs += dtMs;
      if (p.lifeMs >= p.maxLifeMs) {
        p.node.destroy();
        return false;
      }
      p.vy += p.gravity * dt;
      p.node.x += p.vx * dt;
      p.node.y += p.vy * dt;
      p.node.alpha = 1 - p.lifeMs / p.maxLifeMs;
      return true;
    });
  }

  private add(node: Graphics | Text, vx: number, vy: number, gravity: number, maxLifeMs: number): void {
    this.particleLayer.addChild(node);
    this.particles.push({ node, vx, vy, gravity: this.reducedMotion ? 0 : gravity, lifeMs: 0, maxLifeMs });
  }

  private addStain(node: Graphics): void {
    this.stainLayer.addChild(node);
    while (this.stainLayer.children.length > MAX_STAINS) this.stainLayer.children[0]?.destroy();
  }
}

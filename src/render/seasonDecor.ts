/**
 * Holiday page decor (core/seasons.ts): leaves or holly tucked into the
 * page's corners, and a few leaves or snowflakes drifting down behind the
 * creatures. Kept to the edges and faint, so text always reads first
 * (DESIGN pillar 4). Reduced motion keeps the corners and drops the falling.
 */
import { Container, Graphics } from 'pixi.js';
import { GAME_CONFIG } from '../core/config';
import { mulberry32 } from '../core/rng';
import type { SeasonId } from '../core/seasons';
import { MARGIN_X, WORLD_HEIGHT, WORLD_WIDTH } from '../core/world';
import { HOLIDAY, drawHolly, drawLeaf, drawSnowflake } from './holidayArt';

interface Faller {
  g: Graphics;
  x: number;
  y: number;
  speed: number;
  phase: number;
  spin: number;
}

export class SeasonDecor {
  readonly root = new Container();
  private readonly fallers: Faller[] = [];
  private timeMs = 0;

  constructor(season: SeasonId | null, reducedMotion: boolean) {
    if (!season) return;
    const cfg = GAME_CONFIG.seasons.decor;
    const rand = mulberry32(season === 'thanksgiving' ? 11 : 25);
    const corners = new Graphics();
    corners.alpha = cfg.alpha;
    this.root.addChild(corners);

    // Bottom corners only: the HUD owns the top, and the scribe sits by the margin.
    if (season === 'thanksgiving') {
      const pile = (x: number, y: number, dir: 1 | -1) => {
        for (let i = 0; i < 7; i++) {
          const color = HOLIDAY.leaves[i % HOLIDAY.leaves.length]!;
          drawLeaf(corners, x + dir * (i * 17 + rand() * 12), y - rand() * 26 - (i % 3) * 10, 16 + rand() * 9, color, (rand() - 0.5) * 2.4);
        }
      };
      pile(WORLD_WIDTH - 22, WORLD_HEIGHT - 10, -1);
      pile(WORLD_WIDTH - 10, WORLD_HEIGHT - 70, -1);
      // A few down the right edge, where creatures arrive from.
      for (let y = 150; y < WORLD_HEIGHT - 140; y += 130 + rand() * 40) {
        drawLeaf(corners, WORLD_WIDTH - 12 - rand() * 8, y, 13 + rand() * 5, HOLIDAY.leaves[Math.floor(rand() * 4)]!, -0.9 + rand() * 0.5);
      }
    } else {
      drawHolly(corners, WORLD_WIDTH - 48, WORLD_HEIGHT - 40, 34, -0.3);
      drawHolly(corners, WORLD_WIDTH - 120, WORLD_HEIGHT - 22, 26, 0.2);
      drawHolly(corners, WORLD_WIDTH - 24, WORLD_HEIGHT - 116, 24, -1.1);
      drawHolly(corners, WORLD_WIDTH - 180, WORLD_HEIGHT - 12, 18, 0.4);
      for (let y = 150; y < WORLD_HEIGHT - 150; y += 120 + rand() * 30) {
        drawSnowflake(corners, WORLD_WIDTH - 18 - rand() * 6, y, 7 + rand() * 4);
      }
    }

    if (reducedMotion) return;
    const count = season === 'thanksgiving' ? cfg.fallingLeaves : cfg.snowflakes;
    const [slow, fast] = cfg.fallSpeed;
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      if (season === 'thanksgiving') drawLeaf(g, 0, 0, 11 + rand() * 6, HOLIDAY.leaves[i % 4]!, 0);
      else drawSnowflake(g, 0, 0, 3 + rand() * 4);
      g.alpha = cfg.fallingAlpha;
      const faller: Faller = {
        g,
        x: MARGIN_X + rand() * (WORLD_WIDTH - MARGIN_X),
        y: rand() * WORLD_HEIGHT,
        speed: slow! + rand() * (fast! - slow!) * (season === 'thanksgiving' ? 1 : 0.7),
        phase: rand() * Math.PI * 2,
        spin: (rand() - 0.5) * 1.2,
      };
      this.fallers.push(faller);
      this.root.addChild(g);
    }
    this.update(0);
  }

  update(frameMs: number): void {
    if (this.fallers.length === 0) return;
    this.timeMs += frameMs;
    const sway = GAME_CONFIG.seasons.decor.sway;
    for (const f of this.fallers) {
      f.y += (f.speed * frameMs) / 1000;
      if (f.y > WORLD_HEIGHT + 20) {
        f.y = -20;
        f.x = MARGIN_X + Math.random() * (WORLD_WIDTH - MARGIN_X);
      }
      f.g.position.set(f.x + Math.sin(this.timeMs / 900 + f.phase) * sway, f.y);
      f.g.rotation = Math.sin(this.timeMs / 1300 + f.phase) * f.spin;
    }
  }
}

/**
 * Drip (DESIGN §5): a plump ink droplet carrying one character, with big eyes.
 * It bobs and squashes as it travels, its tail trailing behind.
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Target } from '../../core/world';
import { COLORS, glyph } from '../theme';
import { MoodTracker, applyGhost, bodyColor, drawFace, drawPips, labelStyle, wave, type CreatureView, type FrameContext } from './common';

export function createDrip(target: Target, scale: number): CreatureView {
  const r = 27 * scale;
  const width = r * 2 + 16 * scale;
  const height = r * 2;
  const root = new Container();
  const highlight = new Graphics().circle(r, 0, r + 9).fill({ color: COLORS.highlighter, alpha: 0.8 });
  const bob = new Container();
  const body = new Graphics();
  const face = new Graphics();
  const pips = new Graphics();
  const label = new Text({ text: glyph(target.text), style: labelStyle(COLORS.label, 24 * scale) });
  label.anchor.set(0.5);
  label.position.set(r, r * 0.08);
  bob.addChild(body, face, label);
  root.addChild(highlight, bob, pips);
  highlight.visible = false;

  const mood = new MoodTracker();
  const phase = Math.random() * Math.PI * 2;
  let shown = target.text;
  let drawnLives = 0;

  const view: CreatureView = {
    root,
    highlight,
    width,
    height,
    letterX: () => r,
    update(t: Target, ctx: FrameContext) {
      const { mood: m, blink, hurtMs } = mood.update(t, ctx);
      if (t.text !== shown) {
        shown = t.text;
        label.text = glyph(t.text);
      }

      // Squash and stretch as it bobs along; a shiver when it loses a life.
      const squash = 0.05 * wave(ctx, 0.009, phase);
      bob.pivot.set(r, 0);
      bob.position.set(r + (hurtMs > 0 ? Math.sin(hurtMs / 20) * 3 : 0), 3 * wave(ctx, 0.006, phase));
      bob.scale.set(1 + squash, 1 - squash);

      if (drawnLives !== t.lives) {
        drawnLives = t.lives;
        const color = bodyColor(t.lives);
        body
          .clear()
          .circle(r, 0, r)
          // Tail trailing to the right as it moves left.
          .poly([r + r * 0.55, -r * 0.83, width, -r * 0.05, r + r * 0.7, r * 0.7])
          .fill(color)
          .circle(r - r * 0.58, -r * 0.35, r * 0.13)
          .fill({ color: COLORS.label, alpha: 0.3 });
        pips.clear();
        drawPips(pips, r - 6 * scale * (t.lives - 1), -r - 16 * scale, t.lives, scale);
      }

      face.clear();
      // Eyes peek over the top, leaving the character clear.
      drawFace(face, r - r * 0.1, -r * 0.92, r * 0.2, m, blink, ctx.lookX, ctx.lookY, bodyColor(t.lives));
      highlight.visible = ctx.locked;
      applyGhost(t, root, [label], ctx.timeMs, ctx.reducedMotion);
    },
  };
  view.update(target, { timeMs: 0, dtMs: 0, locked: false, lookX: -500, lookY: 0, reducedMotion: true });
  return view;
}

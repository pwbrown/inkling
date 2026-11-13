/**
 * Blotling (DESIGN §5): a wobbly ink blot carrying a word, with eyes peeking
 * over its top edge and little legs scurrying underneath.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Target } from '../../core/world';
import { COLORS } from '../theme';
import {
  MoodTracker,
  applyGhost,
  bodyColor,
  drawFace,
  drawPips,
  labelStyle,
  measure,
  wave,
  type CreatureView,
  type FrameContext,
} from './common';

export function createBlotling(target: Target, scale: number): CreatureView {
  const height = 46 * scale;
  const padX = 20 * scale;
  const fontSize = 26 * scale;
  const typedStyle = new TextStyle(labelStyle(COLORS.inkFaded, fontSize));
  const restStyle = new TextStyle(labelStyle(COLORS.label, fontSize));

  const root = new Container();
  const highlight = new Graphics();
  const legs = new Graphics();
  const body = new Graphics();
  const face = new Graphics();
  const pips = new Graphics();
  const typedLabel = new Text({ text: '', style: typedStyle });
  const restLabel = new Text({ text: target.text, style: restStyle });
  for (const label of [typedLabel, restLabel]) label.anchor.set(0, 0.5);
  root.addChild(highlight, legs, body, typedLabel, restLabel, face, pips);
  highlight.visible = false;

  const mood = new MoodTracker();
  const phase = Math.random() * Math.PI * 2;
  let width = 0;
  let shownText = '';
  let shownTyped = -1;

  const view: CreatureView = {
    root,
    highlight,
    width: 0,
    height,
    update(t: Target, ctx: FrameContext) {
      const { mood: m, blink, hurtMs } = mood.update(t, ctx);

      if (t.text !== shownText || t.typed !== shownTyped) {
        if (t.text !== shownText) {
          shownText = t.text;
          width = measure(t.text, restStyle) + padX * 2;
          view.width = width;
          highlight
            .clear()
            .roundRect(-8, -height / 2 - 14, width + 16, height + 22, (height + 22) / 2)
            .fill({ color: COLORS.highlighter, alpha: 0.8 });
        }
        shownTyped = t.typed;
        const typed = t.text.slice(0, t.typed);
        typedLabel.text = typed;
        restLabel.text = t.text.slice(t.typed);
        typedLabel.x = padX;
        restLabel.x = padX + (typed ? measure(typed, typedStyle) : 0);
        pips.clear();
        drawPips(pips, width - 8 * scale * t.lives, -height / 2 - 10 * scale, t.lives, scale);
      }

      // Wobbly body: a rounded blob with bumps that rise and fall.
      const color = bodyColor(t.lives);
      const shake = hurtMs > 0 ? Math.sin(hurtMs / 18) * 3 : 0;
      body.clear().roundRect(shake, -height / 2, width, height, height / 2).fill(color);
      const bumps = Math.max(2, Math.round(width / (36 * scale)));
      for (let i = 0; i < bumps; i++) {
        const bx = shake + ((i + 0.5) / bumps) * width;
        const lift = 2 * scale * wave(ctx, 0.005, phase + i * 1.7);
        body.circle(bx, -height / 2 + 4 * scale + lift, height * 0.24).fill(color);
        if (i % 2 === 0) body.circle(bx + 9 * scale, height / 2 - 4 * scale - lift, height * 0.18).fill(color);
      }
      // A drip hanging off the back.
      body.circle(width + shake - 2 * scale, height * 0.15, 5 * scale).fill(color);

      // Legs scurry: alternate pairs lift in turn.
      legs.clear();
      const legCount = Math.max(3, Math.round(width / (28 * scale)));
      for (let i = 0; i < legCount; i++) {
        const lx = shake + ((i + 0.5) / legCount) * width;
        const step = 3 * scale * wave(ctx, 0.016, i * Math.PI);
        legs.ellipse(lx + step, height / 2 + 3 * scale - Math.abs(step) * 0.6, 4.5 * scale, 3.2 * scale).fill(COLORS.inkLight);
      }

      // Eyes peek over the front (left) of the body, toward where it's heading.
      face.clear();
      const eyeR = 7 * scale;
      drawFace(face, shake + padX + eyeR * 0.6, -height / 2 - 3 * scale, eyeR, m, blink, ctx.lookX, ctx.lookY, color);
      highlight.visible = ctx.locked;
      applyGhost(t, root, [typedLabel, restLabel], ctx.timeMs, ctx.reducedMotion);
    },
  };
  view.update(target, { timeMs: 0, dtMs: 0, locked: false, lookX: -500, lookY: 0, reducedMotion: true });
  return view;
}

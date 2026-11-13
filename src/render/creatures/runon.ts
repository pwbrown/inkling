/**
 * Run-on (DESIGN §5): an inky centipede carrying a phrase. Its round body
 * segments ripple as it crawls; its head leads with eyes and antennae.
 * Typed text greys out; mistakes show in red, struck through, until they're
 * erased with Backspace; a caret marks where the next character goes.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Target } from '../../core/world';
import { COLORS } from '../theme';
import { MoodTracker, labelStyle, measure, drawFace, wave, type CreatureView, type FrameContext } from './common';

export function createRunon(target: Target, scale: number): CreatureView {
  const height = 46 * scale;
  const padX = 18 * scale;
  const fontSize = 24 * scale;
  const headR = height * 0.52;
  const styles = {
    ok: new TextStyle(labelStyle(COLORS.inkFaded, fontSize)),
    bad: new TextStyle(labelStyle(COLORS.margin, fontSize)),
    rest: new TextStyle(labelStyle(COLORS.label, fontSize)),
  };

  const root = new Container();
  const highlight = new Graphics();
  const legs = new Graphics();
  const body = new Graphics();
  const head = new Graphics();
  const marks = new Graphics();
  const ok = new Text({ text: '', style: styles.ok });
  const bad = new Text({ text: '', style: styles.bad });
  const rest = new Text({ text: '', style: styles.rest });
  for (const t of [ok, bad, rest]) t.anchor.set(0, 0.5);
  root.addChild(highlight, legs, body, head, ok, bad, rest, marks);
  highlight.visible = false;

  const mood = new MoodTracker();
  let width = 0;
  let shown: string | null = null;

  const view: CreatureView = {
    root,
    highlight,
    width: 0,
    height,
    update(t: Target, ctx: FrameContext) {
      const { mood: m, blink } = mood.update(t, ctx);
      const buffer = t.buffer ?? '';

      if (buffer !== shown) {
        shown = buffer;
        const chars = [...t.text];
        const okText = chars.slice(0, t.typed).join('');
        const badText = [...buffer].slice(t.typed).join('');
        const restText = chars.slice(t.typed).join('');
        ok.text = okText;
        bad.text = badText;
        rest.text = restText;
        ok.x = padX;
        bad.x = ok.x + measure(okText, styles.ok);
        rest.x = bad.x + measure(badText, styles.bad) + (badText ? 6 * scale : 0);
        width = rest.x + measure(restText, styles.rest) + padX;
        view.width = width;
        highlight
          .clear()
          .roundRect(-headR - 10, -height / 2 - 12, width + headR + 20, height + 24, (height + 24) / 2)
          .fill({ color: COLORS.highlighter, alpha: 0.8 });

        // Strike through mistakes (a shape, not just color) and draw the caret.
        marks.clear();
        if (badText) {
          marks.moveTo(bad.x, 1).lineTo(bad.x + measure(badText, styles.bad), 1).stroke({ width: 2.5 * scale, color: COLORS.margin });
        }
        const caretX = rest.x - (badText ? 3 * scale : 0);
        marks.moveTo(caretX, -fontSize * 0.55).lineTo(caretX, fontSize * 0.55).stroke({ width: 2, color: COLORS.highlighter });
      }

      // Segments ripple like a crawling centipede.
      const segments = Math.max(3, Math.round(width / (30 * scale)));
      const segW = width / segments;
      body.clear().roundRect(0, -height / 2 + 4 * scale, width, height - 8 * scale, (height - 8 * scale) / 2).fill(COLORS.ink);
      legs.clear();
      for (let i = 0; i < segments; i++) {
        const cx = (i + 0.5) * segW;
        const ripple = 3 * scale * wave(ctx, 0.008, i * 0.9);
        body.circle(cx, ripple * 0.5, height / 2).fill(COLORS.ink);
        // A pair of legs per segment, stepping in a wave down the body.
        const step = 4 * scale * wave(ctx, 0.014, i * 1.2);
        for (const side of [-1, 1]) {
          legs
            .moveTo(cx, side * height * 0.3)
            .lineTo(cx + step, side * (height / 2 + 7 * scale))
            .stroke({ width: 2.5 * scale, color: COLORS.inkLight, cap: 'round' });
        }
      }
      // A little pointed tail.
      body.poly([width - 4, -6 * scale, width + 12 * scale, 0, width - 4, 6 * scale]).fill(COLORS.ink);

      // The head leads, with antennae that sway.
      head.clear();
      const hx = -headR * 0.55;
      const sway = 4 * scale * wave(ctx, 0.006);
      for (const side of [-1, 1]) {
        head
          .moveTo(hx - headR * 0.2, -headR * 0.75)
          .quadraticCurveTo(hx - headR * 0.6 + side * 6 * scale, -headR * 1.5, hx - headR * 0.9 + side * 8 * scale + sway, -headR * 1.45)
          .stroke({ width: 2 * scale, color: COLORS.ink, cap: 'round' })
          .circle(hx - headR * 0.9 + side * 8 * scale + sway, -headR * 1.45, 3 * scale)
          .fill(COLORS.ink);
      }
      head.circle(hx, 0, headR).fill(COLORS.ink);
      drawFace(head, hx - headR * 0.1, -headR * 0.18, headR * 0.24, m, blink, ctx.lookX, ctx.lookY, COLORS.ink, {
        x: hx - headR * 0.1,
        y: headR * 0.38,
      });
      highlight.visible = ctx.locked;
    },
  };
  view.update(target, { timeMs: 0, dtMs: 0, locked: false, lookX: -500, lookY: 0, reducedMotion: true });
  return view;
}

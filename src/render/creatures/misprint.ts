/**
 * Misprint (DESIGN §5): a crooked rubber stamp that hops along, with eyes on
 * its handle. Its word has a typo to fix in place; the correct spelling is
 * pencilled underneath, and the stamp straightens as the word gets closer.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { editDistance } from '../../core/editing';
import type { Target } from '../../core/world';
import { COLORS, MONO_FONT } from '../theme';
import { MoodTracker, drawFace, labelStyle, measure, type CreatureView, type FrameContext } from './common';

export function createMisprint(target: Target, scale: number): CreatureView {
  const height = 46 * scale;
  const padX = 18 * scale;
  const fontSize = 26 * scale;
  const style = new TextStyle({ ...labelStyle(COLORS.ink, fontSize), fontFamily: MONO_FONT });

  const root = new Container();
  const stamp = new Container();
  const highlight = new Graphics();
  const handle = new Graphics();
  const body = new Graphics();
  const caret = new Graphics();
  const face = new Graphics();
  const label = new Text({ text: '', style });
  label.anchor.set(0, 0.5);
  const hint = new Text({ text: target.text, style: labelStyle(COLORS.pencil, 15 * scale) });
  hint.anchor.set(0, 0);
  stamp.addChild(highlight, handle, body, label, caret, face);
  root.addChild(stamp, hint);
  highlight.visible = false;

  const mood = new MoodTracker();
  const phase = Math.random() * Math.PI * 2;
  let width = 0;
  let shown = '';

  const view: CreatureView = {
    root,
    highlight,
    width: 0,
    height,
    update(t: Target, ctx: FrameContext) {
      const { mood: m, blink } = mood.update(t, ctx);
      const buffer = t.buffer ?? '';
      const key = `${buffer}|${t.cursor}`;
      const knobW = 26 * scale;
      const knobH = 22 * scale;

      if (key !== shown) {
        shown = key;
        label.text = buffer;
        label.x = padX;
        width = Math.max(measure(buffer, style), measure(t.text, style)) + padX * 2;
        view.width = width;
        stamp.pivot.set(width / 2, 0);
        stamp.x = width / 2;
        stamp.rotation = -0.07 * Math.min(1, editDistance(buffer, t.text) / 2);
        hint.position.set(padX, height / 2 + 4 * scale);

        body
          .clear()
          .roundRect(0, -height / 2, width, height, 6)
          .fill(COLORS.paper)
          .stroke({ width: 3, color: COLORS.margin })
          .roundRect(4, -height / 2 + 4, width - 8, height - 8, 4)
          .stroke({ width: 1, color: COLORS.margin });
        // Wooden handle with a round knob on top.
        handle
          .clear()
          .roundRect(width / 2 - knobW * 0.35, -height / 2 - knobH * 0.9, knobW * 0.7, knobH, 4)
          .fill(COLORS.ink)
          .circle(width / 2, -height / 2 - knobH, knobW * 0.62)
          .fill(COLORS.ink);
        highlight
          .clear()
          .roundRect(-8, -height / 2 - knobH * 1.7, width + 16, height + knobH * 1.7 + 8, 12)
          .fill({ color: COLORS.highlighter, alpha: 0.8 });

        const caretX = padX + measure([...buffer].slice(0, t.cursor ?? 0).join(''), style);
        caret.clear().moveTo(caretX, -fontSize * 0.6).lineTo(caretX, fontSize * 0.6).stroke({ width: 2.5, color: COLORS.margin });
      }

      // Hop along; a stamp only touches down now and then.
      stamp.y = ctx.reducedMotion ? 0 : -Math.abs(Math.sin(ctx.timeMs * 0.005 + phase)) * 6 * scale;
      face.clear();
      drawFace(face, width / 2, -height / 2 - knobH, knobW * 0.2, m, blink, ctx.lookX, ctx.lookY, COLORS.ink);
      highlight.visible = ctx.locked;
    },
  };
  view.update(target, { timeMs: 0, dtMs: 0, locked: false, lookX: -500, lookY: 0, reducedMotion: true });
  return view;
}

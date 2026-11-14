/**
 * Ink bottle: a friendly bottle of fresh ink that rolls across the page when
 * the well is low. Its word is written on its paper label; type it to drink
 * the ink. Unlike the creatures, it costs nothing if it gets away.
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Target } from '../../core/world';
import { COLORS, glyph } from '../theme';
import { MoodTracker, drawFace, labelStyle, letterCenter, measure, wave, WORD_LETTER_SPACING, type CreatureView, type FrameContext } from './common';

export function createBottle(target: Target, scale: number): CreatureView {
  const height = 54 * scale;
  const padX = 16 * scale;
  const fontSize = 24 * scale;
  const typedStyle = new TextStyle(labelStyle(COLORS.inkFaded, fontSize, WORD_LETTER_SPACING));
  const restStyle = new TextStyle(labelStyle(COLORS.ink, fontSize, WORD_LETTER_SPACING));
  const shown = (text: string) => [...text].map(glyph).join('');

  const root = new Container();
  const highlight = new Graphics();
  const bob = new Container();
  const body = new Graphics();
  const face = new Graphics();
  const typedLabel = new Text({ text: '', style: typedStyle });
  const restLabel = new Text({ text: shown(target.text), style: restStyle });
  for (const label of [typedLabel, restLabel]) label.anchor.set(0, 0.5);
  bob.addChild(body, typedLabel, restLabel, face);
  root.addChild(highlight, bob);
  highlight.visible = false;

  const mood = new MoodTracker();
  const phase = Math.random() * Math.PI * 2;
  const width = Math.max(64 * scale, measure(shown(target.text), restStyle) + padX * 2);
  const neckW = 22 * scale;
  const neckH = 14 * scale;
  const top = -height / 2;

  highlight.roundRect(-8, top - neckH - 12, width + 16, height + neckH + 22, 16).fill({ color: COLORS.highlighter, alpha: 0.8 });
  // Glass body full of ink, a neck and a cork, with a paper label for the word.
  body
    .roundRect(0, top, width, height, 12 * scale)
    .fill(COLORS.ink)
    .rect(width / 2 - neckW / 2, top - neckH + 2, neckW, neckH)
    .fill(COLORS.ink)
    .roundRect(width / 2 - neckW / 2 - 3 * scale, top - neckH - 7 * scale, neckW + 6 * scale, 9 * scale, 3 * scale)
    .fill(COLORS.highlighter)
    .roundRect(5 * scale, -fontSize * 0.7, width - 10 * scale, fontSize * 1.4, 5 * scale)
    .fill(COLORS.paper)
    // A glint on the glass.
    .roundRect(6 * scale, top + 5 * scale, 5 * scale, 9 * scale, 2.5 * scale)
    .fill({ color: COLORS.label, alpha: 0.35 });

  let shownTyped = -1;

  const view: CreatureView = {
    root,
    highlight,
    width,
    height,
    letterX: (index) => letterCenter(shown(target.text), index, padX, restStyle),
    update(t: Target, ctx: FrameContext) {
      const { blink } = mood.update(t, ctx);
      if (t.typed !== shownTyped) {
        shownTyped = t.typed;
        const chars = [...t.text];
        const typed = chars.slice(0, t.typed).map(glyph).join('');
        typedLabel.text = typed;
        restLabel.text = chars.slice(t.typed).map(glyph).join('');
        const total = measure(shown(t.text), restStyle);
        typedLabel.x = (width - total) / 2;
        restLabel.x = typedLabel.x + (typed ? measure(typed, typedStyle) : 0);
      }
      // It rocks from side to side as it rolls along, sloshing.
      bob.pivot.set(width / 2, height / 2);
      bob.position.set(width / 2, height / 2 + 2 * wave(ctx, 0.007, phase));
      bob.rotation = 0.07 * wave(ctx, 0.005, phase);

      // A cheerful face on the shoulder of the bottle, above the label.
      face.clear();
      const eyeR = 4.2 * scale;
      drawFace(face, width / 2, top + 8 * scale, eyeR, ctx.defeated ? 'happy' : 'calm', blink, ctx.lookX, ctx.lookY, COLORS.ink);
      highlight.visible = ctx.locked;
    },
  };
  view.update(target, { timeMs: 0, dtMs: 0, locked: false, lookX: -500, lookY: 0, reducedMotion: true });
  return view;
}

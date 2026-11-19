/**
 * The scribe: a little ink drop with a quill (the player's badge shape, point
 * up, so it never looks like a sideways Drip). It sits below the last lane,
 * writes the page heading at the start of each page, and scribbles whenever
 * the manuscript grows.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { GAME_CONFIG } from '../core/config';
import type { SeasonId } from '../core/seasons';
import { drawFace, type Mood } from './creatures/common';
import { drawPilgrimHat, drawSantaHat } from './holidayArt';
import { COLORS, DISPLAY_FONT, DISPLAY_PADDING } from './theme';
import { outCubic } from './tween';

/** Body radius; the drop is about 2.4× this tall. */
const R = 11;

export class Scribe {
  readonly root = new Container();
  private readonly body = new Graphics();
  private readonly face = new Graphics();
  private readonly quill = new Graphics();
  /** A holiday hat on the drop's tip. */
  private readonly hat = new Graphics();
  private readonly heading: Text;
  private readonly headingMask = new Graphics();
  private headingMs = 0;
  private timeMs = 0;
  private writingMs = 0;
  private winceMs = 0;
  private cheerMs = 0;
  /** The drop and its quill, which hop and shake together; the heading stays put. */
  private readonly figure = new Container();

  /** `x`, `y`: where the scribe sits (bottom of the drop). */
  constructor(x: number, y: number) {
    this.root.position.set(x, y);
    // The drop, point up, like the player's badge.
    // Straight sides from the tip meet the round bottom where they touch it.
    const side = Math.acos(1 / 1.6);
    this.body
      .moveTo(0, -R * 2.6)
      .lineTo(R * Math.cos(-Math.PI / 2 - side), -R + R * Math.sin(-Math.PI / 2 - side))
      .arc(0, -R, R, -Math.PI / 2 - side, -Math.PI / 2 + side, true)
      .closePath()
      .fill(COLORS.inkLight);
    this.body.circle(-R * 0.45, -R * 1.45, R * 0.18).fill({ color: COLORS.label, alpha: 0.5 });
    // A quill held out to the right, tip on the line.
    this.quill.poly([0, 0, 4, -6, 16, -24, 20, -30, 13, -22, 2, -4]).fill(COLORS.inkFaded);
    this.quill.moveTo(0, 0).lineTo(17, -27).stroke({ width: 1.2, color: COLORS.ink });
    this.quill.position.set(R * 0.9, -2);
    this.heading = new Text({
      text: '',
      style: { fontFamily: DISPLAY_FONT, padding: DISPLAY_PADDING, fontSize: 26, fontWeight: '700', fill: COLORS.ink },
    });
    this.heading.anchor.set(0, 1);
    this.heading.position.set(R * 0.9 + 26, 4);
    this.heading.alpha = GAME_CONFIG.manuscript.headingAlpha;
    this.heading.mask = this.headingMask;
    this.figure.addChild(this.quill, this.body, this.face, this.hat);
    this.root.addChild(this.heading, this.headingMask, this.figure);
    this.drawFace('calm', false, false);
  }

  /** Dress up for a holiday season (or take the hat off). */
  setSeason(season: SeasonId | null): void {
    this.hat.clear();
    if (season === 'christmas') drawSantaHat(this.hat, 0, -R * 1.85, R * 1.6);
    else if (season === 'thanksgiving') drawPilgrimHat(this.hat, 0, -R * 1.9, R * 2.1);
  }

  /** Show or hide the scribe itself; its heading always shows. */
  showFigure(visible: boolean): void {
    this.figure.visible = visible;
    // Without the scribe, the heading sits where it was standing.
    this.heading.x = visible ? R * 0.9 + 26 : -R;
  }

  /** A creature got through: wince. */
  wince(): void {
    this.winceMs = GAME_CONFIG.manuscript.winceMs;
    this.cheerMs = 0;
  }

  /** The page is done: cheer. */
  cheer(): void {
    this.cheerMs = GAME_CONFIG.manuscript.cheerMs;
    this.winceMs = 0;
  }

  /** A new page: write its heading. */
  start(text: string, reducedMotion: boolean): void {
    this.winceMs = 0;
    this.cheerMs = 0;
    this.heading.text = text;
    this.headingMs = reducedMotion ? GAME_CONFIG.manuscript.headingMs : 0;
    this.writingMs = reducedMotion ? 0 : GAME_CONFIG.manuscript.headingMs;
  }

  /** The manuscript grew: scribble for a moment. */
  write(): void {
    this.writingMs = Math.max(this.writingMs, 450);
  }

  /** `danger`: a creature is close to the margin, so the scribe looks up at it. */
  update(frameMs: number, reducedMotion: boolean, danger = false): void {
    const total = GAME_CONFIG.manuscript.headingMs;
    this.headingMs = Math.min(total, this.headingMs + frameMs);
    const shown = outCubic(this.headingMs / total);
    const width = this.heading.width + DISPLAY_PADDING * 2;
    this.headingMask
      .clear()
      .rect(this.heading.x - DISPLAY_PADDING, -40, width * shown, 60)
      .fill(0xffffff);

    this.timeMs += frameMs;
    this.writingMs = Math.max(0, this.writingMs - frameMs);
    this.winceMs = Math.max(0, this.winceMs - frameMs);
    this.cheerMs = Math.max(0, this.cheerMs - frameMs);
    const mood: Mood = this.winceMs > 0 ? 'hurt' : this.cheerMs > 0 ? 'happy' : danger ? 'worried' : 'calm';
    const blink = mood !== 'hurt' && Math.floor(this.timeMs / 160) % 25 === 0;
    // Faces still change with reduced motion; only the movement stops.
    this.drawFace(mood, blink, danger);
    if (reducedMotion) {
      this.figure.position.set(0, 0);
      this.quill.rotation = mood === 'happy' ? -0.5 : 0;
      this.quill.y = -2;
      return;
    }
    // Cheering: little hops with the quill up. Wincing: a shiver with the quill dropped.
    const hop = this.cheerMs > 0 ? -Math.abs(Math.sin(this.timeMs / 110)) * 6 : 0;
    const shiver = this.winceMs > 0 ? Math.sin(this.timeMs / 25) * 1.5 * (this.winceMs / GAME_CONFIG.manuscript.winceMs) : 0;
    this.figure.position.set(shiver, hop);
    const wiggle = this.writingMs > 0 && mood === 'calm' ? Math.sin(this.timeMs / 45) : 0;
    this.quill.rotation = mood === 'happy' ? -0.6 + Math.sin(this.timeMs / 90) * 0.15 : mood === 'hurt' ? 0.5 : wiggle * 0.12;
    this.quill.y = -2 + Math.abs(wiggle) * -2;
  }

  private drawFace(mood: Mood, blink: boolean, lookUp: boolean): void {
    this.face.clear();
    // Eyes on the writing, a little to the right; up toward the page when worried.
    const look = lookUp ? { x: -10, y: -60 } : { x: 30, y: 10 };
    drawFace(this.face, 0, -R * 0.95, R * 0.42, mood, blink, look.x, look.y, 0.5);
  }
}

/**
 * PixiJS renderer for the play field (REQUIREMENTS §7). Reads game state and
 * events and draws them; it never changes game state.
 *
 * The creatures are drawn procedurally in src/render/creatures/ in the
 * Inkwell style (DESIGN §5, §7).
 */
import { Application, Container, Graphics, Text } from 'pixi.js';
import {
  FIRST_LINE_Y,
  LINE_SPACING,
  MARGIN_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  laneY,
  renderX,
  sizeScale,
  type GameEvent,
  type GamePhase,
  type Target,
  type World,
} from '../core/world';
import { Effects } from './effects';
import { Hud } from './hud';
import { Overlay, type OverlayActions } from './overlay';
import { DEFAULT_COSMETICS, type Cosmetics } from '../core/rewards';
import { t, type MessageKey } from '../i18n';
import type { MechanicId } from '../core/mechanics';
import { intercept, type Point } from './aim';
import { GAME_CONFIG } from '../core/config';
import { createCreature, type CreatureView } from './creatures';
import { drawFace, type Mood } from './creatures/common';
import { InkShots, SHOT_SPEED } from './shots';
import { COLORS, DISPLAY_FONT, DISPLAY_PADDING, glyph, prefersReducedMotion } from './theme';
import { Punch, approach, mix } from './tween';

const NIB_LENGTH = 56;
/** Tutorial notes stay below the HUD row. */
const CALLOUT_MIN_Y = 64;
const NIB_HOME = { x: MARGIN_X - 90, y: WORLD_HEIGHT / 2 };

export interface Renderer {
  app: Application;
  /** Draw the current state. `frameMs` is real time since the last frame. */
  sync(world: World, alpha: number, frameMs: number): void;
  /** Redraw everything, e.g. after the theme, text size or motion setting changes. */
  rebuild(): void;
  /** A picture of the creature a tutorial is about, as an image URL, or null if it has none. */
  portrait(id: MechanicId): string | null;
  destroy(): void;
}

/** Display options the renderer reads from the player's settings and profile. */
export interface DisplayOptions {
  /** Size multiplier for targets and their text (REQUIREMENTS §10). */
  textScale: number;
  reducedMotion: boolean;
  /** 'gentle' softens screen shake and turns off the damage flash. */
  screenEffects?: 'full' | 'gentle';
  /** Equipped cosmetics (unlocked by leveling up). */
  cosmetics?: Cosmetics;
}

const GOLD = 0xc9a227;
/** Rings that point at the HUD (ink gained or lost, a power ready) stay up a moment, then fade. */
const HIGHLIGHT_RING_MS = 900;
const HIGHLIGHT_RING_HOLD = 0.45;

/** Splatter colors for the unlockable ink choices. */
function splatterColor(choice: Cosmetics['splatter']): number {
  switch (choice) {
    case 'crimson':
      return COLORS.inkCrimson;
    case 'violet':
      return COLORS.inkViolet;
    case 'teal':
      return mix(COLORS.ink, 0x16a3a3, 0.75);
    case 'gold':
      return GOLD;
    default:
      return COLORS.ink;
  }
}

function drawPage(style: Cosmetics['paper']): Graphics {
  const page = new Graphics();
  // Parchment warms the paper; strongest on the classic theme, a hint elsewhere.
  const paper = style === 'parchment' ? mix(COLORS.paper, 0xe3c98f, 0.45) : COLORS.paper;
  page.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(paper);

  if (style === 'graph') {
    // Graph paper: a fine grid, with the writing lines a little stronger.
    for (let x = 0; x < WORLD_WIDTH; x += LINE_SPACING / 2) page.moveTo(x, 0).lineTo(x, WORLD_HEIGHT);
    for (let y = FIRST_LINE_Y - LINE_SPACING; y < WORLD_HEIGHT; y += LINE_SPACING / 2) page.moveTo(0, y).lineTo(WORLD_WIDTH, y);
    page.stroke({ width: 1, color: COLORS.rule, alpha: 0.5 });
  }
  for (let y = FIRST_LINE_Y - LINE_SPACING; y < WORLD_HEIGHT - LINE_SPACING / 2; y += LINE_SPACING) {
    page.moveTo(0, y).lineTo(WORLD_WIDTH, y);
  }
  page.stroke({ width: 1.5, color: COLORS.rule });

  page.moveTo(MARGIN_X, 0).lineTo(MARGIN_X, WORLD_HEIGHT).stroke({ width: 2.5, color: COLORS.margin });
  return page;
}

/** The Nib, the player: a pen that points at what you're typing, in the equipped style. */
function drawNib(style: Cosmetics['nib']): Graphics {
  const g = new Graphics();
  switch (style) {
    case 'quill': {
      // A feather quill: a long vane behind a fine tip.
      g.poly([-46, -4, -30, -20, 6, -12, NIB_LENGTH, 0, 6, 8, -30, 10, -46, 2]).fill(COLORS.inkLight);
      for (let x = -38; x < 4; x += 7) g.moveTo(x, -1).lineTo(x + 8, -13 + (x + 38) * 0.05).stroke({ width: 1, color: COLORS.paper, alpha: 0.6 });
      g.moveTo(-50, 1).lineTo(NIB_LENGTH, 0).stroke({ width: 2, color: COLORS.ink });
      break;
    }
    case 'brush': {
      // A calligraphy brush: wooden handle, ferrule, and an inky tuft.
      g.roundRect(-44, -5, 40, 10, 4).fill(0x8a5a33);
      g.rect(-6, -7, 12, 14).fill(COLORS.pencil);
      g.moveTo(6, -9).quadraticCurveTo(36, -8, NIB_LENGTH, 0).quadraticCurveTo(36, 8, 6, 9).fill(COLORS.ink);
      break;
    }
    default: {
      const color = style === 'gold' ? GOLD : COLORS.ink;
      g.poly([0, -22, NIB_LENGTH, 0, 0, 22, 10, 0])
        .fill(color)
        .moveTo(34, 0)
        .lineTo(NIB_LENGTH - 6, 0)
        .stroke({ width: 2, color: COLORS.paper });
      if (style === 'gold') g.poly([4, -14, 30, -6, 4, -6]).fill({ color: 0xfff1b8, alpha: 0.6 });
    }
  }
  return g;
}

/** A stand-in creature to draw for each tutorial that is about one. */
function portraitTarget(id: MechanicId): Target | null {
  const base: Target = { id: -1, kind: 'blotling', text: 'ink', typed: 0, lives: 1, ghost: false, x: 0, y: 0, lane: 0, prevX: 0, speed: 0 };
  switch (id) {
    case 'basics':
      return { ...base, kind: 'drip', text: 'f' };
    case 'space':
      return { ...base, kind: 'drip', text: ' ' };
    case 'blotling':
      return base;
    case 'crimson':
      return { ...base, lives: 2, maxLives: 2 };
    case 'violet':
      return { ...base, lives: 3, maxLives: 3 };
    case 'ghost':
      return { ...base, ghost: true, x: WORLD_WIDTH };
    case 'spill':
      return { ...base, text: 'spill', lives: 3, maxLives: 3, boss: true, bossKind: 'spill' };
    case 'shuffler':
      return { ...base, text: 'lsfhuef', lives: 3, maxLives: 3, boss: true, bossKind: 'shuffler' };
    case 'bookworm':
      return { ...base, text: 'book', boss: true, bossKind: 'bookworm', head: true };
    case 'squid':
      return { ...base, text: 'squid', lives: 2, maxLives: 2, boss: true, bossKind: 'squid' };
    case 'quill':
      return { ...base, text: 'quill', lives: 3, maxLives: 3, boss: true, bossKind: 'quill', rival: 2.5 };
    case 'runon':
      return { ...base, kind: 'runon', text: 'ink dries', buffer: 'ink d', cursor: 5, typed: 5 };
    case 'recovery':
      return { ...base, text: 'ink', bottle: true };
    default:
      return null;
  }
}

/**
 * `actions` handles clicks on the overlay (difficulty picker, prompts). They
 * are intents for main.ts to apply; the renderer itself never changes state.
 */
export async function createRenderer(
  host: HTMLElement,
  actions: OverlayActions,
  display: () => DisplayOptions = () => ({ textScale: 1, reducedMotion: prefersReducedMotion() }),
): Promise<Renderer> {
  const app = new Application();
  await app.init({
    // The desk shows around the page when the window's aspect ratio differs.
    background: COLORS.desk,
    antialias: true,
    resizeTo: host,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
  });
  app.canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(app.canvas);

  // Everything is drawn in logical world units, then scaled to fit the window.
  const stage = new Container();
  app.stage.addChild(stage);
  const views = new Map<number, CreatureView>();
  /** Per-creature reactions the renderer adds on top of each creature's own drawing. */
  const reactions = new Map<number, { punch: Punch; tauntMs: number }>();
  let timeMs = 0;

  // The scene is rebuilt from scratch when display settings change.
  let reducedMotion = false;
  let gentle = false;
  let textScale = 1;
  let effects!: Effects;
  let shots!: InkShots;
  /**
   * Creatures already finished in the game, still on screen until the final
   * drop of ink lands. They show they're beaten straight away (x x eyes and a
   * quick squash), so it's clear the word is done even with the sound off.
   */
  let dying: { view: CreatureView; target: Target; x: number; y: number; speed: number; sinceMs: number }[] = [];
  /** Everything on the page. It jolts as one when ink is lost (screen shake). */
  let scene!: Container;
  /** Red-pen glow around the page edge: flashes on damage, pulses when ink is low. */
  let vignette!: Graphics;
  /** Washes over the page while the Paperweight (grey) or Highlighter (yellow) lasts. */
  let slowWash!: Graphics;
  let glowWash!: Graphics;
  let guide!: Graphics;
  let targetLayer!: Container;
  /** Squid ink squirted over a lane, drawn on top of the creatures in it. */
  let smudgeLayer!: Graphics;
  let nib!: Container;
  let nibFace!: Graphics;
  let nibStyle: Cosmetics['nib'] = DEFAULT_COSMETICS.nib;
  let hud!: Hud;
  let overlay!: Overlay;
  /** A handwritten note pointing at a creature on its guided first try. */
  let callout!: Container;
  let calloutText!: Text;
  let calloutArrow!: Graphics;
  let calloutId: MechanicId | null = null;

  const build = () => {
    const options = display();
    ({ reducedMotion, textScale } = options);
    gentle = options.screenEffects === 'gentle';
    const cosmetics = options.cosmetics ?? DEFAULT_COSMETICS;
    for (const child of stage.removeChildren()) child.destroy({ children: true });
    views.clear();
    reactions.clear();
    dying = [];
    app.renderer.background.color = COLORS.desk;

    effects = new Effects(reducedMotion, splatterColor(cosmetics.splatter));
    shots = new InkShots(reducedMotion, splatterColor(cosmetics.splatter));
    guide = new Graphics();
    targetLayer = new Container();
    // The locked creature is drawn on top of any it overlaps.
    targetLayer.sortableChildren = true;
    smudgeLayer = new Graphics();
    nibStyle = cosmetics.nib;
    nib = new Container();
    nibFace = new Graphics();
    nib.addChild(drawNib(nibStyle), nibFace);
    nib.position.set(NIB_HOME.x, NIB_HOME.y);
    hud = new Hud();
    overlay = new Overlay(actions, reducedMotion);
    scene = new Container();
    const wash = (color: number) => {
      const g = new Graphics().rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(color);
      g.alpha = 0;
      return g;
    };
    callout = new Container();
    calloutText = new Text({ text: '', style: { fontFamily: DISPLAY_FONT, padding: DISPLAY_PADDING, fontSize: 32, fontWeight: '700', fill: COLORS.margin } });
    calloutText.anchor.set(0.5, 1);
    calloutArrow = new Graphics();
    callout.addChild(calloutArrow, calloutText);
    callout.visible = false;
    calloutId = null;
    slowWash = wash(COLORS.inkFaded);
    glowWash = wash(COLORS.highlighter);
    scene.addChild(drawPage(cosmetics.paper), glowWash, slowWash, effects.stainLayer, guide, targetLayer, smudgeLayer, nib, shots.layer, effects.particleLayer, callout);
    vignette = new Graphics();
    const bands = 7;
    for (let i = 0; i < bands; i++) {
      const inset = i * 9 + 4.5;
      vignette
        .rect(inset, inset, WORLD_WIDTH - inset * 2, WORLD_HEIGHT - inset * 2)
        .stroke({ width: 9, color: COLORS.margin, alpha: 0.55 * (1 - i / bands) ** 2 });
    }
    vignette.alpha = 0;
    stage.addChild(scene, vignette, hud.root, overlay.root);

    // Clip anything outside the page (targets spawn off the right edge).
    const mask = new Graphics().rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(0xffffff);
    stage.addChild(mask);
    stage.mask = mask;
  };
  build();

  const fit = () => {
    const { width, height } = app.screen;
    const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    stage.scale.set(scale);
    stage.position.set((width - WORLD_WIDTH * scale) / 2, (height - WORLD_HEIGHT * scale) / 2);
  };
  fit();
  app.renderer.on('resize', fit);

  /** Screen shake: how long is left, how long it began with, and how far it moves. */
  const shake = { ms: 0, total: 1, power: 0 };
  const startShake = (ms: number, power: number) => {
    if (reducedMotion) return;
    const p = gentle ? power * 0.35 : power;
    if (shake.ms > 0 && shake.power * (shake.ms / shake.total) > p) return;
    shake.ms = ms;
    shake.total = ms;
    shake.power = p;
  };
  /** Damage flash strength, 1..0. */
  let flash = 0;
  let wobbleMs = 0;
  /** The Nib kicks back a little each time it fires. */
  let kickMs = 0;
  /** The Nib's resting height, before its idle bob. */
  let nibY = NIB_HOME.y;
  /** The Nib's feelings: a wince after a mistake, alarm when ink is lost, a grin on a combo. */
  const nibMood = { winceMs: 0, alarmMs: 0, cheerMs: 0, nextBlinkMs: 2000, blinkMs: 0 };
  let lastPhase: GamePhase | null = null;
  /** The red-pen underline under the locked creature draws in from the left when the lock moves. */
  const underline = { id: -1, share: 0 };

  const reactionFor = (id: number) => {
    let r = reactions.get(id);
    if (!r) {
      r = { punch: new Punch(140), tauntMs: 0 };
      reactions.set(id, r);
    }
    return r;
  };

  const center = (target: Target, view: CreatureView | undefined) => ({
    x: target.x + (view ? view.width / 2 : 0),
    y: target.y - LINE_SPACING / 2,
  });

  /** Where the Nib's tip is now. */
  const nibTip = (): Point => ({
    x: nib.x + Math.cos(nib.rotation) * NIB_LENGTH,
    y: nib.y + Math.sin(nib.rotation) * NIB_LENGTH,
  });

  /**
   * Flick a drop of ink from the Nib at a creature's letter, leading it so
   * the ink meets the letter where it will be (see aim.ts). `missBy` sends it
   * that far above or below instead.
   */
  const shoot = (
    from: { x: number; y: number; speed: number },
    view: CreatureView,
    letter: number,
    onLand: (at: Point) => void,
    missBy = 0,
  ): void => {
    const point = { x: from.x + view.letterX(letter), y: from.y - LINE_SPACING / 2 + missBy };
    const aim = intercept(nibTip(), point, -from.speed, 0, SHOT_SPEED);
    kickMs = reducedMotion ? 0 : 90;
    shots.fire(nibTip(), aim, aim.t, onLand);
  };

  /** A wrong key still fires, but the ink misses and splats on the page. */
  const missShot = (world: World, targetId: number | null): void => {
    const visible = world.targets.filter((t) => t.x < WORLD_WIDTH);
    const target =
      world.targets.find((t) => t.id === targetId) ??
      visible.reduce<Target | undefined>((best, t) => (!best || t.x < best.x ? t : best), undefined);
    const view = target && views.get(target.id);
    const splat = (at: Point) => {
      effects.smudge(at.x, at.y);
      effects.splatter(at.x, at.y, 5, COLORS.margin);
    };
    if (target && view) {
      const side = Math.random() < 0.5 ? -1 : 1;
      shoot(target, view, target.typed, splat, side * (30 + Math.random() * 16));
      // The creature it was meant for grins, and the letter that was wanted gets a red cross.
      reactionFor(target.id).tauntMs = 450;
      effects.cross(target.x + view.letterX(target.typed), target.y - LINE_SPACING / 2 - view.height / 2 - 14);
      return;
    }
    // Nothing to aim at: the ink flies out across the page.
    const to = { x: nib.x + 300 + Math.random() * 400, y: nib.y + (Math.random() - 0.5) * 160 };
    const tip = nibTip();
    kickMs = reducedMotion ? 0 : 90;
    shots.fire(tip, to, Math.hypot(to.x - tip.x, to.y - tip.y) / SHOT_SPEED, splat);
  };

  const handleEvent = (world: World, event: GameEvent) => {
    switch (event.type) {
      case 'progress': {
        // Each correct key flicks ink at the letter just typed.
        if (!event.shot) break;
        const target = world.targets.find((t) => t.id === event.targetId);
        const view = target && views.get(target.id);
        if (target && view) {
          const id = target.id;
          const char = glyph([...target.text][target.typed - 1] ?? '');
          shoot(target, view, target.typed - 1, (at) => {
            effects.splatter(at.x, at.y, 3);
            effects.letterPop(at.x, at.y, char, 26 * textScale * sizeScale(target));
            reactionFor(id).punch.hit();
          });
        }
        break;
      }
      case 'destroyed': {
        const view = views.get(event.target.id);
        const finish = (at: { x: number; y: number }) => {
          if (event.target.kind === 'drip') effects.flick(at.x, at.y);
          else if (event.target.kind === 'blotling' && !event.target.bottle) effects.blotUp(at.x, at.y, view?.width ?? 80);
          effects.splatter(at.x, at.y, event.target.kind === 'drip' ? 8 : 12);
          effects.ring(at.x, at.y);
          effects.popup(at.x, at.y - 30, `+${event.points}`, { size: 22 });
        };
        if (event.blotted || !view || reducedMotion) {
          finish(center(event.target, view));
          break;
        }
        // Keep the creature crawling until the final drop of ink reaches it,
        // already marked as beaten.
        views.delete(event.target.id);
        reactions.delete(event.target.id);
        view.root.zIndex = -1;
        const ghost = { view, target: event.target, x: event.target.x, y: event.target.y, speed: event.target.speed, sinceMs: 0 };
        dying.push(ghost);
        shoot(ghost, view, -1, () => {
          finish({ x: ghost.x + view.width / 2, y: ghost.y - LINE_SPACING / 2 });
          view.root.destroy({ children: true });
          dying = dying.filter((d) => d !== ghost);
        });
        break;
      }
      case 'hit': {
        // A crimson or violet creature lost a life: the ink lands on its last letter, then it carries on.
        const view = views.get(event.target.id);
        const splash = () => {
          const at = center(event.target, views.get(event.target.id));
          effects.splatter(at.x, at.y, 8);
          effects.ring(at.x, at.y);
          effects.popup(at.x, at.y - 30, `+${event.points}`);
        };
        if (view && !reducedMotion) shoot(event.target, view, -1, splash);
        else splash();
        break;
      }
      case 'boss':
        effects.banner(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 40, t(`banner.boss.${event.target.bossKind ?? 'spill'}` as MessageKey));
        startShake(420, 6);
        nibMood.alarmMs = 900;
        break;
      case 'bossDefeated': {
        const at = center(event.target, views.get(event.target.id));
        effects.splatter(at.x, at.y, 18);
        effects.ring(at.x, at.y, COLORS.ink, 60, 420);
        nibMood.cheerMs = 900;
        startShake(220, 4);
        break;
      }
      case 'bossShuffled': {
        // The letters jumble with a little shudder.
        const reaction = reactionFor(event.target.id);
        reaction.tauntMs = Math.max(reaction.tauntMs, 260);
        reaction.punch.hit();
        break;
      }
      case 'squirt': {
        const at = center(event.target, views.get(event.target.id));
        effects.splatter(at.x, at.y, 12);
        effects.ring(at.x, at.y, COLORS.ink, 36, 360);
        startShake(140, 3);
        break;
      }
      case 'quillWins': {
        const at = center(event.target, views.get(event.target.id));
        effects.splatter(at.x, at.y, 14);
        effects.banner(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 40, t('banner.quillWins'), COLORS.margin);
        if (event.inkLost > 0) {
          const well = hud.inkPoint();
          effects.ring(well.x, well.y, COLORS.margin, 16, HIGHLIGHT_RING_MS, HIGHLIGHT_RING_HOLD);
          effects.popup(well.x + 40, well.y + 30, `−${event.inkLost}`, { color: COLORS.margin, size: 20 });
        }
        if (!reducedMotion) wobbleMs = 220;
        startShake(200, 5);
        break;
      }
      case 'split': {
        const at = center(event.target, views.get(event.target.id));
        effects.splatter(at.x, at.y, 22);
        effects.ring(at.x, at.y, COLORS.ink, 70, 460);
        startShake(260, 5);
        break;
      }
      case 'ability':
        nibMood.cheerMs = 700;
        hud.pulse(event.id);
        if (event.id === 'blotter') {
          effects.blotterWave(WORLD_WIDTH, WORLD_HEIGHT);
          effects.banner(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, t('banner.blotter'), COLORS.ink);
          startShake(300, 7);
        } else if (event.id === 'paperweight') {
          // It lands with a thud that ripples out across the page.
          effects.banner(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, t('banner.paperweight'), COLORS.ink);
          for (let i = 0; i < 3; i++) effects.ring(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, COLORS.inkFaded, 160 + i * 150, 500 + i * 160);
          startShake(260, 9);
        } else {
          effects.sweep(WORLD_WIDTH, WORLD_HEIGHT, COLORS.highlighter);
          effects.banner(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, t('banner.highlighter'), COLORS.ink);
        }
        break;
      case 'abilityEnded':
        break;
      case 'charged': {
        const at = hud.chargePoint(event.charges - 1);
        effects.ring(at.x, at.y, COLORS.ink, 18);
        effects.popup(at.x, at.y + 34, '+1');
        break;
      }
      case 'passiveReady': {
        const at = hud.abilityPoint(event.id);
        hud.pulse(event.id);
        effects.ring(at.x, at.y, COLORS.highlighter, 26, HIGHLIGHT_RING_MS, HIGHLIGHT_RING_HOLD);
        break;
      }
      case 'eraserUsed': {
        // The slip is rubbed out before it counts.
        const target = world.targets.find((t) => t.id === event.targetId);
        const view = target && views.get(target.id);
        const at = target && view ? { x: target.x + view.letterX(target.typed), y: target.y - LINE_SPACING / 2 } : { x: nib.x + 90, y: nib.y };
        effects.crumbs(at.x, at.y);
        effects.popup(at.x, at.y - 40, t('popup.erased'), { size: 20 });
        hud.pulse('eraser');
        break;
      }
      case 'shieldUsed': {
        const y = event.target.y - LINE_SPACING / 2;
        effects.sheet(MARGIN_X + 30, y);
        effects.popup(MARGIN_X + 90, y - 50, t('popup.soaked'), { size: 20 });
        hud.pulse('blottingPaper');
        break;
      }
      case 'marginHit':
        effects.marginStain(MARGIN_X, event.target.y - LINE_SPACING / 2);
        effects.popup(MARGIN_X + 50, event.target.y - LINE_SPACING / 2 - 26, `−${event.inkLost}`, { color: COLORS.margin, size: 24 });
        startShake(340, 10);
        if (!gentle) flash = 1;
        nibMood.alarmMs = 700;
        break;
      case 'error': {
        // Typed characters fire a miss; other mistakes (in a Misprint) just smudge.
        if ([...event.key].length === 1) {
          missShot(world, event.targetId);
        } else {
          const target = world.targets.find((t) => t.id === event.targetId);
          const at = target ? center(target, views.get(target.id)) : { x: nib.x + 30, y: nib.y };
          effects.smudge(at.x, at.y);
          if (target) reactionFor(target.id).tauntMs = 450;
        }
        if (event.pointsLost > 0) effects.popup(nib.x + 70, nib.y - 34, `−${event.pointsLost}`, { color: COLORS.margin, size: 20 });
        if (event.inkLost > 0) {
          // Ink spilt by the slip: a red tick on the well.
          const well = hud.inkPoint();
          effects.ring(well.x, well.y, COLORS.margin, 16, HIGHLIGHT_RING_MS, HIGHLIGHT_RING_HOLD);
        }
        if (!reducedMotion) wobbleMs = 220;
        startShake(150, event.inkLost > 0 ? 5 : 3.5);
        nibMood.winceMs = 420;
        break;
      }
      case 'comboStep':
        effects.popup(nib.x + 30, nib.y - 46, `×${event.multiplier}`, { color: COLORS.margin, size: 26 });
        nibMood.cheerMs = 500;
        break;
      case 'comboBroken':
        break;
      case 'inkRestored': {
        // Fresh ink flies from where it was won into the well.
        const from = event.target ? center(event.target, views.get(event.target.id)) : nibTip();
        const well = hud.inkPoint();
        const drops = event.source === 'bottle' ? 6 : 3;
        for (let i = 0; i < drops; i++) {
          effects.flyTo(from.x + (Math.random() - 0.5) * 30, from.y + (Math.random() - 0.5) * 30, well.x, well.y, COLORS.ink, i === 0 ? () => effects.ring(well.x, well.y, COLORS.highlighter, 20, HIGHLIGHT_RING_MS, HIGHLIGHT_RING_HOLD) : undefined, 420 + i * 70);
        }
        effects.popup(from.x, from.y - 44, t('popup.ink', { ink: event.amount }), { size: 20 });
        nibMood.cheerMs = 600;
        break;
      }
      case 'bottleMissed':
      case 'guide':
        break;
      case 'phase':
        // A fresh page (or notebook) starts clean.
        if (event.phase === 'playing' && lastPhase !== 'paused') {
          effects.clearStains();
        }
        if (event.phase === 'gameOver') {
          // The well runs dry: ink bursts along the margin.
          for (let i = 0; i < 9; i++) effects.splatter(MARGIN_X + Math.random() * 60, 60 + Math.random() * (WORLD_HEIGHT - 120), 10);
          startShake(520, 12);
          if (!gentle) flash = 1;
        }
        lastPhase = event.phase;
        break;
      case 'reset':
        // A restarted or abandoned page starts clean.
        effects.clearStains();
        for (const d of dying) d.view.root.destroy({ children: true });
        dying = [];
        break;
      case 'locked':
        break;
    }
  };

  /** A beaten creature squashes once and fades a little. */
  const showDefeat = (view: CreatureView, sinceMs: number) => {
    if (!reducedMotion) {
      const squash = 1 - 0.18 * Math.sin(Math.min(1, sinceMs / 160) * Math.PI);
      view.root.scale.set(2 - squash, squash);
    }
    view.root.alpha = Math.max(0.6, 1 - sinceMs / 400);
  };

  /** Where the Nib's eyes sit for each pen style, and how big they are. */
  const NIB_FACE: Record<Cosmetics['nib'], { x: number; y: number; r: number }> = {
    classic: { x: 19, y: -1, r: 4.6 },
    gold: { x: 19, y: -1, r: 4.6 },
    quill: { x: -14, y: -3, r: 4 },
    brush: { x: 26, y: 0, r: 3.4 },
  };

  const drawNibFace = (locked: boolean, frameMs: number) => {
    const m = nibMood;
    m.winceMs = Math.max(0, m.winceMs - frameMs);
    m.alarmMs = Math.max(0, m.alarmMs - frameMs);
    m.cheerMs = Math.max(0, m.cheerMs - frameMs);
    m.blinkMs = Math.max(0, m.blinkMs - frameMs);
    m.nextBlinkMs -= frameMs;
    if (m.nextBlinkMs <= 0) {
      m.blinkMs = 130;
      m.nextBlinkMs = 2200 + Math.random() * 3200;
    }
    const mood: Mood = m.winceMs > 0 ? 'hurt' : m.alarmMs > 0 ? 'scared' : m.cheerMs > 0 ? 'happy' : locked ? 'angry' : 'calm';
    const f = NIB_FACE[nibStyle];
    nibFace.clear();
    // Eyes look ahead, along the pen.
    drawFace(nibFace, f.x, f.y, f.r, mood, m.blinkMs > 0, f.x + 100, f.y, COLORS.ink);
  };

  /** Squid ink over lanes: blots that fade in, hold, then fade away. */
  const drawSmudges = (world: World) => {
    smudgeLayer.clear();
    const full = GAME_CONFIG.boss.squid.smudgeMs;
    for (const smudge of world.smudges) {
      const fade = Math.min(1, smudge.ms / 500, (full - smudge.ms) / 150);
      const cy = laneY(smudge.lane, world.laneStep) - LINE_SPACING / 2;
      for (let x = MARGIN_X + 20, i = 0; x < WORLD_WIDTH; x += 46, i++) {
        const wobble = Math.sin(i * 2.1 + smudge.lane);
        smudgeLayer.ellipse(x, cy + wobble * 5, 40 + wobble * 8, 26 + Math.cos(i * 1.3) * 6);
      }
      smudgeLayer.fill({ color: COLORS.ink, alpha: 0.9 * fade });
    }
  };

  return {
    app,
    sync(world, alpha, frameMs) {
      for (const event of world.events) handleEvent(world, event);
      world.events.length = 0;
      drawSmudges(world);

      // Creatures. Animation time only runs while playing, so they freeze when paused.
      const playing = world.phase === 'playing';
      if (playing) timeMs += frameMs;
      const live = new Set<number>();
      let locked: { x: number; y: number } | null = null;
      let lockedView: CreatureView | null = null;
      // Line boil (DESIGN §7): drawings jitter a hair a few times a second, like hand-drawn animation.
      const boilFrame = Math.floor(timeMs / 120);
      for (const target of world.targets) {
        live.add(target.id);
        let view = views.get(target.id);
        if (!view) {
          view = createCreature(target, textScale);
          views.set(target.id, view);
          targetLayer.addChild(view.root);
        }
        const x = renderX(target, alpha);
        let y = target.y - LINE_SPACING / 2;
        const isLocked = target.id === world.lockedId;
        const reaction = reactions.get(target.id);
        let taunting = false;
        if (reaction) {
          if (playing) reaction.tauntMs = Math.max(0, reaction.tauntMs - frameMs);
          taunting = reaction.tauntMs > 0;
          if (!reducedMotion) {
            // A squash when ink lands, and a mocking hop after a mistake.
            const k = playing ? reaction.punch.update(frameMs) : 0;
            view.root.scale.set(1 + 0.05 * k, 1 - 0.1 * k);
            if (taunting) y -= Math.abs(Math.sin(reaction.tauntMs / 70)) * 6;
          }
        }
        if (!reducedMotion) {
          const n = Math.sin((target.id * 97 + boilFrame) * 12.9898) * 43758.5453;
          const r = n - Math.floor(n);
          view.root.rotation = (r - 0.5) * 0.025;
          y += (r - 0.5) * 1.2;
        }
        view.root.position.set(x, y);
        view.root.zIndex = isLocked ? 1 : 0;
        view.update(target, {
          timeMs,
          dtMs: frameMs,
          locked: isLocked,
          lookX: nib.x - x,
          lookY: nib.y - y,
          reducedMotion,
          taunting,
        });
        if (isLocked) {
          locked = { x, y };
          lockedView = view;
        }
      }
      for (const [id, view] of views) {
        if (!live.has(id)) {
          view.root.destroy({ children: true });
          views.delete(id);
          reactions.delete(id);
        }
      }

      // The Nib glides toward the locked target's line and points at it.
      const goalY = locked ? Math.min(Math.max(locked.y, FIRST_LINE_Y), WORLD_HEIGHT - LINE_SPACING) : NIB_HOME.y;
      nibY = approach(nibY, goalY, 10, frameMs);
      // With nothing to aim at it bobs gently, like a pen being twiddled.
      const idle = reducedMotion || locked ? 0 : Math.sin(timeMs / 520) * 4;
      nib.y = nibY + idle;
      const goalAngle = locked ? Math.atan2(locked.y - nib.y, locked.x - nib.x) : reducedMotion ? 0 : Math.sin(timeMs / 900) * 0.06;
      nib.rotation = approach(nib.rotation, Math.max(-0.7, Math.min(0.7, goalAngle)), 14, frameMs);

      wobbleMs = Math.max(0, wobbleMs - frameMs);
      kickMs = Math.max(0, kickMs - frameMs);
      nib.x = NIB_HOME.x - (kickMs > 0 ? Math.cos(nib.rotation) * 7 * (kickMs / 90) : 0);
      if (wobbleMs > 0) nib.rotation += Math.sin(wobbleMs / 15) * 0.16 * (wobbleMs / 220);
      drawNibFace(locked !== null, frameMs);

      // Screen shake: the whole page jolts, settling quickly.
      shake.ms = Math.max(0, shake.ms - frameMs);
      if (shake.ms > 0) {
        const k = shake.power * (shake.ms / shake.total) ** 2;
        scene.position.set(Math.sin(shake.ms / 13) * k, Math.cos(shake.ms / 17) * k * 0.7);
      } else {
        scene.position.set(0, 0);
      }

      // Red-pen edge: flashes when ink is lost and throbs while the well is nearly dry.
      flash = Math.max(0, flash - frameMs / 450);
      const low = playing && world.ink / world.maxInk < GAME_CONFIG.lowInk;
      const throb = low ? (reducedMotion || gentle ? 0.3 : 0.3 + 0.2 * Math.sin(timeMs / 280)) : 0;
      vignette.alpha = Math.max(flash, throb);

      slowWash.alpha = approach(slowWash.alpha, playing && world.slowMs > 0 ? 0.22 : 0, 8, frameMs);
      glowWash.alpha = approach(glowWash.alpha, playing && world.highlightMs > 0 ? 0.28 : 0, 8, frameMs);

      // A note in red pen follows the creature being taught, with an arrow down to it.
      const guided = playing && world.guide ? world.targets.find((g) => g.id === world.guide?.targetId) : undefined;
      const guidedView = guided && views.get(guided.id);
      callout.visible = Boolean(guided && guidedView);
      if (guided && guidedView && world.guide) {
        if (calloutId !== world.guide.id) {
          calloutId = world.guide.id;
          calloutText.text = t(`tutorial.${calloutId}.hint` as MessageKey);
        }
        // The note sits above the creature (kept on the page), with a short pen stroke
        // down to it. The arrow ends clear of eyes, horns and crowns, and its head
        // follows the stroke, so it points straight at the creature from wherever the note is.
        const bob = reducedMotion ? 0 : Math.sin(timeMs / 260) * 3;
        const half = calloutText.width / 2 + 12;
        const targetX = Math.min(WORLD_WIDTH - 24, guidedView.root.x + guidedView.width / 2);
        // Above the creature, unless that would crowd the HUD: then below, pointing up.
        const above = guidedView.root.y - guidedView.height / 2 - 64 - calloutText.height > CALLOUT_MIN_Y;
        const tipY = above ? guidedView.root.y - guidedView.height / 2 - 24 : guidedView.root.y + guidedView.height / 2 + 14;
        const cx = Math.min(WORLD_WIDTH - half, Math.max(MARGIN_X + half, targetX));
        const noteEdge = (above ? tipY - 40 : tipY + 40) + bob;
        calloutText.anchor.set(0.5, above ? 1 : 0);
        calloutText.position.set(cx, noteEdge);
        // Start at the note's edge, as close to the creature as the note allows.
        const startX = Math.min(cx + half - 24, Math.max(cx - half + 24, targetX));
        const startY = noteEdge + (above ? 6 : -4);
        // A slight bow, like a quick hand-drawn line.
        const ctrlX = (startX + targetX) / 2 + 8;
        const ctrlY = (startY + tipY) / 2;
        const angle = Math.atan2(tipY - ctrlY, targetX - ctrlX);
        const head = 9;
        calloutArrow
          .clear()
          .moveTo(startX, startY)
          .quadraticCurveTo(ctrlX, ctrlY, targetX, tipY)
          .moveTo(targetX + Math.cos(angle + 2.6) * head, tipY + Math.sin(angle + 2.6) * head)
          .lineTo(targetX, tipY)
          .lineTo(targetX + Math.cos(angle - 2.6) * head, tipY + Math.sin(angle - 2.6) * head)
          .stroke({ width: 3, color: COLORS.margin, cap: 'round', join: 'round' });
      }

      // Thin pencil guide line from the nib tip to the locked target, and a red-pen underline.
      guide.clear();
      const lockedId = world.lockedId ?? -1;
      if (underline.id !== lockedId) {
        underline.id = lockedId;
        underline.share = reducedMotion ? 1 : 0;
      }
      underline.share = reducedMotion ? 1 : approach(underline.share, 1, 16, frameMs);
      if (locked && lockedView) {
        const ux = locked.x - 4;
        const uy = locked.y + lockedView.height / 2 + 10;
        const w = (lockedView.width + 8) * underline.share;
        guide
          .moveTo(ux, uy)
          .quadraticCurveTo(ux + w / 2, uy + 4, ux + w, uy - 1)
          .stroke({ width: 3, color: COLORS.margin, cap: 'round', alpha: 0.85 });
      }
      if (locked) {
        const tipX = nib.x + Math.cos(nib.rotation) * NIB_LENGTH;
        const tipY = nib.y + Math.sin(nib.rotation) * NIB_LENGTH;
        guide.moveTo(tipX, tipY).lineTo(locked.x, locked.y).stroke({ width: 1.5, color: COLORS.pencil, alpha: 0.35 });
      }

      // Finished creatures keep crawling until their last drop of ink lands.
      if (playing) {
        for (const d of dying) {
          d.x -= (d.speed * frameMs) / 1000;
          d.sinceMs += frameMs;
          d.view.root.position.set(d.x, d.y - LINE_SPACING / 2);
          const y = d.y - LINE_SPACING / 2;
          d.view.highlight.visible = false;
          d.view.update(d.target, { timeMs, dtMs: frameMs, locked: false, lookX: nib.x - d.x, lookY: nib.y - y, reducedMotion, defeated: true });
          showDefeat(d.view, d.sinceMs);
        }
      }
      shots.update(frameMs);
      effects.update(frameMs);
      hud.update(world, frameMs, reducedMotion);
      overlay.update(world, frameMs);
    },
    rebuild() {
      build();
    },
    portrait(id) {
      const target = portraitTarget(id);
      if (!target) return null;
      try {
        const view = createCreature(target, 1.3);
        view.update(target, { timeMs: 0, dtMs: 0, locked: false, lookX: -500, lookY: 0, reducedMotion: true });
        const canvas = app.renderer.extract.canvas({ target: view.root, resolution: 2, antialias: true }) as HTMLCanvasElement;
        const url = canvas.toDataURL('image/png');
        view.root.destroy({ children: true });
        return url;
      } catch {
        // The picture is a helper; the card still explains the creature in words.
        return null;
      }
    },
    destroy() {
      app.destroy(true, { children: true });
    },
  };
}

/**
 * PixiJS renderer for the play field (REQUIREMENTS §7). Reads game state and
 * events and draws them; it never changes game state.
 *
 * The creatures are drawn procedurally in src/render/creatures/ in the
 * Inkwell style (DESIGN §5, §7).
 */
import { Application, Container, Graphics } from 'pixi.js';
import {
  FIRST_LINE_Y,
  LINE_SPACING,
  MARGIN_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  renderX,
  type GameEvent,
  type GamePhase,
  type Target,
  type World,
} from '../core/world';
import { Effects } from './effects';
import { Hud } from './hud';
import { Overlay, type OverlayActions } from './overlay';
import { DEFAULT_COSMETICS, type Cosmetics } from '../core/rewards';
import { t } from '../i18n';
import { createCreature, type CreatureView } from './creatures';
import { COLORS, prefersReducedMotion } from './theme';

const NIB_LENGTH = 56;
const NIB_HOME = { x: MARGIN_X - 90, y: WORLD_HEIGHT / 2 };

export interface Renderer {
  app: Application;
  /** Draw the current state. `frameMs` is real time since the last frame. */
  sync(world: World, alpha: number, frameMs: number): void;
  /** Redraw everything, e.g. after the theme, text size or motion setting changes. */
  rebuild(): void;
  destroy(): void;
}

/** Display options the renderer reads from the player's settings and profile. */
export interface DisplayOptions {
  /** Size multiplier for targets and their text (REQUIREMENTS §10). */
  textScale: number;
  reducedMotion: boolean;
  /** Equipped cosmetics (unlocked by leveling up). */
  cosmetics?: Cosmetics;
}

/** Blend two colors: t = 0 gives a, t = 1 gives b. */
function mix(a: number, b: number, t: number): number {
  const ch = (c: number, shift: number) => (c >> shift) & 0xff;
  const lerp = (shift: number) => Math.round(ch(a, shift) + (ch(b, shift) - ch(a, shift)) * t) << shift;
  return lerp(16) | lerp(8) | lerp(0);
}

const GOLD = 0xc9a227;

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
        .moveTo(14, 0)
        .lineTo(NIB_LENGTH - 6, 0)
        .stroke({ width: 2, color: COLORS.paper })
        .circle(20, 0, 4)
        .fill(COLORS.paper);
      if (style === 'gold') g.poly([4, -14, 30, -6, 4, -6]).fill({ color: 0xfff1b8, alpha: 0.6 });
    }
  }
  return g;
}

/** Exponential smoothing that behaves the same at any frame rate. */
function approach(current: number, goal: number, rate: number, dtMs: number): number {
  return goal + (current - goal) * Math.exp(-rate * (dtMs / 1000));
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
  let timeMs = 0;

  // The scene is rebuilt from scratch when display settings change.
  let reducedMotion = false;
  let textScale = 1;
  let effects!: Effects;
  let guide!: Graphics;
  let targetLayer!: Container;
  let nib!: Graphics;
  let hud!: Hud;
  let overlay!: Overlay;

  const build = () => {
    const options = display();
    ({ reducedMotion, textScale } = options);
    const cosmetics = options.cosmetics ?? DEFAULT_COSMETICS;
    for (const child of stage.removeChildren()) child.destroy({ children: true });
    views.clear();
    app.renderer.background.color = COLORS.desk;

    effects = new Effects(reducedMotion, splatterColor(cosmetics.splatter));
    guide = new Graphics();
    targetLayer = new Container();
    nib = drawNib(cosmetics.nib);
    nib.position.set(NIB_HOME.x, NIB_HOME.y);
    hud = new Hud();
    overlay = new Overlay(actions);
    stage.addChild(drawPage(cosmetics.paper), effects.stainLayer, guide, targetLayer, nib, effects.particleLayer, hud.root, overlay.root);

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

  let shakeMs = 0;
  let wobbleMs = 0;
  let lastPhase: GamePhase | null = null;

  const center = (target: Target, view: CreatureView | undefined) => ({
    x: target.x + (view ? view.width / 2 : 0),
    y: target.y - LINE_SPACING / 2,
  });

  const handleEvent = (world: World, event: GameEvent) => {
    switch (event.type) {
      case 'destroyed': {
        const at = center(event.target, views.get(event.target.id));
        effects.splatter(at.x, at.y);
        effects.popup(at.x, at.y - 30, `+${event.points}`);
        break;
      }
      case 'hit': {
        // A crimson or violet creature lost a life: a small splash, and it carries on.
        const at = center(event.target, views.get(event.target.id));
        effects.splatter(at.x, at.y, 5);
        effects.popup(at.x, at.y - 30, `+${event.points}`);
        break;
      }
      case 'boss':
        effects.banner(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 40, t('banner.boss'));
        break;
      case 'split': {
        const at = center(event.target, views.get(event.target.id));
        effects.splatter(at.x, at.y, 16);
        break;
      }
      case 'blotter':
        effects.blotterWave(WORLD_WIDTH, WORLD_HEIGHT);
        effects.banner(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, t('banner.blotter'), COLORS.ink);
        break;
      case 'blotterCharged':
        effects.popup(70 + 200, 60, '+1');
        break;
      case 'marginHit':
        effects.marginStain(MARGIN_X, event.target.y - LINE_SPACING / 2);
        if (!reducedMotion) shakeMs = 300;
        break;
      case 'error': {
        const target = world.targets.find((t) => t.id === event.targetId);
        const at = target ? center(target, views.get(target.id)) : { x: nib.x + 30, y: nib.y };
        effects.smudge(at.x, at.y);
        if (!reducedMotion) wobbleMs = 180;
        break;
      }
      case 'phase':
        // A fresh page (or notebook) starts clean.
        if (event.phase === 'playing' && lastPhase !== 'paused') {
          effects.clearStains();
        }
        lastPhase = event.phase;
        break;
      case 'reset':
        // A restarted or abandoned page starts clean.
        effects.clearStains();
        break;
      case 'locked':
      case 'progress':
        break;
    }
  };

  return {
    app,
    sync(world, alpha, frameMs) {
      for (const event of world.events) handleEvent(world, event);
      world.events.length = 0;

      // Creatures. Animation time only runs while playing, so they freeze when paused.
      if (world.phase === 'playing') timeMs += frameMs;
      const live = new Set<number>();
      let locked: { x: number; y: number } | null = null;
      for (const target of world.targets) {
        live.add(target.id);
        let view = views.get(target.id);
        if (!view) {
          view = createCreature(target, textScale);
          views.set(target.id, view);
          targetLayer.addChild(view.root);
        }
        const x = renderX(target, alpha);
        const y = target.y - LINE_SPACING / 2;
        view.root.position.set(x, y);
        const isLocked = target.id === world.lockedId;
        view.update(target, {
          timeMs,
          dtMs: frameMs,
          locked: isLocked,
          lookX: nib.x - x,
          lookY: nib.y - y,
          reducedMotion,
        });
        if (isLocked) locked = { x, y };
      }
      for (const [id, view] of views) {
        if (!live.has(id)) {
          view.root.destroy({ children: true });
          views.delete(id);
        }
      }

      // The Nib glides toward the locked target's line and points at it.
      const goalY = locked ? Math.min(Math.max(locked.y, FIRST_LINE_Y), WORLD_HEIGHT - LINE_SPACING) : NIB_HOME.y;
      nib.y = approach(nib.y, goalY, 10, frameMs);
      const goalAngle = locked ? Math.atan2(locked.y - nib.y, locked.x - nib.x) : 0;
      nib.rotation = approach(nib.rotation, Math.max(-0.7, Math.min(0.7, goalAngle)), 14, frameMs);

      shakeMs = Math.max(0, shakeMs - frameMs);
      wobbleMs = Math.max(0, wobbleMs - frameMs);
      nib.x = NIB_HOME.x + (shakeMs > 0 ? Math.sin(shakeMs / 18) * 6 * (shakeMs / 300) : 0);
      if (wobbleMs > 0) nib.rotation += Math.sin(wobbleMs / 15) * 0.12 * (wobbleMs / 180);

      // Thin pencil guide line from the nib tip to the locked target.
      guide.clear();
      if (locked) {
        const tipX = nib.x + Math.cos(nib.rotation) * NIB_LENGTH;
        const tipY = nib.y + Math.sin(nib.rotation) * NIB_LENGTH;
        guide.moveTo(tipX, tipY).lineTo(locked.x, locked.y).stroke({ width: 1.5, color: COLORS.pencil, alpha: 0.35 });
      }

      effects.update(frameMs);
      hud.update(world);
      overlay.update(world);
    },
    rebuild() {
      build();
    },
    destroy() {
      app.destroy(true, { children: true });
    },
  };
}

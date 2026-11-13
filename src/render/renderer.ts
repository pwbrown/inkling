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

/** Display options the renderer reads from the player's settings. */
export interface DisplayOptions {
  /** Size multiplier for targets and their text (REQUIREMENTS §10). */
  textScale: number;
  reducedMotion: boolean;
}

function drawPage(): Graphics {
  const page = new Graphics();
  page.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(COLORS.paper);

  for (let y = FIRST_LINE_Y - LINE_SPACING; y < WORLD_HEIGHT - LINE_SPACING / 2; y += LINE_SPACING) {
    page.moveTo(0, y).lineTo(WORLD_WIDTH, y);
  }
  page.stroke({ width: 1.5, color: COLORS.rule });

  page.moveTo(MARGIN_X, 0).lineTo(MARGIN_X, WORLD_HEIGHT).stroke({ width: 2.5, color: COLORS.margin });
  return page;
}

/** Placeholder Nib: a fountain-pen tip that points at what you're typing. */
function drawNib(): Graphics {
  return new Graphics()
    .poly([0, -22, NIB_LENGTH, 0, 0, 22, 10, 0])
    .fill(COLORS.ink)
    .moveTo(14, 0)
    .lineTo(NIB_LENGTH - 6, 0)
    .stroke({ width: 2, color: COLORS.paper })
    .circle(20, 0, 4)
    .fill(COLORS.paper);
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
    ({ reducedMotion, textScale } = display());
    for (const child of stage.removeChildren()) child.destroy({ children: true });
    views.clear();
    app.renderer.background.color = COLORS.desk;

    effects = new Effects(reducedMotion);
    guide = new Graphics();
    targetLayer = new Container();
    nib = drawNib();
    nib.position.set(NIB_HOME.x, NIB_HOME.y);
    hud = new Hud();
    overlay = new Overlay(actions);
    stage.addChild(drawPage(), effects.stainLayer, guide, targetLayer, nib, effects.particleLayer, hud.root, overlay.root);

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

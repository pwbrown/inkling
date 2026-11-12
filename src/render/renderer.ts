/**
 * PixiJS renderer for the play field (REQUIREMENTS §7). Reads game state and
 * draws it; it never changes the state.
 *
 * Milestone 1 art is simple placeholder vector shapes in the Inkwell style
 * (DESIGN §7). It gets swapped for hand-drawn art later.
 */
import { Application, Container, Graphics, Text } from 'pixi.js';
import {
  FIRST_LINE_Y,
  LINE_SPACING,
  MARGIN_X,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  renderX,
  type Target,
  type World,
} from '../core/world';

const COLORS = {
  desk: 0x2b2622,
  paper: 0xf7f1e3,
  rule: 0xb9cfe0,
  margin: 0xd9534f,
  ink: 0x1f2a44,
  inkLight: 0x3a4a6b,
  label: 0xf7f1e3,
} as const;

/** Legible target text (DESIGN §7). Atkinson Hyperlegible gets bundled later. */
const TARGET_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

interface TargetView {
  root: Container;
  label: Text;
  text: string;
}

export interface Renderer {
  app: Application;
  sync(world: World, alpha: number): void;
  destroy(): void;
}

function drawPage(): Graphics {
  const page = new Graphics();
  page.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(COLORS.paper);

  for (let y = FIRST_LINE_Y - LINE_SPACING; y < WORLD_HEIGHT; y += LINE_SPACING) {
    page.moveTo(0, y).lineTo(WORLD_WIDTH, y);
  }
  page.stroke({ width: 1.5, color: COLORS.rule });

  page.moveTo(MARGIN_X, 0).lineTo(MARGIN_X, WORLD_HEIGHT).stroke({ width: 2.5, color: COLORS.margin });
  return page;
}

/** Placeholder Nib: a fountain-pen tip pointing right, resting in the margin. */
function drawNib(): Graphics {
  const nib = new Graphics();
  nib
    .poly([0, -22, 56, 0, 0, 22, 10, 0])
    .fill(COLORS.ink)
    .moveTo(14, 0)
    .lineTo(50, 0)
    .stroke({ width: 2, color: COLORS.paper })
    .circle(20, 0, 4)
    .fill(COLORS.paper);
  nib.position.set(MARGIN_X - 90, WORLD_HEIGHT / 2);
  return nib;
}

function createTargetView(target: Target): TargetView {
  const root = new Container();
  const label = new Text({
    text: target.text,
    style: { fontFamily: TARGET_FONT, fontSize: 26, fontWeight: '600', fill: COLORS.label },
  });
  label.anchor.set(0, 0.5);

  const body = new Graphics();
  root.addChild(body, label);
  redrawBody(body, label);
  return { root, label, text: target.text };
}

/** A lumpy ink blot sized to fit its word: a Blotling (DESIGN §5). */
function redrawBody(body: Graphics, label: Text): void {
  const padX = 18;
  const w = label.width + padX * 2;
  const h = 46;
  label.position.set(padX, 0);

  body.clear();
  body.roundRect(0, -h / 2, w, h, h / 2).fill(COLORS.ink);
  // Little drips and legs give it some character.
  body.circle(w * 0.25, h / 2 + 2, 5).fill(COLORS.inkLight);
  body.circle(w * 0.7, h / 2 + 4, 4).fill(COLORS.inkLight);
  body.circle(w - 6, -h / 2 + 4, 6).fill(COLORS.ink);
}

export async function createRenderer(host: HTMLElement): Promise<Renderer> {
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
  const world = new Container();
  const targetLayer = new Container();
  world.addChild(drawPage(), targetLayer, drawNib());
  app.stage.addChild(world);

  const fit = () => {
    const { width, height } = app.screen;
    const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    world.scale.set(scale);
    world.position.set((width - WORLD_WIDTH * scale) / 2, (height - WORLD_HEIGHT * scale) / 2);
  };
  fit();
  app.renderer.on('resize', fit);

  // Clip anything outside the page (targets spawn off the right edge).
  const mask = new Graphics().rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill(0xffffff);
  world.addChild(mask);
  world.mask = mask;

  const views = new Map<number, TargetView>();

  return {
    app,
    sync(state, alpha) {
      const live = new Set<number>();
      for (const target of state.targets) {
        live.add(target.id);
        let view = views.get(target.id);
        if (!view) {
          view = createTargetView(target);
          views.set(target.id, view);
          targetLayer.addChild(view.root);
        }
        view.root.position.set(renderX(target, alpha), target.y - LINE_SPACING / 2);
      }
      for (const [id, view] of views) {
        if (!live.has(id)) {
          view.root.destroy({ children: true });
          views.delete(id);
        }
      }
    },
    destroy() {
      app.destroy(true, { children: true });
    },
  };
}

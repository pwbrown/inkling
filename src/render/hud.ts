/** Heads-up display: ink well (health), score, combo and page progress (DESIGN §6). */
import { Container, Graphics, Text } from 'pixi.js';
import { APPRENTICE_CHAPTERS, newKeysFor } from '../core/campaign';
import { GAME_CONFIG } from '../core/config';
import { multiplier } from '../core/input';
import { WORLD_HEIGHT, WORLD_WIDTH, type World } from '../core/world';
import { formatNumber, t } from '../i18n';
import { COLORS, TEXT_FONT, keyLabel } from './theme';

const BAR_WIDTH = 180;
const BAR_HEIGHT = 14;

export class Hud {
  readonly root = new Container();
  private readonly inkFill = new Graphics();
  private readonly score: Text;
  private readonly combo: Text;
  private readonly page: Text;
  private lastInk = -1;
  /** Blotter charges, drawn as ink drops beside the ink bar. */
  private readonly blotterDrops = new Graphics();
  private readonly blotterHint: Text;
  private lastBlotter = -1;

  constructor() {
    const label = new Text({ text: t('hud.ink'), style: { fontFamily: TEXT_FONT, fontSize: 16, fontWeight: '600', fill: COLORS.ink } });
    label.position.set(24, 18);

    const frame = new Graphics()
      .roundRect(70, 21, BAR_WIDTH, BAR_HEIGHT, BAR_HEIGHT / 2)
      .stroke({ width: 2, color: COLORS.ink });

    this.score = new Text({ text: '', style: { fontFamily: TEXT_FONT, fontSize: 20, fontWeight: '700', fill: COLORS.ink } });
    this.score.anchor.set(1, 0);
    this.score.position.set(WORLD_WIDTH - 24, 14);

    this.combo = new Text({ text: '', style: { fontFamily: TEXT_FONT, fontSize: 16, fontWeight: '700', fill: COLORS.margin } });
    this.combo.anchor.set(1, 0);
    this.combo.position.set(WORLD_WIDTH - 24, 40);

    this.page = new Text({ text: '', style: { fontFamily: TEXT_FONT, fontSize: 15, fill: COLORS.inkLight } });
    this.page.anchor.set(0.5, 1);
    this.page.position.set(WORLD_WIDTH / 2, WORLD_HEIGHT - 12);

    this.blotterHint = new Text({ text: '', style: { fontFamily: TEXT_FONT, fontSize: 15, fontWeight: '700', fill: COLORS.inkLight } });
    this.blotterHint.position.set(70 + BAR_WIDTH + 52, 18);
    this.root.addChild(label, this.inkFill, frame, this.blotterDrops, this.blotterHint, this.score, this.combo, this.page);
  }

  update(world: World): void {
    if (world.blotter !== this.lastBlotter) {
      this.lastBlotter = world.blotter;
      const g = this.blotterDrops.clear();
      const max = GAME_CONFIG.blotter.maxCharges;
      for (let i = 0; i < max; i++) {
        const x = 70 + BAR_WIDTH + 20 + i * 18;
        const filled = i < world.blotter;
        g.circle(x, 31, 6).poly([x - 5, 28, x, 18, x + 5, 28]);
        if (filled) g.fill(COLORS.ink);
        else g.stroke({ width: 1.5, color: COLORS.inkFaded });
      }
      this.blotterHint.x = 70 + BAR_WIDTH + 20 + max * 18;
      this.blotterHint.text = world.blotter > 0 ? t('hud.blotter') : '';
    }

    if (world.ink !== this.lastInk) {
      this.lastInk = world.ink;
      const ratio = world.ink / world.maxInk;
      this.inkFill.clear();
      if (ratio > 0) {
        this.inkFill
          .roundRect(70, 21, Math.max(BAR_HEIGHT, BAR_WIDTH * ratio), BAR_HEIGHT, BAR_HEIGHT / 2)
          .fill(ratio < 0.3 ? COLORS.margin : COLORS.ink);
      }
    }

    setText(this.score, t('hud.score', { score: formatNumber(world.stats.score) }));
    const mult = multiplier(world.stats.combo);
    setText(this.combo, mult > 1 ? t('hud.multiplier', { multiplier: mult }) : '');

    const { spawned, params, chapter, index, pageCount } = world.page;
    const progress = {
      chapter: chapter + 1,
      page: index + 1,
      pages: pageCount,
      done: spawned - world.targets.length,
      total: params.size,
    };
    // In the Apprentice campaign, say what this chapter is teaching.
    setText(
      this.page,
      world.mode === 'apprentice'
        ? t('hud.apprentice', {
            ...progress,
            chapters: APPRENTICE_CHAPTERS,
            keys: newKeysFor(chapter).map(keyLabel).join(' '),
          })
        : t('hud.page', progress),
    );
  }
}

/** Only touch Text when it changed: re-rendering text is relatively costly. */
function setText(node: Text, value: string): void {
  if (node.text !== value) node.text = value;
}

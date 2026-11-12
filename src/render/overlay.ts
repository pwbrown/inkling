/** Centered message card for the ready, paused, page-cleared and game-over screens. */
import { Container, Graphics, Text } from 'pixi.js';
import { accuracy, topMissedKeys, wpm, type Stats } from '../core/stats';
import { WORLD_HEIGHT, WORLD_WIDTH, type GamePhase, type World } from '../core/world';
import { formatNumber, t } from '../i18n';
import { COLORS, DISPLAY_FONT, TEXT_FONT, keyLabel } from './theme';

const CARD_WIDTH = 560;
const PAD = 32;

interface Content {
  title: string;
  lines: string[];
  prompt: string;
}

function statLines(stats: Stats): string[] {
  const lines = [
    t('overlay.stats', {
      score: formatNumber(stats.score),
      wpm: formatNumber(Math.round(wpm(stats))),
      accuracy: formatNumber(Math.round(accuracy(stats) * 100)),
    }),
  ];
  const missed = topMissedKeys(stats);
  if (missed.length > 0) lines.push(t('overlay.missed', { keys: missed.map(keyLabel).join('  ') }));
  return lines;
}

export function overlayContent(world: World): Content | null {
  switch (world.phase) {
    case 'ready':
      return { title: t('overlay.ready.title'), lines: [t('overlay.ready.body')], prompt: t('overlay.ready.prompt') };
    case 'paused':
      return { title: t('overlay.paused.title'), lines: statLines(world.pageStats), prompt: t('overlay.paused.prompt') };
    case 'pageCleared':
      return {
        title: t('overlay.pageCleared.title', { page: world.page.index + 1 }),
        lines: statLines(world.pageStats),
        prompt: t('overlay.pageCleared.prompt'),
      };
    case 'gameOver':
      return { title: t('overlay.gameOver.title'), lines: statLines(world.stats), prompt: t('overlay.gameOver.prompt') };
    case 'playing':
      return null;
  }
}

export class Overlay {
  readonly root = new Container();
  private readonly card = new Graphics();
  private readonly title: Text;
  private readonly body: Text;
  private readonly prompt: Text;
  private shownFor: GamePhase | null = null;

  constructor() {
    const backdrop = new Graphics().rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill({ color: COLORS.desk, alpha: 0.35 });
    this.title = new Text({ text: '', style: { fontFamily: DISPLAY_FONT, fontSize: 42, fontStyle: 'italic', fill: COLORS.ink } });
    this.body = new Text({
      text: '',
      style: {
        fontFamily: TEXT_FONT,
        fontSize: 20,
        fill: COLORS.inkLight,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CARD_WIDTH - PAD * 2,
        lineHeight: 30,
      },
    });
    this.prompt = new Text({ text: '', style: { fontFamily: TEXT_FONT, fontSize: 18, fontWeight: '700', fill: COLORS.margin } });
    for (const node of [this.title, this.body, this.prompt]) node.anchor.set(0.5, 0);
    this.root.addChild(backdrop, this.card, this.title, this.body, this.prompt);
    this.root.visible = false;
  }

  update(world: World): void {
    // Rebuild only when the screen changes. Stats on these screens are frozen.
    if (world.phase === this.shownFor) return;
    this.shownFor = world.phase;

    const content = overlayContent(world);
    this.root.visible = content !== null;
    if (!content) return;

    this.title.text = content.title;
    this.body.text = content.lines.join('\n');
    this.prompt.text = content.prompt;

    const height = PAD + this.title.height + 16 + this.body.height + 24 + this.prompt.height + PAD;
    const left = (WORLD_WIDTH - CARD_WIDTH) / 2;
    const top = (WORLD_HEIGHT - height) / 2;
    const cx = WORLD_WIDTH / 2;

    this.card
      .clear()
      .roundRect(left + 6, top + 8, CARD_WIDTH, height, 14)
      .fill({ color: COLORS.desk, alpha: 0.25 })
      .roundRect(left, top, CARD_WIDTH, height, 14)
      .fill(COLORS.paper)
      .stroke({ width: 2, color: COLORS.ink });

    this.title.position.set(cx, top + PAD);
    this.body.position.set(cx, this.title.y + this.title.height + 16);
    this.prompt.position.set(cx, this.body.y + this.body.height + 24);
  }
}

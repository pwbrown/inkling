/**
 * Centered message card: the new-notebook screen (with the difficulty
 * picker), paused, page/chapter cleared, and game over.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { DIFFICULTIES, type Difficulty } from '../core/config';
import { accuracy, topMissedKeys, wpm, type Stats } from '../core/stats';
import { WORLD_HEIGHT, WORLD_WIDTH, isLastPageOfChapter, type World } from '../core/world';
import { formatNumber, t, type MessageKey } from '../i18n';
import { COLORS, DISPLAY_FONT, TEXT_FONT, keyLabel } from './theme';

const CARD_WIDTH = 620;
const PAD = 32;
const OPTION_HEIGHT = 52;

export interface OverlayOption {
  id: Difficulty;
  label: string;
  description: string;
  selected: boolean;
}

export interface OverlayContent {
  title: string;
  lines: string[];
  options?: OverlayOption[];
  prompt: string;
}

export interface OverlayActions {
  onPick(difficulty: Difficulty): void;
  onConfirm(): void;
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

export function difficultyLabel(difficulty: Difficulty): string {
  return t(`difficulty.${difficulty}` as MessageKey);
}

/** What the card shows for the current phase, or null while playing. */
export function overlayContent(world: World): OverlayContent | null {
  const chapter = world.page.chapter + 1;
  const page = world.page.index + 1;

  switch (world.phase) {
    case 'ready':
      return {
        title: t('overlay.ready.title'),
        lines: [t('overlay.ready.body'), t('overlay.ready.choose')],
        options: DIFFICULTIES.map((id) => ({
          id,
          label: difficultyLabel(id),
          description: t(`difficulty.${id}.description` as MessageKey),
          selected: id === world.selectedDifficulty,
        })),
        prompt: t('overlay.ready.prompt'),
      };
    case 'paused':
      return { title: t('overlay.paused.title'), lines: statLines(world.pageStats), prompt: t('overlay.paused.prompt') };
    case 'pageCleared':
      if (isLastPageOfChapter(world.page)) {
        const lines = statLines(world.pageStats);
        if (world.inkRefilled > 0) lines.push(t('overlay.chapterCleared.refill', { ink: world.inkRefilled }));
        return {
          title: t('overlay.chapterCleared.title', { chapter }),
          lines,
          prompt: t('overlay.chapterCleared.prompt', { next: chapter + 1 }),
        };
      }
      return {
        title: t('overlay.pageCleared.title', { page }),
        lines: statLines(world.pageStats),
        prompt: t('overlay.pageCleared.prompt'),
      };
    case 'gameOver':
      return {
        title: t('overlay.gameOver.title'),
        lines: [
          t('overlay.gameOver.reached', { difficulty: difficultyLabel(world.difficulty), chapter, page }),
          ...statLines(world.stats),
        ],
        prompt: t('overlay.gameOver.prompt'),
      };
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
  private readonly optionsLayer = new Container();
  /** Rebuild only when what's shown changes. */
  private shownKey: string | null = null;

  constructor(private readonly actions: OverlayActions) {
    // The backdrop swallows clicks so they don't reach anything underneath.
    const backdrop = new Graphics().rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill({ color: COLORS.desk, alpha: 0.35 });
    backdrop.eventMode = 'static';
    this.title = new Text({ text: '', style: { fontFamily: DISPLAY_FONT, fontSize: 40, fontStyle: 'italic', fill: COLORS.ink } });
    this.body = new Text({
      text: '',
      style: {
        fontFamily: TEXT_FONT,
        fontSize: 19,
        fill: COLORS.inkLight,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: CARD_WIDTH - PAD * 2,
        lineHeight: 28,
      },
    });
    this.prompt = new Text({ text: '', style: { fontFamily: TEXT_FONT, fontSize: 18, fontWeight: '700', fill: COLORS.margin } });
    this.prompt.eventMode = 'static';
    this.prompt.cursor = 'pointer';
    this.prompt.on('pointertap', () => this.actions.onConfirm());
    for (const node of [this.title, this.body, this.prompt]) node.anchor.set(0.5, 0);
    this.root.addChild(backdrop, this.card, this.title, this.body, this.optionsLayer, this.prompt);
    this.root.visible = false;
  }

  update(world: World): void {
    const key = `${world.phase}|${world.selectedDifficulty}`;
    if (key === this.shownKey) return;
    this.shownKey = key;

    const content = overlayContent(world);
    this.root.visible = content !== null;
    if (!content) return;

    this.title.text = content.title;
    this.body.text = content.lines.join('\n');
    this.prompt.text = content.prompt;
    for (const child of this.optionsLayer.removeChildren()) child.destroy({ children: true });

    const options = content.options ?? [];
    const optionsHeight = options.length > 0 ? options.length * OPTION_HEIGHT + 12 : 0;
    const height = PAD + this.title.height + 14 + this.body.height + 16 + optionsHeight + 16 + this.prompt.height + PAD;
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
    this.body.position.set(cx, this.title.y + this.title.height + 14);

    const optionsTop = this.body.y + this.body.height + 16;
    options.forEach((option, i) => {
      this.optionsLayer.addChild(this.createOption(option, i, left + PAD, optionsTop + i * OPTION_HEIGHT));
    });

    this.prompt.position.set(cx, optionsTop + optionsHeight + (options.length > 0 ? 4 : 0));
  }

  private createOption(option: OverlayOption, index: number, x: number, y: number): Container {
    const width = CARD_WIDTH - PAD * 2;
    const row = new Container();
    row.position.set(x, y);
    row.eventMode = 'static';
    row.cursor = 'pointer';
    row.on('pointertap', () => this.actions.onPick(option.id));

    const bg = new Graphics().roundRect(0, 0, width, OPTION_HEIGHT - 6, 10);
    if (option.selected) bg.fill({ color: COLORS.highlighter, alpha: 0.8 }).stroke({ width: 2, color: COLORS.ink });
    else bg.fill({ color: COLORS.paper, alpha: 0.01 }).stroke({ width: 1, color: COLORS.rule });

    // Selection is shown by an underline-style marker too, not by color alone (DESIGN §7).
    const marker = new Text({
      text: option.selected ? '▸' : ' ',
      style: { fontFamily: TEXT_FONT, fontSize: 20, fontWeight: '700', fill: COLORS.ink },
    });
    marker.position.set(10, 10);

    const label = new Text({
      text: `${index + 1}  ${option.label}`,
      style: { fontFamily: TEXT_FONT, fontSize: 19, fontWeight: '700', fill: COLORS.ink },
    });
    label.position.set(30, 11);

    const description = new Text({
      text: option.description,
      style: { fontFamily: TEXT_FONT, fontSize: 15, fill: COLORS.inkLight },
    });
    description.position.set(170, 14);

    row.addChild(bg, marker, label, description);
    return row;
  }
}

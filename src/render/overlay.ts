/**
 * Centered in-game card: the graded page / chapter complete, and game over.
 * The main menu and pause menu are DOM screens (src/ui/menu.ts).
 */
import { Container, Graphics, Text } from 'pixi.js';
import type { Difficulty } from '../core/config';
import { pageGrade, teacherNote, type Grade } from '../core/grade';
import { accuracy, topMissedKeys, wpm, type Stats } from '../core/stats';
import { WORLD_HEIGHT, WORLD_WIDTH, isLastPageOfChapter, type World } from '../core/world';
import { formatNumber, t, type MessageKey } from '../i18n';
import { COLORS, DISPLAY_FONT, TEXT_FONT, keyLabel } from './theme';

const CARD_WIDTH = 620;
const PAD = 32;
export type OverlayLinkId = 'retry' | 'mainMenu';

export interface OverlayLink {
  id: OverlayLinkId;
  label: string;
}

export interface OverlayContent {
  title: string;
  /** Red-pen grade for a finished page (DESIGN §6). */
  grade?: Grade;
  lines: string[];
  /** Keys drawn circled in red, the teacher's way of flagging them. */
  circled?: string[];
  /** Teacher's note in the margin. */
  note?: string;
  /** Clickable links above the prompt (e.g. "Main menu"). */
  links?: OverlayLink[];
  prompt: string;
}

/** App state the overlay shows that isn't part of the game world (it comes from the save). */
export interface OverlayContext {
  /** Extra lines for a screen, e.g. best score or "New best score!". */
  extraLines(world: World): string[];
}

/** Click handlers and lookups the overlay needs from the app. */
export interface OverlayActions extends OverlayContext {
  onConfirm(): void;
  onLink(id: OverlayLinkId): void;
}

const NO_CONTEXT: OverlayContext = {
  extraLines: () => [],
};

function summaryLine(stats: Stats): string {
  return t('overlay.stats', {
    score: formatNumber(stats.score),
    wpm: formatNumber(Math.round(wpm(stats))),
    accuracy: formatNumber(Math.round(accuracy(stats) * 100)),
  });
}

function statLines(stats: Stats): string[] {
  const lines = [summaryLine(stats)];
  const missed = topMissedKeys(stats);
  if (missed.length > 0) lines.push(t('overlay.missed', { keys: missed.map(keyLabel).join('  ') }));
  return lines;
}

export function difficultyLabel(difficulty: Difficulty): string {
  return t(`difficulty.${difficulty}` as MessageKey);
}

/** What the card shows for the current phase, or null while playing. */
export function overlayContent(world: World, context: OverlayContext = NO_CONTEXT): OverlayContent | null {
  const chapter = world.page.chapter + 1;
  const page = world.page.index + 1;
  const extra = context.extraLines(world);

  switch (world.phase) {
    case 'pageCleared': {
      const stats = world.pageStats;
      const grade = pageGrade(stats, world.page.params.size);
      const note = teacherNote(stats, grade);
      const lines = [summaryLine(stats)];
      if (stats.leaks > 0) lines.push(t('overlay.leaks', { leaks: stats.leaks }));
      const lastPage = isLastPageOfChapter(world.page);
      if (lastPage && world.inkRefilled > 0) lines.push(t('overlay.chapterCleared.refill', { ink: world.inkRefilled }));
      lines.push(...extra);
      return {
        title: lastPage ? t('overlay.chapterCleared.title', { chapter }) : t('overlay.pageCleared.title', { page }),
        grade,
        lines,
        circled: topMissedKeys(stats),
        note: t(`note.${note.kind}` as MessageKey, { key: note.key ? keyLabel(note.key) : '' }),
        prompt: lastPage ? t('overlay.chapterCleared.prompt', { next: chapter + 1 }) : t('overlay.pageCleared.prompt'),
      };
    }
    case 'gameOver':
      return {
        title: t('overlay.gameOver.title'),
        lines: [
          t('overlay.gameOver.reached', { difficulty: difficultyLabel(world.difficulty), chapter, page }),
          ...statLines(world.stats),
          ...extra,
        ],
        links: [
          { id: 'retry', label: t('overlay.gameOver.retry') },
          { id: 'mainMenu', label: t('overlay.gameOver.mainMenu') },
        ],
        prompt: t('overlay.gameOver.prompt'),
      };
    case 'ready':
    case 'paused':
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
  private readonly linksLayer = new Container();
  private readonly gradeText: Text;
  private readonly circledLayer = new Container();
  private readonly note: Text;
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
    // The red-pen grade, scrawled at an angle in the card's corner.
    this.gradeText = new Text({
      text: '',
      style: { fontFamily: DISPLAY_FONT, fontSize: 64, fontStyle: 'italic', fontWeight: '700', fill: COLORS.margin },
    });
    this.gradeText.anchor.set(0.5);
    this.gradeText.rotation = -0.18;
    this.note = new Text({
      text: '',
      style: { fontFamily: DISPLAY_FONT, fontSize: 22, fontStyle: 'italic', fill: COLORS.margin },
    });
    this.note.anchor.set(0.5, 0);
    this.root.addChild(
      backdrop,
      this.card,
      this.title,
      this.gradeText,
      this.body,
      this.circledLayer,
      this.note,
      this.linksLayer,
      this.prompt,
    );
    this.root.visible = false;
  }

  update(world: World): void {
    if (world.phase === 'playing' || world.phase === 'ready' || world.phase === 'paused') {
      this.root.visible = false;
      this.shownKey = null;
      return;
    }
    // Menus are cheap to describe, so compare the content itself.
    const content = overlayContent(world, this.actions);
    const key = JSON.stringify(content);
    if (key === this.shownKey) return;
    this.shownKey = key;
    this.root.visible = content !== null;
    if (!content) return;

    this.title.text = content.title;
    this.body.text = content.lines.join('\n');
    this.prompt.text = content.prompt;

    const linksHeight = this.layoutLinks(content.links ?? []);
    const circledHeight = this.layoutCircled(content.circled ?? []);
    this.note.text = content.note ?? '';
    this.note.visible = Boolean(content.note);
    const noteHeight = content.note ? this.note.height + 12 : 0;
    this.gradeText.text = content.grade ?? '';
    this.gradeText.visible = Boolean(content.grade);
    const height =
      PAD +
      this.title.height +
      14 +
      this.body.height +
      16 +
      circledHeight +
      noteHeight +
      linksHeight +
      16 +
      this.prompt.height +
      PAD;
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

    this.gradeText.position.set(left + CARD_WIDTH - 62, top + 52);
    this.circledLayer.position.set(cx, this.body.y + this.body.height + 12);
    this.note.position.set(cx, this.circledLayer.y + circledHeight);

    const linksTop = this.body.y + this.body.height + 16 + circledHeight + noteHeight;
    this.linksLayer.position.set(cx, linksTop);
    this.prompt.position.set(cx, linksTop + linksHeight);
  }

  /** "Keys to watch:" with each key circled in red pen. Returns the height used. */
  private layoutCircled(keys: string[]): number {
    for (const child of this.circledLayer.removeChildren()) child.destroy({ children: true });
    if (keys.length === 0) return 0;

    const label = new Text({ text: t('overlay.circled'), style: { fontFamily: TEXT_FONT, fontSize: 17, fill: COLORS.inkLight } });
    label.anchor.set(0, 0.5);
    const items: Container[] = [label];
    for (const key of keys) {
      const item = new Container();
      const glyphText = new Text({
        text: keyLabel(key),
        style: { fontFamily: TEXT_FONT, fontSize: 22, fontWeight: '700', fill: COLORS.ink },
      });
      glyphText.anchor.set(0.5);
      const rx = Math.max(18, glyphText.width / 2 + 12);
      // A clean red circle, like a teacher's pen mark.
      const ring = new Graphics().ellipse(0, 0, rx, 18).stroke({ width: 2.5, color: COLORS.margin });
      item.addChild(ring, glyphText);
      items.push(item);
    }

    const gap = 22;
    const widths = items.map((item, i) => (i === 0 ? item.width : item.width));
    const total = widths.reduce((sum, w) => sum + w, 0) + gap * (items.length - 1);
    let x = -total / 2;
    items.forEach((item, i) => {
      // Labels are anchored at their left edge, circles at their center.
      item.position.set(i === 0 ? x : x + widths[i]! / 2, 22);
      x += widths[i]! + gap;
      this.circledLayer.addChild(item);
    });
    return 52;
  }

  /**
   * Lay links out centered on x = 0: in a row if they fit the card, else
   * stacked. Returns the height they need.
   */
  private layoutLinks(links: OverlayLink[]): number {
    for (const child of this.linksLayer.removeChildren()) child.destroy();
    const texts = links.map((link) => {
      const text = new Text({
        text: link.label,
        style: { fontFamily: TEXT_FONT, fontSize: 17, fontWeight: '600', fill: COLORS.inkLight, fontStyle: 'italic' },
      });
      text.eventMode = 'static';
      text.cursor = 'pointer';
      text.on('pointertap', () => this.actions.onLink(link.id));
      this.linksLayer.addChild(text);
      return text;
    });
    if (texts.length === 0) return 0;

    const gap = 30;
    const rowWidth = texts.reduce((sum, text) => sum + text.width, 0) + gap * (texts.length - 1);
    if (rowWidth <= CARD_WIDTH - PAD * 2) {
      let x = -rowWidth / 2;
      for (const text of texts) {
        text.position.set(x, 0);
        x += text.width + gap;
      }
      return (texts[0]?.height ?? 0) + 14;
    }
    let y = 0;
    for (const text of texts) {
      text.position.set(-text.width / 2, y);
      y += text.height + 6;
    }
    return y + 8;
  }

}

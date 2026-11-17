/**
 * Main menu, new-notebook step, How to play, and the pause menu: plain DOM,
 * like the other dialogs, so they work with the keyboard and screen readers.
 * Shown over the (dimmed) page whenever the game isn't being played.
 */
import './dialog.css';
import './menu.css';
import './stickers.css';
import { DIFFICULTIES, type Difficulty } from '../core/config';
import { DAILY_PAGES, type PageMark, type StreakDay } from '../core/daily';
import type { Grade } from '../core/grade';
import type { MechanicId } from '../core/mechanics';
import { UNLOCKS, isUnlocked, type CosmeticSlot, type Cosmetics } from '../core/rewards';
import { getLocale, t, type MessageKey } from '../i18n';
import { CONTENT_LEVELS, type ContentLevel } from '../content/contentFilter';
import { BADGES, MAX_NAME_LENGTH, type Badge } from '../storage/profiles';
import { artElement, badgeSvg, cosmeticSvg, dayDropSvg, streakDropSvg } from './art';
import { stickerArt } from './stickerToast';
import { h } from './dom';

export type MenuScreen = 'title' | 'contents' | 'newNotebook' | 'howToPlay' | 'pause' | 'desk' | 'players' | 'playerEdit' | 'about' | 'daily' | 'stickers';

/** Inky Keys' source code and issue forms. */
export const REPO_URL = 'https://github.com/pwbrown/inky-keys';
export const ISSUES_URL = `${REPO_URL}/issues/new/choose`;

export interface PlayerEntry {
  id: string;
  name: string;
  badge: Badge;
  /** e.g. "Scribe · Level 5 · Apprentice chapter 4". */
  detail: string;
  active: boolean;
  /** The player's word filter. */
  contentLevel: ContentLevel;
}

/** A times-table question a grown-up answers before the word filter is loosened. */
interface GrownUpCheck {
  level: ContentLevel;
  a: number;
  b: number;
  answer: string;
  wrong: boolean;
}

export interface ChapterEntry {
  /** 0-based. */
  chapter: number;
  /** e.g. "R U". */
  newKeys: string;
  stars: { earned: number; max: number };
  locked: boolean;
  /** e.g. "best 1,240" at the selected difficulty, or null before any page is cleared. */
  best: string | null;
}

/** One sticker in the book. */
export interface StickerEntry {
  id: string;
  emoji: string;
  group: string;
  name: string;
  how: string;
  /** e.g. "Earned 17 Nov 2026", or null if not earned yet. */
  earnedOn: string | null;
  /** Earned since the book was last opened. */
  isNew: boolean;
}

export interface StickerShelf {
  /** e.g. "Bosses". */
  title: string;
  stickers: StickerEntry[];
}

/** The Daily Page screen. */
export interface DailyView {
  /** Today's Daily Page number. */
  id: number;
  /** e.g. "Not played yet" or "Score 4,820 · 62 WPM · 97%". */
  status: string;
  /** Days in a row, as of today. */
  streak: number;
  /** This week, Monday to Sunday, with the days played. */
  week: StreakDay[];
  /** Each page's grade and colour, once today's is played. */
  pages: { page: number; grade: Grade | null; mark: PageMark }[] | null;
  /** e.g. "Streak: 3 days · best 5 · best score 6,120". */
  record: string;
  /** Text to copy and share, once today's is played. */
  shareText: string | null;
  played: boolean;
}

export interface MenuHooks {
  /** Saved notebook to continue, if any. */
  continueDetail(): string | null;
  /** e.g. "Home row · 10 keys". */
  keysSummary(): string;
  /** A picture of the creature for a mechanic, as an image URL (shared with the briefing cards). */
  portrait(id: MechanicId): string | null;
  /** The player's keys on a keyboard with hands, as an image URL, or null. */
  handsPicture(): string | null;
  /** e.g. "Chapter 3 of 10 · ★ 14 of 102". */
  apprenticeDetail(): string;
  /** Every Apprentice chapter, for the Contents page. */
  chapters(): ChapterEntry[];
  onStartApprentice(chapter: number): void;
  /** e.g. "Scribe · Level 5 · 120 of 600 ink to the next level". */
  rankLine(): string;
  /** Ink progress through the current level, 0..1. */
  levelFraction(): number;
  level(): number;
  cosmetics(): Cosmetics;
  onEquip(slot: CosmeticSlot, item: string): void;
  /** e.g. "Best on Normal: 1,200 · reached chapter 3", or null. */
  bestLine(difficulty: Difficulty): string | null;
  /** Stats line for the page in progress, shown when paused. */
  pauseSummary(): string;
  selectedDifficulty(): Difficulty;
  onSelectDifficulty(difficulty: Difficulty): void;
  onContinue(): void;
  onStart(): void;
  onKeys(): void;
  onWordLists(): void;
  onSettings(): void;
  onSaveData(): void;
  onResume(): void;
  onRestart(): void;
  onQuit(): void;
  /** Paused in an Apprentice chapter, so "Practice these keys" is offered. */
  canPracticeChapterKeys(): boolean;
  /** Leave the Apprentice chapter and practice its keys at the same difficulty. */
  onPracticeChapterKeys(): void;
  /** The chapter whose keys "Use my Apprentice keys" picks (1-based). */
  apprenticeKeysChapter(): number;
  onUseApprenticeKeys(): void;
  players(): PlayerEntry[];
  activePlayer(): { name: string; badge: Badge };
  canAddPlayer(): boolean;
  onChoosePlayer(id: string): void;
  /** Add (`id` null) or edit a player. Resolves false if the name is unusable. */
  onSavePlayer(id: string | null, name: string, badge: Badge, contentLevel: ContentLevel): Promise<boolean>;
  onDeletePlayer(id: string): void;
  /** e.g. "2.6.0". */
  appVersion(): string;
  /** Open the release notes. */
  onWhatsNew(): void;
  daily(): DailyView;
  /** e.g. "#3 · not played yet" for the title screen. */
  dailyDetail(): string;
  onPlayDaily(): void;
  /** Copy the share text. Resolves false if the clipboard isn't available. */
  onCopyDaily(): Promise<boolean>;
  /** e.g. "7 of 26 stickers · 2 new!". */
  stickerDetail(): string;
  stickerBook(): { shelves: StickerShelf[]; earned: number; total: number };
  /** The book was opened: its new stickers have been seen. */
  onStickersSeen(): void;
  /** Off on the day's counted Daily Page, which gets one go. */
  canRestart(): boolean;
}

/** The GitHub mark, for the About page's link to the source. */
const GITHUB_SVG = `<svg class="art art-github" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`;

/** The Inky Keys wordmark: an ink drop beside the name, drawn in SVG. */
const LOGO_SVG = `
<svg class="menu-logo" viewBox="0 0 390 96" role="img" aria-label="Inky Keys">
  <path class="logo-drop" d="M44 6 L26 48 A21 21 0 1 0 62 48 Z"/>
  <circle class="logo-eye" cx="38" cy="62" r="4.2"/><circle class="logo-eye" cx="52" cy="62" r="4.2"/>
  <circle class="logo-shine" cx="34" cy="50" r="3"/>
  <path class="logo-smile" d="M39 72 q6 5 12 0"/>
  <text class="logo-word" x="80" y="70">Inky Keys</text>
  <path class="logo-underline" d="M84 82 C160 74 270 90 366 78"/>
</svg>`;

export class Menu {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private current: MenuScreen | null = null;
  /** The player being added (id null) or edited on the playerEdit screen. */
  private editing: {
    id: string | null;
    name: string;
    badge: Badge;
    contentLevel: ContentLevel;
    /** The filter when the form opened: loosening past it needs a grown-up. */
    savedLevel: ContentLevel;
    check: GrownUpCheck | null;
    confirmDelete: boolean;
    error: string | null;
  } | null = null;

  constructor(
    host: HTMLElement,
    private readonly hooks: MenuHooks,
  ) {
    this.panel = h('div', { className: 'tc-panel menu-panel' });
    this.root = h('div', { className: 'dialog menu', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'menu-title' }, [
      this.panel,
    ]);
    this.root.hidden = true;
    this.root.addEventListener('keydown', (event) => this.onKeyDown(event));
    host.append(this.root);
  }

  get screen(): MenuScreen | null {
    return this.current;
  }

  get visible(): boolean {
    return this.current !== null;
  }

  show(screen: MenuScreen): void {
    this.current = screen;
    this.root.hidden = false;
    this.root.dataset.screen = screen;
    this.render();
  }

  hide(): void {
    this.current = null;
    this.root.hidden = true;
    // Don't leave focus on a hidden button, or its key handler would keep
    // receiving the player's typing.
    if (this.root.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
  }

  /** Redraw the current screen (e.g. after keys or saves changed). */
  refresh(): void {
    if (this.current) this.render(false);
  }

  private render(focus = true): void {
    const focused = this.panel.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.id : undefined;
    // Redrawing the same screen keeps its scroll position, so choices don't jump.
    const scrollTop = focus ? 0 : this.panel.scrollTop;
    switch (this.current) {
      case 'title':
        this.panel.replaceChildren(...this.title());
        break;
      case 'newNotebook':
        this.panel.replaceChildren(...this.newNotebook());
        break;
      case 'contents':
        this.panel.replaceChildren(...this.contents());
        break;
      case 'desk':
        this.panel.replaceChildren(...this.desk());
        break;
      case 'howToPlay':
        this.panel.replaceChildren(...this.howToPlay());
        break;
      case 'pause':
        this.panel.replaceChildren(...this.pause());
        break;
      case 'players':
        this.panel.replaceChildren(...this.players());
        break;
      case 'playerEdit':
        this.panel.replaceChildren(...this.playerEdit());
        break;
      case 'about':
        this.panel.replaceChildren(...this.about());
        break;
      case 'daily':
        this.panel.replaceChildren(...this.daily());
        break;
      case 'stickers':
        this.panel.replaceChildren(...this.stickers());
        break;
      default:
        return;
    }
    this.panel.scrollTop = scrollTop;
    const restore = focused ? this.panel.querySelector<HTMLElement>(`[data-id="${focused}"]`) : null;
    if (restore) restore.focus({ preventScroll: true });
    else if (focus) (this.panel.querySelector<HTMLElement>('[data-autofocus]') ?? this.buttons()[0])?.focus();
  }

  /** A big menu button with an optional detail line and shortcut hint. */
  private button(id: string, label: string, onClick: () => void, opts: { detail?: string | null; key?: string; primary?: boolean } = {}) {
    return h(
      'button',
      {
        type: 'button',
        className: `menu-btn${opts.primary ? ' menu-primary' : ''}`,
        'data-id': id,
        'data-key': opts.key,
        onClick,
      },
      [
        h('span', { className: 'menu-label' }, [label]),
        opts.detail ? h('span', { className: 'menu-detail' }, [opts.detail]) : null,
        opts.key ? h('kbd', { className: 'menu-key', 'aria-hidden': 'true' }, [opts.key.toUpperCase()]) : null,
      ],
    );
  }

  private title(): HTMLElement[] {
    const logo = h('div', { className: 'menu-logo-wrap' });
    logo.innerHTML = LOGO_SVG;
    const cont = this.hooks.continueDetail();
    const best = this.hooks.bestLine(this.hooks.selectedDifficulty());
    const player = this.hooks.activePlayer();
    return [
      h('header', { className: 'menu-header' }, [
        logo,
        h('h1', { id: 'menu-title', className: 'visually-hidden' }, ['Inky Keys']),
        h('p', { className: 'menu-tagline' }, [t('menu.tagline')]),
      ]),
      h(
        'button',
        { type: 'button', className: 'menu-player', 'data-id': 'player', 'data-key': 'u', onClick: () => this.show('players') },
        [
          artElement(badgeSvg(player.badge), 'menu-player-badge'),
          h('span', { className: 'menu-player-name' }, [t('menu.player', { name: player.name })]),
          h('span', { className: 'menu-player-switch' }, [t('menu.switchPlayer'), ' ', h('kbd', { 'aria-hidden': 'true' }, ['U'])]),
        ],
      ),
      h('nav', { className: 'menu-list' }, [
        cont ? this.button('continue', t('menu.continue'), () => this.hooks.onContinue(), { detail: cont, key: 'c', primary: true }) : null,
        this.button('practice', t('menu.practice'), () => this.show('newNotebook'), {
          detail: t('menu.practiceDetail', { keys: this.hooks.keysSummary() }),
          key: 'f',
          primary: !cont,
        }),
        this.button('apprentice', t('menu.apprentice'), () => this.show('contents'), {
          detail: this.hooks.apprenticeDetail(),
          key: 'a',
        }),
        this.button('daily', t('menu.daily'), () => this.show('daily'), { detail: this.hooks.dailyDetail(), key: 't' }),
        this.button('stickers', t('menu.stickers'), () => this.show('stickers'), { detail: this.hooks.stickerDetail(), key: 'k' }),
        this.button('words', t('menu.wordLists'), () => this.hooks.onWordLists(), { key: 'w' }),
        this.button('desk', t('menu.desk'), () => this.show('desk'), { detail: t('menu.deskDetail'), key: 'd' }),
        h('div', { className: 'menu-row' }, [
          this.button('settings', t('menu.settings'), () => this.hooks.onSettings(), { key: 's' }),
          this.button('saves', t('menu.saveData'), () => this.hooks.onSaveData(), { key: 'b' }),
          this.button('how', t('menu.howToPlay'), () => this.show('howToPlay'), { key: 'h' }),
          this.button('about', t('menu.about'), () => this.show('about'), { key: 'i' }),
        ]),
      ]),
      h('p', { className: 'menu-best' }, [this.hooks.rankLine(), best ? h('br') : null, best]),
    ];
  }

  /** The Desk: rank, level progress, and cosmetics to equip. */
  private desk(): HTMLElement[] {
    const level = this.hooks.level();
    const equipped = this.hooks.cosmetics();
    const bar = h('div', { className: 'desk-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 });
    const pct = Math.round(this.hooks.levelFraction() * 100);
    bar.setAttribute('aria-valuenow', String(pct));
    bar.style.setProperty('--fill', `${pct}%`);

    const group = (slot: CosmeticSlot) =>
      h('fieldset', { className: 'st-group' }, [
        h('legend', {}, [t(`desk.${slot}` as MessageKey)]),
        h(
          'div',
          { className: 'desk-options', role: 'radiogroup', 'aria-label': t(`desk.${slot}` as MessageKey) },
          Object.entries(UNLOCKS[slot]).map(([item, at]) => {
            // Something already in use stays usable, even if levels were rebalanced since.
            const open = isUnlocked(slot, item as never, level) || equipped[slot] === item;
            return h(
              'button',
              {
                type: 'button',
                role: 'radio',
                className: 'menu-btn desk-option',
                'aria-checked': String(equipped[slot] === item),
                'data-id': `${slot}-${item}`,
                'data-slot': slot,
                'data-item': item,
                disabled: !open,
                onClick: () => {
                  this.hooks.onEquip(slot, item);
                  this.render(false);
                },
              },
              [
                artElement(cosmeticSvg(slot, item), 'desk-art'),
                h('span', { className: 'menu-label' }, [t(`${slot}.${item}` as MessageKey)]),
                open ? null : h('span', { className: 'menu-detail' }, [t('desk.locked', { level: at })]),
              ],
            );
          }),
        ),
      ]);

    return [
      h('h2', { id: 'menu-title' }, [t('desk.title')]),
      h('p', { className: 'tc-intro' }, [t('desk.intro')]),
      h('p', { className: 'menu-keys-line' }, [this.hooks.rankLine()]),
      bar,
      group('nib'),
      group('splatter'),
      group('paper'),
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-primary', 'data-id': 'back', 'data-autofocus': true, onClick: () => this.show('title') }, [
          t('menu.back'),
        ]),
      ]),
    ];
  }

  /** Difficulty choice, shared by the Contents and Practice screens. */
  private difficultyPicker(compact: boolean): HTMLElement {
    const selected = this.hooks.selectedDifficulty();
    return h(
      'div',
      { className: `menu-difficulties${compact ? ' menu-difficulties-compact' : ''}`, role: 'radiogroup', 'aria-label': t('newNotebook.intro') },
      DIFFICULTIES.map((d, i) =>
        h(
          'button',
          {
            type: 'button',
            role: 'radio',
            'aria-checked': String(d === selected),
            className: 'menu-btn menu-difficulty',
            'data-id': `difficulty-${d}`,
            'data-key': String(i + 1),
            onClick: () => {
              this.hooks.onSelectDifficulty(d);
              this.render(false);
            },
          },
          [
            h('span', { className: 'menu-label' }, [t(`difficulty.${d}` as MessageKey)]),
            compact ? null : h('span', { className: 'menu-detail' }, [t(`difficulty.${d}.description` as MessageKey)]),
            h('kbd', { className: 'menu-key', 'aria-hidden': 'true' }, [String(i + 1)]),
          ],
        ),
      ),
    );
  }

  /** The Apprentice notebook's table of contents: pick a chapter to play. */
  private contents(): HTMLElement[] {
    const chapters = this.hooks.chapters();
    const nextOpen = [...chapters].reverse().find((c) => !c.locked);
    return [
      h('h2', { id: 'menu-title' }, [t('contents.title')]),
      h('p', { className: 'tc-intro' }, [t('contents.intro')]),
      this.difficultyPicker(true),
      h(
        'ol',
        { className: 'menu-chapters' },
        chapters.map((c) =>
          h('li', {}, [
            h(
              'button',
              {
                type: 'button',
                className: 'menu-btn menu-chapter',
                'data-id': `chapter-${c.chapter}`,
                'data-autofocus': c === nextOpen ? true : undefined,
                disabled: c.locked,
                'aria-label': c.locked
                  ? t('contents.lockedLabel', { chapter: c.chapter + 1 })
                  : t('contents.chapterLabel', { chapter: c.chapter + 1, keys: c.newKeys, earned: c.stars.earned, max: c.stars.max }),
                onClick: () => this.hooks.onStartApprentice(c.chapter),
              },
              [
                h('span', { className: 'menu-label' }, [t('contents.chapter', { chapter: c.chapter + 1 })]),
                h('span', { className: 'menu-detail' }, [
                  c.locked ? t('contents.locked') : t('contents.keys', { keys: c.newKeys }),
                  !c.locked && c.best ? ` · ${c.best}` : '',
                ]),
                h('span', { className: 'menu-stars', 'aria-hidden': 'true' }, [
                  c.locked ? '🔒' : `★ ${c.stars.earned}/${c.stars.max}`,
                ]),
              ],
            ),
          ]),
        ),
      ),
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-secondary', 'data-id': 'back', onClick: () => this.show('title') }, [t('menu.back')]),
      ]),
    ];
  }

  private newNotebook(): HTMLElement[] {
    return [
      h('h2', { id: 'menu-title' }, [t('newNotebook.title')]),
      h('p', { className: 'tc-intro' }, [t('newNotebook.intro')]),
      this.difficultyPicker(false),
      h('p', { className: 'menu-keys-line' }, [
        t('newNotebook.keys', { keys: this.hooks.keysSummary() }),
        ' ',
        h('button', { type: 'button', className: 'menu-link', 'data-id': 'change-keys', onClick: () => this.hooks.onKeys() }, [
          t('newNotebook.changeKeys'),
        ]),
      ]),
      h('p', { className: 'menu-keys-line' }, [
        h(
          'button',
          {
            type: 'button',
            className: 'menu-link',
            'data-id': 'apprentice-keys',
            onClick: () => {
              this.hooks.onUseApprenticeKeys();
              this.render(false);
            },
          },
          [t('newNotebook.useApprentice', { chapter: this.hooks.apprenticeKeysChapter() })],
        ),
      ]),
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-secondary', 'data-id': 'back', onClick: () => this.show('title') }, [t('menu.back')]),
        h('button', { type: 'button', className: 'tc-primary', 'data-id': 'start', 'data-autofocus': true, onClick: () => this.hooks.onStart() }, [
          t('newNotebook.start'),
        ]),
      ]),
    ];
  }

  private howToPlay(): HTMLElement[] {
    const section = (title: MessageKey, ...body: (HTMLElement | string | null)[]) =>
      h('section', { className: 'how-section' }, [h('h3', {}, [t(title)]), ...body]);
    const p = (key: MessageKey) => h('p', {}, [t(key)]);
    // Pictures are drawn by the game renderer; if one can't be, the words still stand.
    const picture = (id: MechanicId) => {
      const src = this.hooks.portrait(id);
      return src ? h('img', { className: 'how-art', src, alt: '' }) : h('span', { className: 'how-art how-art-none', 'aria-hidden': 'true' }, ['✎']);
    };
    const creature = (id: MechanicId, text: MessageKey) => h('li', { className: 'how-creature' }, [picture(id), h('p', {}, [t(text)])]);
    const variant = (id: MechanicId) =>
      h('figure', { className: 'how-variant' }, [picture(id), h('figcaption', {}, [t(`tutorial.${id}.title` as MessageKey)])]);
    const control = (keys: string[], action: MessageKey) =>
      h('div', { className: 'how-control' }, [
        h('dt', {}, keys.map((k) => h('kbd', {}, [k]))),
        h('dd', {}, [t(action)]),
      ]);
    const hands = this.hooks.handsPicture();
    return [
      h('h2', { id: 'menu-title' }, [t('how.title')]),
      section('how.goalTitle', p('how.goal')),
      section('how.modesTitle', p('how.modes')),
      section(
        'how.creaturesTitle',
        h('ul', { className: 'how-creatures' }, [
          creature('basics', 'how.drip'),
          creature('blotling', 'how.blotling'),
          creature('runon', 'how.runon'),
          creature('recovery', 'how.bottle'),
        ]),
      ),
      section('how.variantsTitle', h('div', { className: 'how-variants' }, [variant('crimson'), variant('violet'), variant('ghost')]), p('how.variants'), p('how.mix')),
      section(
        'how.bossTitle',
        p('how.boss'),
        h(
          'ul',
          { className: 'how-creatures' },
          (['spill', 'bookworm', 'shuffler', 'squid', 'quill'] as const).map((id) => creature(id, `how.boss.${id}`)),
        ),
      ),
      section('how.powersTitle', p('how.powers')),
      section('how.keysTitle', hands ? h('img', { className: 'how-hands', src: hands, alt: t('how.handsAlt') }) : null, p('how.keys')),
      section(
        'how.controlsTitle',
        h('dl', { className: 'how-controls' }, [
          control([t('how.control.typeKey')], 'how.control.type'),
          control(['Tab'], 'how.control.tab'),
          control(['↑'], 'how.control.up'),
          control(['↓'], 'how.control.down'),
          control(['Enter'], 'how.control.enter'),
          control(['Backspace'], 'how.control.backspace'),
          control(['Esc'], 'how.control.esc'),
        ]),
      ),
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-primary', 'data-id': 'back', onClick: () => this.show('title') }, [t('menu.back')]),
      ]),
    ];
  }

  private pause(): HTMLElement[] {
    return [
      h('h2', { id: 'menu-title' }, [t('pause.title')]),
      h('p', { className: 'tc-intro' }, [this.hooks.pauseSummary()]),
      h('nav', { className: 'menu-list' }, [
        this.button('resume', t('pause.resume'), () => this.hooks.onResume(), { key: 'Esc', primary: true }),
        this.hooks.canRestart() ? this.button('restart', t('pause.restart'), () => this.hooks.onRestart(), { key: 'r' }) : null,
        this.hooks.canPracticeChapterKeys()
          ? this.button('practice', t('pause.practice'), () => this.hooks.onPracticeChapterKeys(), { detail: t('pause.practiceDetail'), key: 'f' })
          : null,
        this.button('settings', t('menu.settings'), () => this.hooks.onSettings(), { key: 's' }),
        this.button('quit', t('pause.quit'), () => this.hooks.onQuit(), { key: 'q' }),
      ]),
      h('p', { className: 'menu-best' }, [t('pause.note')]),
    ];
  }

  /** The sticker book: every sticker by shelf, earned or not. Opening it marks new ones seen. */
  private stickers(): HTMLElement[] {
    const book = this.hooks.stickerBook();
    this.hooks.onStickersSeen();
    return [
      // Focus starts on the heading, so the book opens at the top rather than scrolled to Back.
      h('h2', { id: 'menu-title', tabindex: -1, 'data-autofocus': true }, [t('stickers.title')]),
      h('p', { className: 'tc-intro' }, [t('stickers.intro')]),
      h('p', { className: 'stickers-count' }, [t('stickers.count', { earned: book.earned, total: book.total })]),
      ...book.shelves.map((shelf) =>
        h('section', { className: 'stickers-shelf' }, [
          h('h3', {}, [shelf.title]),
          h(
            'ul',
            { className: 'stickers-grid' },
            shelf.stickers.map((s) =>
              h('li', { className: `sticker${s.earnedOn ? '' : ' sticker-locked'}${s.isNew ? ' sticker-new' : ''}` }, [
                stickerArt(s.emoji, s.group),
                h('span', { className: 'sticker-text' }, [
                  h('span', { className: 'sticker-name' }, [
                    s.name,
                    s.isNew ? h('span', { className: 'sticker-badge' }, [t('stickers.new')]) : null,
                  ]),
                  h('span', { className: 'sticker-how' }, [s.how]),
                  h('span', { className: 'sticker-when' }, [s.earnedOn ?? t('stickers.locked')]),
                ]),
              ]),
            ),
          ),
        ]),
      ),
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-primary', 'data-id': 'back', onClick: () => this.show('title') }, [t('menu.back')]),
      ]),
    ];
  }

  /** Today's Daily Page: play it, or see and copy the result. */
  private daily(): HTMLElement[] {
    const d = this.hooks.daily();
    const copied = h('span', { className: 'daily-copied', role: 'status', 'aria-live': 'polite' });
    const shareText = d.shareText;
    const share = shareText
      ? h('textarea', { className: 'daily-share', readonly: true, rows: shareText.split('\n').length, 'aria-label': t('daily.shareLabel'), 'data-id': 'share-text' })
      : null;
    if (share && shareText) share.value = shareText;
    const copy = async () => {
      const ok = await this.hooks.onCopyDaily();
      if (!ok && share) share.select();
      copied.textContent = ok ? t('daily.copied') : t('daily.copyManually');
    };
    const parts: (HTMLElement | null)[] = [
      h('h2', { id: 'menu-title' }, [t('daily.title', { id: d.id })]),
      h('p', { className: 'tc-intro' }, [t('daily.intro')]),
      this.streakStrip(d.streak, d.week),
      d.pages
        ? h(
            'ol',
            { className: 'daily-pages' },
            d.pages.map((p) =>
              h(
                'li',
                {
                  className: `daily-page daily-${p.mark}`,
                  'aria-label': p.grade ? t('daily.pageGrade', { page: p.page, grade: p.grade }) : t('daily.pageNotReached', { page: p.page }),
                },
                [
                  h('span', { className: 'daily-page-label', 'aria-hidden': 'true' }, [t('daily.pageLabel', { page: p.page })]),
                  h('span', { className: 'daily-page-grade', 'aria-hidden': 'true' }, [p.grade ?? t('daily.notReached')]),
                ],
              ),
            ),
          )
        : null,
      h('p', { className: 'daily-status' }, [d.status]),
      share,
      h('nav', { className: 'menu-list' }, [
        d.played
          ? this.button('copy', t('daily.copy'), () => void copy(), { key: 'c', primary: true })
          : null,
        this.button('play-daily', d.played ? t('daily.playAgain') : t('daily.play'), () => this.hooks.onPlayDaily(), {
          detail: d.played ? t('daily.playAgainDetail') : t('daily.playDetail', { pages: DAILY_PAGES }),
          key: 'p',
          primary: !d.played,
        }),
      ]),
      copied,
      h('p', { className: 'menu-best' }, [d.record]),
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-secondary', 'data-id': 'back', onClick: () => this.show('title') }, [t('menu.back')]),
      ]),
    ];
    return parts.filter((el): el is HTMLElement => el !== null);
  }

  /** The streak: an ink drop on fire with the number, and this week's days, filled in where played. */
  private streakStrip(streak: number, week: StreakDay[]): HTMLElement {
    const day = new Intl.DateTimeFormat(getLocale(), { weekday: 'narrow' });
    const dayName = new Intl.DateTimeFormat(getLocale(), { weekday: 'long' });
    return h('section', { className: `daily-streak${streak > 0 ? ' daily-streak-lit' : ''}`, 'aria-label': t('daily.streakLabel', { streak }) }, [
      h('div', { className: 'daily-streak-head', 'aria-hidden': 'true' }, [
        artElement(streakDropSvg(streak > 0), 'daily-streak-drop'),
        h('span', { className: 'daily-streak-number' }, [
          h('span', { className: 'daily-streak-count' }, [String(streak)]),
          h('span', { className: 'daily-streak-unit' }, [t('daily.streakUnit')]),
        ]),
      ]),
      h(
        'ol',
        { className: 'daily-week' },
        week.map((w) => {
          const name = dayName.format(w.date);
          const label = w.played
            ? t('daily.dayPlayed', { day: name })
            : w.today
              ? t('daily.dayToday', { day: name })
              : w.future
                ? t('daily.dayLater', { day: name })
                : t('daily.dayMissed', { day: name });
          const state = w.played ? 'played' : w.today ? 'today' : w.future ? 'later' : 'missed';
          return h('li', { className: `daily-day daily-day-${state}`, 'aria-label': label }, [
            h('span', { className: 'daily-day-box', 'aria-hidden': 'true' }, [w.played ? artElement(dayDropSvg(), 'daily-day-drop') : null]),
            h('span', { className: 'daily-day-name', 'aria-hidden': 'true' }, [day.format(w.date)]),
          ]);
        }),
      ),
    ]);
  }

  /** Pick who's playing, or add and edit players. */
  private players(): HTMLElement[] {
    const players = this.hooks.players();
    return [
      h('h2', { id: 'menu-title' }, [t('players.title')]),
      h('p', { className: 'tc-intro' }, [t('players.intro')]),
      h(
        'ul',
        { className: 'menu-players' },
        players.map((p) =>
          h('li', { className: 'menu-player-row' }, [
            h(
              'button',
              {
                type: 'button',
                className: 'menu-btn menu-player-pick',
                'aria-current': p.active ? 'true' : undefined,
                'data-id': `player-${p.id}`,
                'data-autofocus': p.active ? true : undefined,
                'aria-label': t('players.choose', { name: p.name }),
                onClick: () => this.hooks.onChoosePlayer(p.id),
              },
              [
                artElement(badgeSvg(p.badge), 'menu-player-badge'),
                h('span', { className: 'menu-label' }, [p.name]),
                h('span', { className: 'menu-detail' }, [p.detail]),
              ],
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'tc-secondary menu-player-edit',
                'data-id': `edit-${p.id}`,
                'aria-label': t('players.editLabel', { name: p.name }),
                onClick: () => this.editPlayer(p),
              },
              [t('players.edit')],
            ),
          ]),
        ),
      ),
      h('div', { className: 'tc-actions' }, [
        this.hooks.canAddPlayer()
          ? h('button', { type: 'button', className: 'tc-secondary', 'data-id': 'add-player', onClick: () => this.editPlayer(null) }, [t('players.add')])
          : h('p', { className: 'menu-keys-line' }, [t('players.full')]),
        h('button', { type: 'button', className: 'tc-primary', 'data-id': 'back', onClick: () => this.show('title') }, [t('menu.back')]),
      ]),
    ];
  }

  private editPlayer(player: PlayerEntry | null): void {
    const used = new Set(this.hooks.players().map((p) => p.badge));
    const base = { check: null, confirmDelete: false, error: null };
    this.editing = player
      ? { ...base, id: player.id, name: player.name, badge: player.badge, contentLevel: player.contentLevel, savedLevel: player.contentLevel }
      : { ...base, id: null, name: '', badge: BADGES.find((b) => !used.has(b)) ?? 'ink', contentLevel: 'family', savedLevel: 'family' };
    this.show('playerEdit');
  }

  private playerEdit(): HTMLElement[] {
    const e = this.editing;
    if (!e) return this.players();
    const name = h('input', {
      type: 'text',
      id: 'player-name',
      className: 'menu-input',
      maxlength: MAX_NAME_LENGTH,
      autocomplete: 'off',
      spellcheck: 'false',
      value: e.name,
      'data-id': 'player-name',
      'data-autofocus': true,
      onInput: (event) => {
        e.name = (event.target as HTMLInputElement).value;
      },
    });
    const save = async () => {
      const ok = await this.hooks.onSavePlayer(e.id, e.name, e.badge, e.contentLevel);
      if (ok) {
        this.editing = null;
        this.show('players');
      } else {
        e.error = t('players.nameNeeded');
        this.render(false);
        this.panel.querySelector<HTMLInputElement>('#player-name')?.focus();
      }
    };
    const canDelete = e.id !== null && this.hooks.players().length > 1;
    const player = this.hooks.players().find((p) => p.id === e.id);
    return [
      h('h2', { id: 'menu-title' }, [t(e.id ? 'players.editTitle' : 'players.newTitle')]),
      h(
        'form',
        {
          className: 'menu-player-form',
          onSubmit: (event) => {
            event.preventDefault();
            void save();
          },
        },
        [
          h('label', { className: 'menu-field', for: 'player-name' }, [t('players.name')]),
          name,
          e.error ? h('p', { className: 'tc-warning', role: 'alert' }, [e.error]) : null,
          h('fieldset', { className: 'st-group' }, [
            h('legend', {}, [t('players.badge')]),
            h(
              'div',
              { className: 'menu-badges', role: 'radiogroup', 'aria-label': t('players.badge') },
              BADGES.map((badge) =>
                h(
                  'button',
                  {
                    type: 'button',
                    role: 'radio',
                    className: 'menu-badge',
                    'aria-checked': String(badge === e.badge),
                    'aria-label': t(`badge.${badge}` as MessageKey),
                    'data-id': `badge-${badge}`,
                    onClick: () => {
                      e.badge = badge;
                      this.render(false);
                    },
                  },
                  [artElement(badgeSvg(badge), 'menu-player-badge')],
                ),
              ),
            ),
          ]),
          this.wordFilter(e),
          canDelete && e.confirmDelete
            ? h('div', { className: 'menu-confirm', role: 'alert' }, [
                h('p', {}, [t('players.deleteConfirm', { name: player?.name ?? e.name })]),
                h('div', { className: 'tc-actions' }, [
                  h('button', { type: 'button', className: 'tc-secondary', 'data-id': 'delete-no', onClick: () => {
                    e.confirmDelete = false;
                    this.render(false);
                  } }, [t('players.cancel')]),
                  h('button', { type: 'button', className: 'tc-secondary sd-danger', 'data-id': 'delete-yes', onClick: () => {
                    if (e.id) this.hooks.onDeletePlayer(e.id);
                    this.editing = null;
                    this.show('players');
                  } }, [t('players.deleteYes')]),
                ]),
              ])
            : null,
          h('div', { className: 'tc-actions' }, [
            canDelete && !e.confirmDelete
              ? h('button', { type: 'button', className: 'tc-secondary sd-danger', 'data-id': 'delete', onClick: () => {
                  e.confirmDelete = true;
                  this.render(false);
                  this.panel.querySelector<HTMLElement>('[data-id="delete-no"]')?.focus();
                } }, [t('players.delete')])
              : null,
            h('button', { type: 'button', className: 'tc-secondary', 'data-id': 'cancel', onClick: () => {
              this.editing = null;
              this.show('players');
            } }, [t('players.cancel')]),
            h('button', { type: 'submit', className: 'tc-primary', 'data-id': 'save' }, [t('players.save')]),
          ]),
        ],
      ),
    ];
  }

  /**
   * The player's word filter. Choosing a stricter level is instant; a looser
   * one than the player had asks a times-table question first, so it's a
   * grown-up's choice.
   */
  private wordFilter(e: NonNullable<Menu['editing']>): HTMLElement {
    const rank = (level: ContentLevel) => CONTENT_LEVELS.indexOf(level);
    const pick = (level: ContentLevel) => {
      if (rank(level) <= rank(e.savedLevel)) {
        e.contentLevel = level;
        e.check = null;
      } else {
        // Two digits by one (e.g. 17 × 8): easy for a grown-up, hard for a young child to guess.
        const between = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
        e.check = { level, a: between(12, 19), b: between(3, 9), answer: '', wrong: false };
      }
      this.render(false);
      if (e.check) this.panel.querySelector<HTMLInputElement>('#grown-up-answer')?.focus();
    };
    const check = e.check;
    const confirmCheck = () => {
      if (!check) return;
      if (Number(check.answer.trim()) === check.a * check.b) {
        e.contentLevel = check.level;
        e.check = null;
        this.render(false);
        this.panel.querySelector<HTMLElement>(`[data-id="filter-${e.contentLevel}"]`)?.focus();
      } else {
        check.wrong = true;
        check.answer = '';
        this.render(false);
        this.panel.querySelector<HTMLInputElement>('#grown-up-answer')?.focus();
      }
    };
    return h('fieldset', { className: 'st-group' }, [
      h('legend', {}, [t('filter.title')]),
      h('p', { className: 'st-help' }, [t('filter.intro')]),
      h(
        'div',
        { className: 'menu-filters', role: 'radiogroup', 'aria-label': t('filter.title') },
        CONTENT_LEVELS.map((level) =>
          h(
            'button',
            {
              type: 'button',
              role: 'radio',
              className: 'menu-btn menu-filter',
              'aria-checked': String(level === e.contentLevel),
              'data-id': `filter-${level}`,
              onClick: () => pick(level),
            },
            [
              h('span', { className: 'menu-label' }, [t(`filter.${level}` as MessageKey)]),
              h('span', { className: 'menu-detail' }, [t(`filter.${level}.detail` as MessageKey)]),
            ],
          ),
        ),
      ),
      check
        ? h('div', { className: 'menu-grown-up', role: 'group', 'aria-labelledby': 'grown-up-question' }, [
            h('label', { id: 'grown-up-question', for: 'grown-up-answer' }, [
              t('filter.check', { a: check.a, b: check.b }),
            ]),
            h('div', { className: 'menu-grown-up-row' }, [
              h('input', {
                id: 'grown-up-answer',
                className: 'menu-input',
                type: 'text',
                inputmode: 'numeric',
                autocomplete: 'off',
                value: check.answer,
                'data-id': 'grown-up-answer',
                onInput: (event) => {
                  check.answer = (event.target as HTMLInputElement).value;
                },
                onKeydown: (event) => {
                  // Enter answers the question rather than saving the form.
                  if ((event as KeyboardEvent).key === 'Enter') {
                    event.preventDefault();
                    confirmCheck();
                  }
                },
              }),
              h('button', { type: 'button', className: 'tc-primary', 'data-id': 'grown-up-ok', onClick: confirmCheck }, [t('filter.checkOk')]),
              h('button', { type: 'button', className: 'tc-secondary', 'data-id': 'grown-up-cancel', onClick: () => {
                e.check = null;
                this.render(false);
              } }, [t('players.cancel')]),
            ]),
            check.wrong ? h('p', { className: 'tc-warning', role: 'alert' }, [t('filter.checkWrong')]) : null,
          ])
        : null,
    ]);
  }

  /** What Inky Keys is, why it exists, and where its code lives. */
  private about(): HTMLElement[] {
    const link = (id: string, href: string, label: string, detail: string, icon: string | null) =>
      h('a', { className: 'menu-btn menu-link-card', href, target: '_blank', rel: 'noopener noreferrer', 'data-id': id }, [
        icon ? artElement(icon, 'menu-link-icon') : null,
        h('span', { className: 'menu-label' }, [label, h('span', { className: 'visually-hidden' }, [' ', t('about.newTab')])]),
        h('span', { className: 'menu-detail' }, [detail]),
      ]);
    return [
      h('h2', { id: 'menu-title' }, [t('about.title')]),
      h('p', { className: 'menu-version' }, [t('about.version', { version: this.hooks.appVersion() })]),
      h('p', { className: 'tc-intro' }, [t('about.what')]),
      h('p', { className: 'tc-intro' }, [t('about.why')]),
      h('p', { className: 'tc-intro' }, [t('about.private')]),
      h('nav', { className: 'menu-list' }, [
        this.button('whats-new', t('about.whatsNew'), () => this.hooks.onWhatsNew(), { detail: t('about.whatsNewDetail'), key: 'n' }),
        link('source', REPO_URL, t('about.source'), t('about.sourceDetail'), GITHUB_SVG),
        link('suggest', ISSUES_URL, t('about.suggest'), t('about.suggestDetail'), null),
      ]),
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-primary', 'data-id': 'back', 'data-autofocus': true, onClick: () => this.show('title') }, [
          t('menu.back'),
        ]),
      ]),
    ];
  }

  /** Everything focusable on the screen, in order. */
  private buttons(): HTMLElement[] {
    return [...this.panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input')];
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.current || event.ctrlKey || event.metaKey || event.altKey) return;
    const buttons = this.buttons();
    const index = buttons.indexOf(document.activeElement as HTMLElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.current === 'pause') this.hooks.onResume();
      else if (this.current === 'playerEdit') {
        this.editing = null;
        this.show('players');
      } else if (this.current !== 'title') this.show('title');
      return;
    }
    // Typing a name: leave the keys to the text box (Enter submits the form).
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      buttons[(index + step + buttons.length) % buttons.length]?.focus();
      return;
    }
    if (event.key === 'Tab') {
      // Keep focus inside the menu.
      const last = buttons.length - 1;
      if (!event.shiftKey && index === last) {
        event.preventDefault();
        buttons[0]?.focus();
      } else if (event.shiftKey && index <= 0) {
        event.preventDefault();
        buttons[last]?.focus();
      }
      return;
    }
    if (event.key === 'Enter' && this.current === 'newNotebook' && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault();
      this.hooks.onStart();
      return;
    }
    // Shortcut letters (and 1–4 for difficulty).
    if ([...event.key].length === 1 && !event.repeat) {
      const match = this.panel.querySelector<HTMLButtonElement>(`[data-key="${CSS.escape(event.key.toLowerCase())}"]`);
      if (match) {
        event.preventDefault();
        match.click();
      }
    }
  }
}

/**
 * Main menu, new-notebook step, How to play, and the pause menu: plain DOM,
 * like the other dialogs, so they work with the keyboard and screen readers.
 * Shown over the (dimmed) page whenever the game isn't being played.
 */
import './dialog.css';
import './menu.css';
import { DIFFICULTIES, type Difficulty } from '../core/config';
import { t, type MessageKey } from '../i18n';
import { h } from './dom';

export type MenuScreen = 'title' | 'newNotebook' | 'howToPlay' | 'pause';

export interface MenuHooks {
  /** Saved notebook to continue, if any. */
  continueDetail(): string | null;
  /** e.g. "Home row · 10 keys". */
  keysSummary(): string;
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
}

/** The Inkling wordmark: an ink drop beside the name, drawn in SVG. */
const LOGO_SVG = `
<svg class="menu-logo" viewBox="0 0 360 96" role="img" aria-label="Inkling">
  <path class="logo-drop" d="M44 6 L26 48 A21 21 0 1 0 62 48 Z"/>
  <circle class="logo-eye" cx="38" cy="62" r="4.2"/><circle class="logo-eye" cx="52" cy="62" r="4.2"/>
  <circle class="logo-shine" cx="34" cy="50" r="3"/>
  <path class="logo-smile" d="M39 72 q6 5 12 0"/>
  <text class="logo-word" x="80" y="70">Inkling</text>
  <path class="logo-underline" d="M84 82 C150 74 250 90 330 78"/>
</svg>`;

export class Menu {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private current: MenuScreen | null = null;

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
    switch (this.current) {
      case 'title':
        this.panel.replaceChildren(...this.title());
        break;
      case 'newNotebook':
        this.panel.replaceChildren(...this.newNotebook());
        break;
      case 'howToPlay':
        this.panel.replaceChildren(...this.howToPlay());
        break;
      case 'pause':
        this.panel.replaceChildren(...this.pause());
        break;
      default:
        return;
    }
    const restore = focused ? this.panel.querySelector<HTMLElement>(`[data-id="${focused}"]`) : null;
    if (restore) restore.focus();
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
    return [
      h('header', { className: 'menu-header' }, [
        logo,
        h('h1', { id: 'menu-title', className: 'visually-hidden' }, ['Inkling']),
        h('p', { className: 'menu-tagline' }, [t('menu.tagline')]),
      ]),
      h('nav', { className: 'menu-list' }, [
        cont ? this.button('continue', t('menu.continue'), () => this.hooks.onContinue(), { detail: cont, key: 'c', primary: true }) : null,
        this.button('new', t('menu.newNotebook'), () => this.show('newNotebook'), {
          detail: t('menu.newNotebookDetail'),
          key: 'n',
          primary: !cont,
        }),
        this.button('keys', t('menu.keys'), () => this.hooks.onKeys(), { detail: this.hooks.keysSummary(), key: 'k' }),
        this.button('words', t('menu.wordLists'), () => this.hooks.onWordLists(), { key: 'w' }),
        h('div', { className: 'menu-row' }, [
          this.button('settings', t('menu.settings'), () => this.hooks.onSettings(), { key: 's' }),
          this.button('saves', t('menu.saveData'), () => this.hooks.onSaveData(), { key: 'b' }),
          this.button('how', t('menu.howToPlay'), () => this.show('howToPlay'), { key: 'h' }),
        ]),
      ]),
      best ? h('p', { className: 'menu-best' }, [best]) : h('p', { className: 'menu-best' }),
    ];
  }

  private newNotebook(): HTMLElement[] {
    const selected = this.hooks.selectedDifficulty();
    return [
      h('h2', { id: 'menu-title' }, [t('newNotebook.title')]),
      h('p', { className: 'tc-intro' }, [t('newNotebook.intro')]),
      h(
        'div',
        { className: 'menu-difficulties', role: 'radiogroup', 'aria-label': t('newNotebook.title') },
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
              h('span', { className: 'menu-detail' }, [t(`difficulty.${d}.description` as MessageKey)]),
              h('kbd', { className: 'menu-key', 'aria-hidden': 'true' }, [String(i + 1)]),
            ],
          ),
        ),
      ),
      h('p', { className: 'menu-keys-line' }, [
        t('newNotebook.keys', { keys: this.hooks.keysSummary() }),
        ' ',
        h('button', { type: 'button', className: 'menu-link', 'data-id': 'change-keys', onClick: () => this.hooks.onKeys() }, [
          t('newNotebook.changeKeys'),
        ]),
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
    const section = (title: MessageKey, ...body: (HTMLElement | string)[]) =>
      h('section', { className: 'how-section' }, [h('h3', {}, [t(title)]), ...body]);
    const p = (key: MessageKey) => h('p', {}, [t(key)]);
    return [
      h('h2', { id: 'menu-title' }, [t('how.title')]),
      section('how.goalTitle', p('how.goal')),
      section(
        'how.creaturesTitle',
        h('ul', { className: 'how-list' }, (['how.drip', 'how.blotling', 'how.runon', 'how.misprint'] as const).map((k) => h('li', {}, [t(k)]))),
      ),
      section('how.keysTitle', p('how.keys')),
      section('how.controlsTitle', p('how.controls')),
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
        this.button('restart', t('pause.restart'), () => this.hooks.onRestart(), { key: 'r' }),
        this.button('settings', t('menu.settings'), () => this.hooks.onSettings(), { key: 's' }),
        this.button('quit', t('pause.quit'), () => this.hooks.onQuit(), { key: 'q' }),
      ]),
      h('p', { className: 'menu-best' }, [t('pause.note')]),
    ];
  }

  private buttons(): HTMLButtonElement[] {
    return [...this.panel.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.current || event.ctrlKey || event.metaKey || event.altKey) return;
    const buttons = this.buttons();
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.current === 'pause') this.hooks.onResume();
      else if (this.current !== 'title') this.show('title');
      return;
    }
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

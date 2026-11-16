/**
 * "What's new": short release notes (core/releases.ts). Shown once after the
 * game updates, and from the About page. A DOM dialog, so screen readers
 * read it as headings and lists. Esc or the button closes it.
 */
import './dialog.css';
import './unlock.css';
import './whatsNew.css';
import type { Release } from '../core/releases';
import { getLocale, t } from '../i18n';
import { h } from './dom';

export interface WhatsNewDialogOptions {
  /** Releases to show in full, newest first. */
  releases: readonly Release[];
  /** Older releases, folded under "Earlier versions". */
  earlier?: readonly Release[];
  /** True after an update ("What's new in Inky Keys"); false from the About page. */
  afterUpdate: boolean;
  onClose(): void;
}

function formatDate(date: string): string {
  try {
    // Midday, so no time zone moves it to another day.
    return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`));
  } catch {
    return date;
  }
}

function releaseSection(release: Release, level: 'h3' | 'h4'): HTMLElement {
  const lines = release.notes.map((key) => t(key));
  if (release.fixes) lines.push(t('whatsNew.fixes'));
  return h('section', { className: 'wn-release' }, [
    h(level, { className: 'wn-version' }, [
      t('whatsNew.version', { version: release.version }),
      h('span', { className: 'wn-date' }, [' · ', formatDate(release.date)]),
    ]),
    h('ul', { className: 'wn-notes' }, lines.map((line) => h('li', {}, [line]))),
  ]);
}

export function openWhatsNewDialog(host: HTMLElement, options: WhatsNewDialogOptions): { close(): void } {
  const previousFocus = document.activeElement as HTMLElement | null;
  const earlier = options.earlier ?? [];

  const panel = h('div', { className: 'tc-panel ul-panel wn-panel' }, [
    h('h2', { id: 'wn-title' }, [t(options.afterUpdate ? 'whatsNew.title' : 'whatsNew.titleAll')]),
    h('div', { className: 'wn-body' }, [
      ...options.releases.map((r) => releaseSection(r, 'h3')),
      earlier.length > 0
        ? h('details', { className: 'wn-earlier' }, [
            h('summary', {}, [t('whatsNew.earlier')]),
            ...earlier.map((r) => releaseSection(r, 'h4')),
          ])
        : null,
    ]),
    h('div', { className: 'tc-actions' }, [
      h('button', { type: 'button', className: 'tc-primary', 'data-id': 'ok', onClick: () => close() }, [t('whatsNew.ok')]),
    ]),
  ]);

  const root = h('div', { className: 'dialog unlock whats-new', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'wn-title' }, [panel]);
  let closed = false;

  const onKeyDown = (event: KeyboardEvent) => {
    // Keep keys away from the menu underneath.
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      const focusable = [...root.querySelectorAll<HTMLElement>('summary, button')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  function close() {
    if (closed) return;
    closed = true;
    root.removeEventListener('keydown', onKeyDown);
    root.remove();
    previousFocus?.focus?.();
    options.onClose();
  }

  root.addEventListener('keydown', onKeyDown);
  host.append(root);
  root.querySelector<HTMLButtonElement>('[data-id="ok"]')?.focus();
  return { close };
}

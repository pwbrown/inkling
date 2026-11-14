/**
 * "New on this page": a short card shown before a page that holds something
 * the player hasn't met yet (core/mechanics.ts). A DOM dialog rather than a
 * canvas card, so screen readers can read it. Enter, Esc or the button starts
 * the page, where the new thing gets a guided first try.
 */
import './dialog.css';
import './unlock.css';
import './briefing.css';
import type { MechanicId } from '../core/mechanics';
import { t, type MessageKey } from '../i18n';
import { h, trapFocus } from './dom';

export interface BriefingDialogOptions {
  mechanics: readonly MechanicId[];
  /** A picture of the creature for a mechanic, as an image URL, if it has one. */
  portrait(id: MechanicId): string | null;
  /** Called once, when the card is dismissed. `showTips` is false if the player asked for no more. */
  onClose(showTips: boolean): void;
}

export function openBriefingDialog(host: HTMLElement, options: BriefingDialogOptions): { close(): void } {
  const previousFocus = document.activeElement as HTMLElement | null;

  const card = (id: MechanicId) => {
    const picture = options.portrait(id);
    return h('li', { className: 'bf-card' }, [
      picture ? h('img', { className: 'bf-art', src: picture, alt: '' }) : h('div', { className: 'bf-art bf-art-none', 'aria-hidden': 'true' }, ['✎']),
      h('div', { className: 'bf-text' }, [
        h('strong', { className: 'bf-name' }, [t(`tutorial.${id}.title` as MessageKey)]),
        h('p', {}, [t(`tutorial.${id}.body` as MessageKey)]),
      ]),
    ]);
  };

  const noMore = h('input', { type: 'checkbox' });
  const panel = h('div', { className: 'tc-panel ul-panel bf-panel' }, [
    h('h2', { id: 'bf-title' }, [t('tutorial.title')]),
    h('ul', { className: 'bf-cards' }, options.mechanics.map(card)),
    h('div', { className: 'tc-actions bf-actions' }, [
      h('label', { className: 'st-option bf-off' }, [noMore, h('span', {}, [t('tutorial.off')])]),
      h('button', { type: 'button', className: 'tc-primary', 'data-id': 'start', onClick: () => close() }, [t('tutorial.start')]),
    ]),
  ]);

  const root = h('div', { className: 'dialog unlock briefing', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'bf-title' }, [panel]);
  let closed = false;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' || (event.key === 'Enter' && event.target !== noMore)) {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab') {
      trapFocus(root, event);
    }
  };

  function close() {
    if (closed) return;
    closed = true;
    root.removeEventListener('keydown', onKeyDown);
    root.remove();
    previousFocus?.focus?.();
    options.onClose(!noMore.checked);
  }

  root.addEventListener('keydown', onKeyDown);
  host.append(root);
  root.querySelector<HTMLButtonElement>('[data-id="start"]')?.focus();
  return { close };
}

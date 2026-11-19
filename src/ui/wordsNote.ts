/**
 * "Getting the words ready…": a small note shown while something waits for
 * the word pack, which loads after the menu (main.ts, withWords). Only seen
 * on slow connections. Screen readers hear it through a live region.
 */
import './menu.css';
import { t } from '../i18n';
import { h } from './dom';

let current: HTMLElement | null = null;

export function showWordsNote(host: HTMLElement): void {
  if (current) return;
  current = h('div', { className: 'words-note', role: 'status', 'aria-live': 'polite' }, [
    h('span', { className: 'words-note-drop', 'aria-hidden': 'true' }),
    t('menu.wordsLoading'),
  ]);
  host.append(current);
}

export function hideWordsNote(): void {
  current?.remove();
  current = null;
}

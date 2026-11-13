/**
 * "You unlocked something!": shown when a page's ink raises the player's
 * level and unlocks new pens, inks or paper. Each new thing is shown as a
 * picture, with a button to start using it straight away.
 */
import './dialog.css';
import './unlock.css';
import type { CosmeticSlot } from '../core/rewards';
import { t, type MessageKey } from '../i18n';
import { artElement, cosmeticSvg } from './art';
import { h, trapFocus } from './dom';

export interface UnlockedItem {
  slot: CosmeticSlot;
  item: string;
}

export interface UnlockDialogOptions {
  /** New level and rank name, if the player levelled up. */
  levelUp: { level: number; rank: string } | null;
  items: UnlockedItem[];
  /** Whether an item is the one equipped now. */
  isEquipped(item: UnlockedItem): boolean;
  onEquip(item: UnlockedItem): void;
  onClose(): void;
}

export function openUnlockDialog(host: HTMLElement, options: UnlockDialogOptions): { close(): void } {
  const previousFocus = document.activeElement as HTMLElement | null;

  const card = (unlocked: UnlockedItem) => {
    const name = t(`${unlocked.slot}.${unlocked.item}` as MessageKey);
    const slot = t(`desk.${unlocked.slot}` as MessageKey);
    const button = h('button', { type: 'button', className: 'tc-primary ul-equip' }, []);
    const sync = () => {
      const on = options.isEquipped(unlocked);
      button.textContent = on ? t('unlock.equipped') : t('unlock.equip');
      button.setAttribute('aria-pressed', String(on));
      button.setAttribute('aria-label', `${on ? t('unlock.equipped') : t('unlock.equip')}: ${name}`);
    };
    button.addEventListener('click', () => {
      options.onEquip(unlocked);
      for (const s of syncs) s();
    });
    syncs.push(sync);
    sync();
    return h('li', { className: 'ul-card' }, [
      artElement(cosmeticSvg(unlocked.slot, unlocked.item), `ul-art ul-art-${unlocked.slot}`),
      h('span', { className: 'ul-slot' }, [slot]),
      h('strong', { className: 'ul-name' }, [name]),
      button,
    ]);
  };
  const syncs: (() => void)[] = [];

  const panel = h('div', { className: 'tc-panel ul-panel' }, [
    h('div', { className: 'ul-burst', 'aria-hidden': 'true' }, ['★']),
    h('h2', { id: 'ul-title' }, [t('unlock.title')]),
    options.levelUp ? h('p', { className: 'ul-level' }, [t('unlock.levelUp', { level: options.levelUp.level, rank: options.levelUp.rank })]) : null,
    h('ul', { className: 'ul-cards' }, options.items.map(card)),
    h('div', { className: 'tc-actions' }, [
      h('button', { type: 'button', className: 'tc-secondary', 'data-id': 'later', onClick: () => close() }, [t('unlock.later')]),
    ]),
  ]);

  const root = h('div', { className: 'dialog unlock', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ul-title' }, [panel]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      trapFocus(root, event);
    }
  };

  function close() {
    root.removeEventListener('keydown', onKeyDown);
    root.remove();
    previousFocus?.focus?.();
    options.onClose();
  }

  root.addEventListener('keydown', onKeyDown);
  host.append(root);
  root.querySelector<HTMLButtonElement>('.ul-equip')?.focus();
  return { close };
}

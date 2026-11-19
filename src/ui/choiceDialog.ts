/**
 * A small card with a heading, a few lines and buttons: the mobile keyboard
 * notice and the "ready for more?" suggestion (M29). Escape picks the last
 * (secondary) choice; focus stays inside while it's open.
 */
import './dialog.css';
import './unlock.css';
import { h, trapFocus } from './dom';

export interface Choice {
  /** For tests and the snapshot tour. */
  id: string;
  label: string;
  /** Shown filled; the rest are outlined. */
  primary?: boolean;
  onPick(): void;
}

export interface ChoiceDialogOptions {
  title: string;
  lines: readonly string[];
  /** A picture above the heading (decorative). */
  emoji?: string;
  choices: readonly Choice[];
  /** A quiet link-style choice under the buttons (e.g. "Don't suggest this again"). */
  footer?: Choice;
  /** Escape: picks this choice (default: the last one). */
  escapeId?: string;
  onClose(): void;
}

export function openChoiceDialog(host: HTMLElement, options: ChoiceDialogOptions): { close(): void } {
  const previousFocus = document.activeElement as HTMLElement | null;
  const pick = (choice: Choice) => {
    close();
    choice.onPick();
  };
  const button = (choice: Choice) =>
    h('button', { type: 'button', className: choice.primary ? 'tc-primary' : 'tc-secondary', 'data-id': choice.id, onClick: () => pick(choice) }, [
      choice.label,
    ]);

  const panel = h('div', { className: 'tc-panel ul-panel choice-panel' }, [
    options.emoji ? h('div', { className: 'ul-burst', 'aria-hidden': 'true' }, [options.emoji]) : null,
    h('h2', { id: 'choice-title' }, [options.title]),
    ...options.lines.map((line) => h('p', { className: 'tc-intro' }, [line])),
    h('div', { className: 'tc-actions choice-actions' }, options.choices.map(button)),
    options.footer
      ? h('p', { className: 'choice-footer' }, [
          h('button', { type: 'button', className: 'linkish', 'data-id': options.footer.id, onClick: () => pick(options.footer!) }, [options.footer.label]),
        ])
      : null,
  ]);
  const root = h('div', { className: 'dialog unlock choice', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'choice-title' }, [panel]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      const escape = options.choices.find((c) => c.id === options.escapeId) ?? options.choices[options.choices.length - 1];
      if (escape) pick(escape);
    } else if (event.key === 'Tab') {
      trapFocus(root, event);
    }
  };

  let open = true;
  function close() {
    if (!open) return;
    open = false;
    root.removeEventListener('keydown', onKeyDown);
    root.remove();
    previousFocus?.focus?.();
    options.onClose();
  }

  root.addEventListener('keydown', onKeyDown);
  host.append(root);
  root.querySelector<HTMLButtonElement>('.tc-primary, button')?.focus();
  return { close };
}

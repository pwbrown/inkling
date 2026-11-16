/**
 * Save data dialog: privacy note, export/import backups, and erase
 * (REQUIREMENTS §8, §9, §12). Plain DOM, like the Type Case.
 */
import './dialog.css';
import { formatNumber, t } from '../i18n';
import { SaveFormatError, fromExport, toExport, type SaveData } from '../storage/schema';
import type { SaveStore } from '../storage/store';
import { h, trapFocus } from './dom';

export interface SaveDataOptions {
  store: SaveStore;
  /** Called after an import replaced the save. */
  onImported(save: SaveData): void;
  /** Called after everything was erased. */
  onErased(): void;
  onClose(): void;
}

/** File name for an export, e.g. inky-keys-save-2026-11-12.json. */
export function exportFileName(now = new Date()): string {
  return `inky-keys-save-${now.toISOString().slice(0, 10)}.json`;
}

/** Hand the player a file to save, without any network request. */
function downloadJson(name: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openSaveData(host: HTMLElement, options: SaveDataOptions): { close(): void } {
  const { store } = options;
  const previousFocus = document.activeElement as HTMLElement | null;

  const status = h('p', { className: 'sd-status', role: 'status', 'aria-live': 'polite' });
  const summary = h('p', { className: 'sd-message' });
  const body = h('div');

  const refreshSummary = () => {
    summary.textContent = t('saveData.summary', {
      keys: formatNumber(Object.keys(store.data.keyStats).length),
      presets: formatNumber(store.data.customPresets.length),
    });
  };

  const fileInput = h('input', { type: 'file', accept: '.json,application/json', className: 'sd-file', tabindex: -1 });

  /** Show a yes/no question in place of the main content. */
  const ask = (message: string, yesLabel: string, onYes: () => Promise<void>) => {
    const yes = h('button', { type: 'button', className: 'tc-primary', onClick: () => void onYes().then(showMain) }, [yesLabel]);
    body.replaceChildren(
      h('div', { className: 'sd-row' }, [
        h('p', {}, [message]),
        h('div', { className: 'tc-actions' }, [
          h('button', { type: 'button', className: 'tc-secondary', onClick: () => showMain() }, [t('saveData.cancel')]),
          yes,
        ]),
      ]),
    );
    yes.focus();
  };

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    let save: SaveData;
    try {
      save = fromExport(await file.text());
    } catch (error) {
      status.textContent =
        error instanceof SaveFormatError && error.reason === 'newer' ? t('saveData.importNewer') : t('saveData.importInvalid');
      return;
    }
    ask(t('saveData.importConfirm'), t('saveData.confirm'), async () => {
      await store.replace(save);
      options.onImported(save);
      status.textContent = t('saveData.importDone');
    });
  });

  const row = (help: string, button: HTMLButtonElement) => h('div', { className: 'sd-row' }, [h('p', {}, [help]), button]);

  function showMain() {
    refreshSummary();
    body.replaceChildren(
      summary,
      row(
        t('saveData.exportHelp'),
        h(
          'button',
          {
            type: 'button',
            className: 'tc-secondary',
            onClick: async () => {
              await store.flush();
              downloadJson(exportFileName(), toExport(store.data as SaveData));
            },
          },
          [t('saveData.export')],
        ),
      ),
      row(
        t('saveData.importHelp'),
        h('button', { type: 'button', className: 'tc-secondary', onClick: () => fileInput.click() }, [t('saveData.import')]),
      ),
      h('div', { className: 'sd-row' }, [
        h(
          'button',
          {
            type: 'button',
            className: 'tc-secondary sd-danger',
            onClick: () =>
              ask(t('saveData.eraseConfirm'), t('saveData.confirmErase'), async () => {
                await store.erase();
                options.onErased();
                status.textContent = t('saveData.erased');
              }),
          },
          [t('saveData.erase')],
        ),
      ]),
    );
  }

  const panel = h('div', { className: 'tc-panel sd-panel' }, [
    h('header', {}, [
      h('h2', { id: 'sd-title' }, [t('saveData.title')]),
      h('p', { className: 'tc-intro' }, [t('saveData.privacy')]),
      h('p', { className: 'tc-intro' }, [t('saveData.host')]),
      store.persistent ? null : h('p', { className: 'tc-warning' }, [t('saveData.notPersistent')]),
    ]),
    body,
    h('footer', {}, [
      status,
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-primary', onClick: () => close() }, [t('saveData.close')]),
      ]),
    ]),
    fileInput,
  ]);

  const root = h('div', { className: 'dialog save-data', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sd-title' }, [
    panel,
  ]);

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
  showMain();
  host.append(root);
  root.querySelector<HTMLButtonElement>('button')?.focus();
  return { close };
}

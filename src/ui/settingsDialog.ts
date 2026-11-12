/** Settings dialog: text size, colors, motion and sound (REQUIREMENTS §10). */
import './dialog.css';
import { t, type MessageKey } from '../i18n';
import { THEMES } from '../render/theme';
import { MOTION_SETTINGS, TEXT_SIZES, type Settings } from '../settings';
import { h, trapFocus } from './dom';

export interface SettingsDialogOptions {
  settings: Settings;
  /** Called on every change, so the game can update immediately. */
  onChange(settings: Settings): void;
  onTestSound(): void;
  onClose(): void;
}

let groupId = 0;

/** A labelled group of radio buttons. */
function radioGroup<T extends string>(
  legend: string,
  help: string,
  values: readonly T[],
  current: T,
  label: (value: T) => string,
  onPick: (value: T) => void,
): HTMLFieldSetElement {
  const name = `setting-${groupId++}`;
  return h('fieldset', { className: 'st-group' }, [
    h('legend', {}, [legend]),
    h(
      'div',
      { className: 'st-options' },
      values.map((value) => {
        const input = h('input', { type: 'radio', name, value, onChange: () => onPick(value) });
        input.checked = value === current;
        return h('label', { className: 'st-option' }, [input, h('span', {}, [label(value)])]);
      }),
    ),
    h('p', { className: 'st-help' }, [help]),
  ]);
}

export function openSettings(host: HTMLElement, options: SettingsDialogOptions): { close(): void } {
  let settings = { ...options.settings };
  const previousFocus = document.activeElement as HTMLElement | null;

  const change = (patch: Partial<Settings>) => {
    settings = { ...settings, ...patch };
    options.onChange(settings);
  };

  const volume = h('input', {
    type: 'range',
    min: 0,
    max: 100,
    step: 5,
    value: Math.round(settings.volume * 100),
    'aria-label': t('settings.volume'),
    onInput: () => change({ volume: Number(volume.value) / 100 }),
  });
  const mute = h('input', { type: 'checkbox', onChange: () => change({ muted: mute.checked }) });
  mute.checked = settings.muted;

  const panel = h('div', { className: 'tc-panel st-panel' }, [
    h('header', {}, [h('h2', { id: 'st-title' }, [t('settings.title')]), h('p', { className: 'tc-intro' }, [t('settings.intro')])]),
    radioGroup(
      t('settings.textSize'),
      t('settings.textSize.help'),
      TEXT_SIZES,
      settings.textSize,
      (v) => t(`settings.textSize.${v}` as MessageKey),
      (textSize) => change({ textSize }),
    ),
    radioGroup(
      t('settings.theme'),
      t('settings.theme.help'),
      THEMES,
      settings.theme,
      (v) => t(`settings.theme.${v}` as MessageKey),
      (theme) => change({ theme }),
    ),
    radioGroup(
      t('settings.motion'),
      t('settings.motion.help'),
      MOTION_SETTINGS,
      settings.motion,
      (v) => t(`settings.motion.${v}` as MessageKey),
      (motion) => change({ motion }),
    ),
    h('fieldset', { className: 'st-group' }, [
      h('legend', {}, [t('settings.sound')]),
      h('div', { className: 'st-options' }, [
        h('label', { className: 'st-option st-volume' }, [h('span', {}, [t('settings.volume')]), volume]),
        h('label', { className: 'st-option' }, [mute, h('span', {}, [t('settings.mute')])]),
        h('button', { type: 'button', className: 'tc-secondary', onClick: () => options.onTestSound() }, [t('settings.test')]),
      ]),
    ]),
    h('footer', {}, [
      h('div', { className: 'tc-actions' }, [
        h('button', { type: 'button', className: 'tc-primary', onClick: () => close() }, [t('settings.close')]),
      ]),
    ]),
  ]);

  const root = h('div', { className: 'dialog settings', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'st-title' }, [panel]);

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
  root.querySelector<HTMLInputElement>('input:checked')?.focus();
  return { close };
}

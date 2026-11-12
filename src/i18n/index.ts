import { en, type MessageKey } from './en';

export type { MessageKey };
export type MessageParams = Record<string, string | number>;

type Messages = Record<MessageKey, string>;

const locales: Record<string, Messages> = { en };
let active: Messages = en;
let activeLocale = 'en';

/** Switch locale. Unknown locales fall back to English. */
export function setLocale(locale: string): void {
  const base = locale.toLowerCase().split('-')[0] ?? 'en';
  activeLocale = base in locales ? base : 'en';
  active = locales[activeLocale] ?? en;
}

export function getLocale(): string {
  return activeLocale;
}

/** Look up a UI string and fill in `{placeholders}`. */
export function t(key: MessageKey, params: MessageParams = {}): string {
  const template = active[key] ?? en[key];
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Locale-aware number formatting via Intl. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(activeLocale, options).format(value);
}

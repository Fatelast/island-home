export const locales = ['zh-CN', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh-CN';

const localeSet = new Set<string>(locales);

export function isLocale(locale: string): locale is Locale {
  return localeSet.has(locale);
}

import { defaultLocale, isLocale } from './config.ts';
import { messages, sourceTextKeys } from './messages.ts';

import type { Locale } from './config.ts';
import type { MessageKey, SourceText } from './messages.ts';

const sourceTextKeyMap = new Map<string, MessageKey>(
  Object.entries(sourceTextKeys) as Array<[SourceText, MessageKey]>,
);

export { defaultLocale, isLocale };
export type { Locale, MessageKey, SourceText };

export function getMessageKey(sourceText: string): MessageKey | undefined {
  return sourceTextKeyMap.get(sourceText);
}

export function t(locale: string | undefined, sourceText: string): string {
  const messageKey = getMessageKey(sourceText);

  if (!messageKey) {
    return sourceText;
  }

  const resolvedLocale: Locale = locale && isLocale(locale) ? locale : defaultLocale;

  return messages[resolvedLocale][messageKey] ?? messages[defaultLocale][messageKey] ?? sourceText;
}

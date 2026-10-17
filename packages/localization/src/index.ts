import type { Locale } from "@kapas/domain";

import en from "./locales/en.json";
import ur from "./locales/ur.json";

const dictionaries = {
  en,
  ur,
} as const;

export type MessageKey = keyof typeof en;

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ur" ? "rtl" : "ltr";
}

export function t(locale: Locale, key: MessageKey): string {
  const table = dictionaries[locale] ?? dictionaries.en;
  return table[key] ?? dictionaries.en[key] ?? key;
}

export { dictionaries };

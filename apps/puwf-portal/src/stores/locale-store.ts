"use client";

import type { Locale } from "@kapas/domain";
import { persistenceKeys } from "@kapas/domain";
import { create } from "zustand";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(persistenceKeys.locale);
  return stored === "ur" || stored === "en" ? stored : "en";
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "en",
  setLocale: (locale) => {
    window.localStorage.setItem(persistenceKeys.locale, locale);
    set({ locale });
  },
}));

export function hydrateLocale(): void {
  useLocaleStore.setState({ locale: readStoredLocale() });
}

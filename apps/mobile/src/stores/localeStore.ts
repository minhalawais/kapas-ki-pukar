import type { Locale } from "@kapas/domain";
import { persistenceKeys } from "@kapas/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { configureNativeLayoutDirection } from "../i18n/native-layout-direction";

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  hasChosenLanguage: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  hydrate: () => Promise<void>;
}

async function applyDirection(): Promise<void> {
  configureNativeLayoutDirection();
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: "ur",
  hydrated: false,
  hasChosenLanguage: false,
  setLocale: async (locale) => {
    await AsyncStorage.setItem(persistenceKeys.locale, locale);
    await applyDirection();
    set({ locale, hasChosenLanguage: true });
  },
  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    const stored = await AsyncStorage.getItem(persistenceKeys.locale);
    if (stored === "ur" || stored === "en") {
      await applyDirection();
      set({
        locale: stored,
        hydrated: true,
        hasChosenLanguage: true,
      });
      return;
    }
    await applyDirection();
    set({ hydrated: true });
  },
}));

import { persistenceKeys } from "@kapas/domain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface VoiceGuidanceState {
  enabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
}

export const useVoiceGuidanceStore = create<VoiceGuidanceState>((set, get) => ({
  enabled: true,
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    const stored = await AsyncStorage.getItem(persistenceKeys.voiceGuidance);
    set({ enabled: stored !== "false", hydrated: true });
  },
  setEnabled: async (enabled) => {
    await AsyncStorage.setItem(persistenceKeys.voiceGuidance, String(enabled));
    set({ enabled });
  },
}));

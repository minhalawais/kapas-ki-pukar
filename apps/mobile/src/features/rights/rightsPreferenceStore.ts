import type { RightsProvince } from "@kapas/domain";
import { create } from "zustand";

interface RightsPreferenceState {
  province: RightsProvince | null;
  setProvince: (province: RightsProvince | null) => void;
}

export const useRightsPreferenceStore = create<RightsPreferenceState>((set) => ({
  province: null,
  setProvince: (province) => set({ province }),
}));

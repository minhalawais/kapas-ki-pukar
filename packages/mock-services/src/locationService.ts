import { DEMO_LOCATIONS } from "@kapas/mock-data";

export const locationService = {
  async list() {
    return [...DEMO_LOCATIONS];
  },
  async listByProvince(province: string) {
    return DEMO_LOCATIONS.filter((row) => row.province === province);
  },
  async getByVillageLabel(villageLabel: string) {
    return DEMO_LOCATIONS.find((row) => row.villageLabel === villageLabel) ?? null;
  },
};

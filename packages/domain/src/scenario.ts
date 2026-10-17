export const goldenScenarioIds = [
  "GS-01",
  "GS-02",
  "GS-03",
  "GS-04",
  "GS-05",
  "GS-06",
  "GS-07",
  "GS-08",
  "GS-09",
  "GS-10",
] as const;

export type GoldenScenarioId = (typeof goldenScenarioIds)[number];

export const goldenScenarioTrackingIds: Record<GoldenScenarioId, string> = {
  "GS-01": "KP-26-000101",
  "GS-02": "KP-26-000102",
  "GS-03": "KP-26-000103",
  "GS-04": "KP-26-000104",
  "GS-05": "KP-26-000105",
  "GS-06": "KP-26-000106",
  "GS-07": "KP-26-000107",
  "GS-08": "KP-26-000108",
  "GS-09": "KP-26-000109",
  "GS-10": "KP-26-000110",
};

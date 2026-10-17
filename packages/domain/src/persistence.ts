/** Versioned keys. Phase 03 prefix is kkp:v1 (Phase 02 used kapas.v1). */
export const persistenceKeys = {
  locale: "kkp:v1:locale",
  voiceGuidance: "kkp:v1:voiceGuidance",
  onboarding: "kkp:v1:onboarding",
  draft: "kkp:v1:complaintDraft",
  draftRecoveryDismissed: "kkp:v1:draftRecoveryDismissed",
  mobileComplaints: "kkp:v1:mobileComplaints",
  webComplaints: "kkp:v1:webComplaints",
  demo: "kkp:v1:demo",
  connectivity: "kkp:v1:connectivity",
  filters: "kkp:v1:filters",
  analyticsFilters: "kkp:v1:analyticsFilters",
  offlineQueue: "kkp:v1:offlineQueue",
  schema: "kkp:v1:schema",
} as const;

export const SEED_VERSION = 3;
export const DEMO_NOW_ISO = "2026-08-19T12:00:00.000Z";

export const connectivityStates = ["online", "offline-demo", "reconnecting"] as const;
export type ConnectivityState = (typeof connectivityStates)[number];

export function isConnectivityState(value: unknown): value is ConnectivityState {
  return typeof value === "string" && (connectivityStates as readonly string[]).includes(value);
}

export function isSimulatedOffline(state: ConnectivityState): boolean {
  return state !== "online";
}

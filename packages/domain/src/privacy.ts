export const privacyModes = ["ANON", "CONF", "IDEN"] as const;
export type PrivacyMode = (typeof privacyModes)[number];

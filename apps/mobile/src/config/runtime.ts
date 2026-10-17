export type AppMode = "development" | "demo" | "production";

const configuredMode = process.env.EXPO_PUBLIC_APP_MODE;

export const appMode: AppMode =
  configuredMode === "production" || configuredMode === "demo" ? configuredMode : "development";

/** Demo controls are opt-in and can never be enabled by a production profile. */
export const demoControlsEnabled =
  appMode !== "production" && process.env.EXPO_PUBLIC_ENABLE_DEMO_CONTROLS === "true";

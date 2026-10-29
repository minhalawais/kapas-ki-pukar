const EXPO_PUSH_TOKEN =
  /^(?:ExpoPushToken|ExponentPushToken)\[[\w-]+\]$/u;

export function isValidExpoPushToken(token: string): boolean {
  return token.length >= 20 && token.length <= 255 && EXPO_PUSH_TOKEN.test(token);
}

/** Active device registration is explicit opt-in for push on that complaint. */
export function pushDeliveryPermitted(input: { activeRegistrationCount: number }): boolean {
  return input.activeRegistrationCount > 0;
}

export function resolveNotificationLocale(
  preferredLanguage: string | null | undefined,
  registrationLocale: string | null | undefined,
): string {
  const candidate = registrationLocale ?? preferredLanguage ?? "en";
  return candidate.toLowerCase().startsWith("ur") ? "ur" : "en";
}

import * as SecureStore from "expo-secure-store";

const keyFor = (draftId: string) => `kapas-cnic-${draftId.replace(/[^A-Za-z0-9._-]/g, "-")}`;

export function normalizeCnic(value: string): string {
  return value.replace(/\D/g, "").slice(0, 13);
}

export function isValidCnic(value: string): boolean {
  return /^\d{13}$/.test(normalizeCnic(value));
}

export function formatCnic(value: string): string {
  const digits = normalizeCnic(value);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return digits.length === 11;
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export const expoIdentityService = {
  async saveCnic(draftId: string, value: string): Promise<string> {
    const isPhone = value.replace(/\D/g, "").length <= 11;
    const normalized = isPhone ? normalizePhone(value) : normalizeCnic(value);
    const valid = isPhone ? isValidPhone(normalized) : isValidCnic(normalized);
    if (!valid) {
      throw new Error("invalid-identity");
    }
    await SecureStore.setItemAsync(keyFor(draftId), normalized, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return normalized.slice(-4);
  },
  async removeCnic(draftId: string): Promise<void> {
    await SecureStore.deleteItemAsync(keyFor(draftId));
  },
};

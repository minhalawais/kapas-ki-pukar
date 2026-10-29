import * as SecureStore from "expo-secure-store";

const keyFor = (draftId: string, kind: "cnic" | "phone") =>
  `kapas-identity-${kind}-${draftId.replace(/[^A-Za-z0-9._-]/g, "-")}`;

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
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0092")) return `0${digits.slice(4)}`.slice(0, 11);
  if (digits.startsWith("92")) return `0${digits.slice(2)}`.slice(0, 11);
  return digits.slice(0, 11);
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return /^03\d{9}$/.test(digits);
}

export function canonicalizePhone(value: string): string {
  const digits = normalizePhone(value);
  if (!isValidPhone(digits)) throw new Error("invalid-phone");
  return `+92${digits.slice(1)}`;
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export const expoIdentityService = {
  async saveIdentity(
    draftId: string,
    input: { phone: string; cnic?: string },
  ): Promise<{ phoneLast4: string; cnicLast4?: string }> {
    const phone = canonicalizePhone(input.phone);
    const cnic = input.cnic ? normalizeCnic(input.cnic) : undefined;
    if (cnic && !isValidCnic(cnic)) throw new Error("invalid-cnic");
    const options = {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    } as const;
    await SecureStore.setItemAsync(keyFor(draftId, "phone"), phone, options);
    if (cnic) await SecureStore.setItemAsync(keyFor(draftId, "cnic"), cnic, options);
    else await SecureStore.deleteItemAsync(keyFor(draftId, "cnic"));
    return { phoneLast4: phone.slice(-4), cnicLast4: cnic?.slice(-4) };
  },
  async removeCnic(draftId: string): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(keyFor(draftId, "cnic")),
      SecureStore.deleteItemAsync(keyFor(draftId, "phone")),
    ]);
  },
  async removeIdentity(draftId: string): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(keyFor(draftId, "cnic")),
      SecureStore.deleteItemAsync(keyFor(draftId, "phone")),
    ]);
  },
  async getIdentity(draftId: string): Promise<{ phone: string; cnic?: string } | null> {
    const [phone, cnic] = await Promise.all([
      SecureStore.getItemAsync(keyFor(draftId, "phone")),
      SecureStore.getItemAsync(keyFor(draftId, "cnic")),
    ]);
    return phone ? { phone, ...(cnic ? { cnic } : {}) } : null;
  },
};

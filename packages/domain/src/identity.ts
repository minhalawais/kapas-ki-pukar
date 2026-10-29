export function normalizePakistanCnic(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{13}$/.test(digits)) throw new Error("invalid_cnic");
  return digits;
}

export function normalizePakistanPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("0092")
    ? `0${digits.slice(4)}`
    : digits.startsWith("92")
      ? `0${digits.slice(2)}`
      : digits;
  if (!/^03\d{9}$/.test(local)) throw new Error("invalid_phone");
  return `+92${local.slice(1)}`;
}

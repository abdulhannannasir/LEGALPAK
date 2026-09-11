/** 13-digit Pakistani CNIC, with or without the conventional 5-7-1 dashes. */
export function isValidCnic(value: string): boolean {
  if (!value) return false;
  const digits = value.replace(/[^0-9]/g, "");
  return digits.length === 13;
}

/** Normalises a CNIC to 5-7-1 dashed form once it has 13 digits typed. */
export function formatCnic(value: string): string {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 13);
  const parts = [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter(Boolean);
  return parts.join("-");
}

/** SECP CUIN: 7-digit incorporation number, occasionally shown 0000000-ABC. */
export function isValidCuin(value: string): boolean {
  if (!value) return false;
  return /^\d{6,7}(-[A-Z]+)?$/i.test(value.trim());
}

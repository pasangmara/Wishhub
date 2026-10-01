const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(input: string | null | undefined): string | null {
  const v = (input ?? "").trim().toLowerCase();
  return v && EMAIL_RE.test(v) ? v : null;
}

/** Keeps a leading + and digits only. Returns null for obviously invalid numbers. */
export function normalizePhone(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  const plus = raw.startsWith("+") || raw.startsWith("00");
  const digits = raw.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 6 || digits.length > 15) return null;
  return (plus ? "+" : "") + digits;
}

/** Splits the single "Phone or email" field on the public form. */
export function parseContact(input: string | null | undefined): { phone: string | null; email: string | null } {
  const v = (input ?? "").trim();
  if (!v) return { phone: null, email: null };
  if (v.includes("@")) return { phone: null, email: normalizeEmail(v) };
  return { phone: normalizePhone(v), email: null };
}

/** wa.me needs digits only, international format. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const p = normalizePhone(phone);
  return p ? p.replace(/^\+/, "") : null;
}

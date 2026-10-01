export function getAuthSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return s;
}

export function secretKey(purpose: string): Uint8Array {
  return new TextEncoder().encode(`${purpose}:${getAuthSecret()}`);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Picks white or near-black text for a given background colour. */
export function readableOn(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const L = luminance(rgb);
  const contrastWhite = 1.05 / (L + 0.05);
  const contrastDark = (L + 0.05) / (luminance([15, 23, 42]) + 0.05);
  return contrastWhite >= contrastDark ? "#ffffff" : "#0f172a";
}

export function safeHex(hex: string | null | undefined, fallback: string) {
  return hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

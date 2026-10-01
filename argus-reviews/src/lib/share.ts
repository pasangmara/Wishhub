/** Review-link + share builders. Pure functions — safe for client and server. */

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export type ShareChannel = "whatsapp" | "email" | "qr" | "website" | "direct";

export function reviewUrl(slug: string, source?: ShareChannel, base = appUrl()) {
  const url = `${base}/r/${slug}`;
  return source && source !== "direct" ? `${url}?s=${source}` : url;
}

export function whatsappMessage(businessName: string, url: string) {
  return `Hi 👋\n\nThank you for visiting ${businessName}.\n\nWe'd love to hear about your experience.\n\nShare your feedback:\n${url}\n\nThank you!`;
}

/** Share deep link. With a phone number it opens that chat directly. */
export function whatsappShareLink(businessName: string, url: string, phoneDigits?: string | null) {
  const text = encodeURIComponent(whatsappMessage(businessName, url));
  return phoneDigits ? `https://wa.me/${phoneDigits}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function emailShareLink(businessName: string, url: string, to = "") {
  const subject = `How was your experience at ${businessName}?`;
  const body = `Thank you for visiting ${businessName}.\n\nWe'd love to hear your feedback:\n\n${url}`;
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function websiteButtonSnippet(url: string, color: string) {
  return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;background:${color};color:#fff;font:600 15px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.12)">★ Share Your Experience</a>`;
}

export function embedScriptSnippet(slug: string, base = appUrl()) {
  return `<script src="${base}/embed.js" data-argus-slug="${slug}" defer></script>`;
}

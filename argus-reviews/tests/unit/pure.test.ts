import { describe, expect, it } from "vitest";
import { RATING_LABELS, getTypeConfig, isPositiveRating, shouldShowGoogleReview } from "@/lib/business-types";
import { readableOn } from "@/lib/color";
import { normalizeEmail, normalizePhone, parseContact, whatsappNumber } from "@/lib/contact";
import { emailShareLink, reviewUrl, whatsappMessage, whatsappShareLink } from "@/lib/share";
import { publicReviewSchema } from "@/lib/validation";

describe("Google Review CTA rule", () => {
  const url = "https://g.page/r/demo/review";
  it.each([
    [5, true],
    [4, true],
    [3, false],
    [2, false],
    [1, false],
  ])("rating %i → show=%s", (rating, show) => {
    expect(shouldShowGoogleReview(rating, url)).toBe(show);
  });
  it("never shows without a configured URL", () => {
    expect(shouldShowGoogleReview(5, null)).toBe(false);
    expect(shouldShowGoogleReview(5, "")).toBe(false);
  });
  it("positive threshold is configurable", () => {
    expect(isPositiveRating(4, 5)).toBe(false);
  });
});

describe("business type configuration", () => {
  it("has rating labels for every star", () => {
    expect(RATING_LABELS).toEqual({ 5: "Excellent", 4: "Great", 3: "Good", 2: "Could be better", 1: "Needs improvement" });
  });
  it("adapts headline and options to hotels", () => {
    const hotel = getTypeConfig("hotel");
    expect(hotel.headline).toBe("How was your stay?");
    expect(hotel.serviceOptions).toContain("Housekeeping");
    expect(hotel.detailQuestions.length).toBeLessThanOrEqual(2);
  });
  it("falls back to restaurant for unknown types", () => {
    expect(getTypeConfig("spaceship").label).toBe("Restaurant");
  });
});

describe("contact parsing", () => {
  it("splits the single phone-or-email field", () => {
    expect(parseContact("Rahim@Example.com ")).toEqual({ phone: null, email: "rahim@example.com" });
    expect(parseContact("+880 1711-000000")).toEqual({ phone: "+8801711000000", email: null });
    expect(parseContact("")).toEqual({ phone: null, email: null });
  });
  it("rejects junk", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
  });
  it("builds wa.me numbers", () => {
    expect(whatsappNumber("+880 1711 000000")).toBe("8801711000000");
  });
});

describe("public review validation", () => {
  const base = { business_slug: "abc-restaurant", rating: 5, feedback: "Great food" };
  it("accepts a minimal review (no name, phone, email, photo)", () => {
    const r = publicReviewSchema.parse(base);
    expect(r).toMatchObject({ name: null, phone: null, email: null, photo_token: null, consent_to_publish: false, source: "direct" });
  });
  it("rejects invalid ratings", () => {
    for (const rating of [0, 6, 4.5, "5"]) expect(publicReviewSchema.safeParse({ ...base, rating }).success).toBe(false);
  });
  it("rejects empty feedback", () => {
    expect(publicReviewSchema.safeParse({ ...base, feedback: "   " }).success).toBe(false);
  });
  it("coerces unknown sources to direct", () => {
    expect(publicReviewSchema.parse({ ...base, source: "evil" }).source).toBe("direct");
    expect(publicReviewSchema.parse({ ...base, source: "qr" }).source).toBe("qr");
  });
});

describe("share links", () => {
  it("builds tracked review URLs", () => {
    expect(reviewUrl("abc-restaurant", undefined, "https://x.test")).toBe("https://x.test/r/abc-restaurant");
    expect(reviewUrl("abc-restaurant", "qr", "https://x.test")).toBe("https://x.test/r/abc-restaurant?s=qr");
  });
  it("uses the specified WhatsApp message", () => {
    const msg = whatsappMessage("ABC Restaurant", "https://x.test/r/abc");
    expect(msg).toContain("Thank you for visiting ABC Restaurant.");
    expect(msg).toContain("Share your feedback:\nhttps://x.test/r/abc");
    expect(whatsappShareLink("ABC Restaurant", "https://x.test/r/abc")).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });
  it("uses the specified email subject", () => {
    expect(decodeURIComponent(emailShareLink("ABC Restaurant", "u"))).toContain("subject=How was your experience at ABC Restaurant?");
  });
});

describe("colour contrast", () => {
  it("picks readable text", () => {
    expect(readableOn("#14532d")).toBe("#ffffff");
    expect(readableOn("#fde68a")).toBe("#0f172a");
  });
});

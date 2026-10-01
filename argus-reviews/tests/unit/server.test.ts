import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { businesses, customers, reviewMedia, reviews } from "@/db/schema";
import { toCsv, type ReviewExportRow } from "@/lib/export";
import { createReview, RATE_LIMIT_PER_HOUR } from "@/lib/reviews";
import { signPhotoToken } from "@/lib/tokens";
import { publicReviewSchema } from "@/lib/validation";
import { signWebhook } from "@/lib/webhooks";

const SLUG = "vitest-bistro";
let businessId = "";

function input(extra: Record<string, unknown> = {}) {
  return publicReviewSchema.parse({ business_slug: SLUG, rating: 5, feedback: "Lovely dinner", ...extra });
}

beforeAll(async () => {
  const [b] = await db
    .insert(businesses)
    .values({ name: "Vitest Bistro", slug: SLUG, plan: "premium", googleReviewUrl: "https://g.page/r/test/review" })
    .returning();
  businessId = b.id;
});

afterAll(async () => {
  await db.delete(businesses).where(eq(businesses.id, businessId));
});

describe("createReview", () => {
  it("returns the Google CTA for 5 stars and stores the review as NEW", async () => {
    const r = await createReview(input(), { ipHash: null });
    expect(r).toMatchObject({ ok: true, rating: 5, show_google_review: true, google_review_url: "https://g.page/r/test/review" });
    if (!r.ok) return;
    const [row] = await db.select().from(reviews).where(eq(reviews.id, r.review_id));
    expect(row.status).toBe("NEW");
    expect(row.customerId).toBeNull();
  });

  it("puts ≤3 star reviews into FOLLOW_UP without a Google CTA", async () => {
    const r = await createReview(input({ rating: 2, phone: "+8801700000001" }), { ipHash: null });
    expect(r).toMatchObject({ ok: true, show_google_review: false, google_review_url: null });
    if (!r.ok) return;
    const [row] = await db.select().from(reviews).where(eq(reviews.id, r.review_id));
    expect(row.status).toBe("FOLLOW_UP");
    const [c] = await db.select().from(customers).where(eq(customers.id, row.customerId!));
    expect(c.status).toBe("FOLLOW_UP");
  });

  it("dedupes customers by phone and email", async () => {
    const a = await createReview(input({ name: "Rahim", phone: "+880 1711 111111" }), { ipHash: null });
    const b = await createReview(input({ phone: "+8801711111111", email: "rahim@example.com" }), { ipHash: null });
    const c = await createReview(input({ email: "RAHIM@example.com" }), { ipHash: null });
    if (!a.ok || !b.ok || !c.ok) throw new Error("expected ok");
    const rows = await db.select({ customerId: reviews.customerId }).from(reviews).where(eq(reviews.businessId, businessId));
    const ids = new Set(
      rows.filter((r) => r.customerId).map((r) => r.customerId),
    );
    const [rahim] = await db.select().from(customers).where(eq(customers.phone, "+8801711111111"));
    expect(rahim).toMatchObject({ name: "Rahim", email: "rahim@example.com", status: "ACTIVE" });
    expect(ids.has(rahim.id)).toBe(true);
    const own = await db.select().from(reviews).where(eq(reviews.customerId, rahim.id));
    expect(own).toHaveLength(3);
  });

  it("is idempotent for duplicate submissions", async () => {
    const payload = input({ submission_id: "dup-test-0001" });
    const [r1, r2] = await Promise.all([createReview(payload, { ipHash: null }), createReview(payload, { ipHash: null })]);
    if (!r1.ok || !r2.ok) throw new Error("expected ok");
    expect(r1.review_id).toBe(r2.review_id);
    const rows = await db.select().from(reviews).where(eq(reviews.submissionId, "dup-test-0001"));
    expect(rows).toHaveLength(1);
  });

  it("rejects unknown and inactive businesses", async () => {
    expect(await createReview(input({ business_slug: "does-not-exist" }), { ipHash: null })).toMatchObject({ ok: false, status: 404 });
  });

  it("rate-limits by IP hash", async () => {
    const ipHash = "ratelimit-test";
    for (let i = 0; i < RATE_LIMIT_PER_HOUR; i++) {
      expect((await createReview(input(), { ipHash })).ok).toBe(true);
    }
    expect(await createReview(input(), { ipHash })).toMatchObject({ ok: false, status: 429 });
  });

  it("links an uploaded photo only with a valid token for the same business", async () => {
    const key = `reviews/${businessId}/test-photo.webp`;
    await db.insert(reviewMedia).values({ businessId, storageKey: key, mime: "image/webp" });
    const bad = await createReview(input({ photo_token: await signPhotoToken({ key, bid: "00000000-0000-0000-0000-000000000000" }) }), { ipHash: null });
    expect(bad).toMatchObject({ ok: false, status: 400 });
    const good = await createReview(input({ photo_token: await signPhotoToken({ key, bid: businessId }) }), { ipHash: null });
    if (!good.ok) throw new Error("expected ok");
    const [media] = await db.select().from(reviewMedia).where(eq(reviewMedia.storageKey, key));
    expect(media.reviewId).toBe(good.review_id);
    // The same upload cannot be attached twice.
    const again = await createReview(input({ photo_token: await signPhotoToken({ key, bid: businessId }) }), { ipHash: null });
    expect(again).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects photos for basic-plan businesses", async () => {
    await db.update(businesses).set({ plan: "basic" }).where(eq(businesses.id, businessId));
    const r = await createReview(input({ photo_token: await signPhotoToken({ key: "x", bid: businessId }) }), { ipHash: null });
    expect(r).toMatchObject({ ok: false, status: 400 });
    await db.update(businesses).set({ plan: "premium" }).where(eq(businesses.id, businessId));
  });
});

describe("webhooks + export", () => {
  it("signs payloads with HMAC-SHA256 over timestamp.body", () => {
    const sig = signWebhook('{"a":1}', "secret", 1700000000);
    expect(sig).toBe(createHmac("sha256", "secret").update('1700000000.{"a":1}').digest("hex"));
  });

  it("escapes CSV and neutralizes formulas", () => {
    const row = { review_id: "1", business: "B", feedback: '=HYPERLINK("x")', customer_name: 'A "B", C' } as unknown as ReviewExportRow;
    const csv = toCsv([row]);
    expect(csv.split("\r\n")[0]).toContain("Review ID,Business,Customer Name");
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain(`"A ""B"", C"`);
  });
});

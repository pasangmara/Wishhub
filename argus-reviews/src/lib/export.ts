import "server-only";
import { and, desc, eq, gte, inArray, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { businesses, creativePosts, customers, reviews, type ReviewStatus } from "@/db/schema";
import { appUrl } from "./share";

/**
 * Flat review row — the exact field set used for Google Sheets / n8n.
 * The app database stays the source of truth; this is only a projection.
 */
export type ReviewExportRow = {
  review_id: string;
  business: string;
  business_slug: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  rating: number;
  feedback: string;
  service: string | null;
  photo_url: string | null;
  consent: boolean;
  source: string;
  status: string;
  creative_status: string | null;
  creative_url: string | null;
  caption: string | null;
  publish_status: string | null;
  created_at: string;
};

export const EXPORT_HEADERS: { key: keyof ReviewExportRow; label: string }[] = [
  { key: "review_id", label: "Review ID" },
  { key: "business", label: "Business" },
  { key: "customer_name", label: "Customer Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "rating", label: "Rating" },
  { key: "feedback", label: "Feedback" },
  { key: "service", label: "Service" },
  { key: "photo_url", label: "Photo URL" },
  { key: "consent", label: "Consent" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "creative_status", label: "Creative Status" },
  { key: "creative_url", label: "Creative URL" },
  { key: "caption", label: "Caption" },
  { key: "publish_status", label: "Publish Status" },
  { key: "created_at", label: "Created At" },
];

export async function listExportRows(opts: {
  businessId: string;
  reviewIds?: string[];
  since?: Date;
  status?: ReviewStatus;
  limit?: number;
}): Promise<ReviewExportRow[]> {
  const where: SQL[] = [eq(reviews.businessId, opts.businessId)];
  if (opts.reviewIds?.length) where.push(inArray(reviews.id, opts.reviewIds));
  if (opts.since) where.push(gte(reviews.updatedAt, opts.since));
  if (opts.status) where.push(eq(reviews.status, opts.status));

  const latestCreative = db
    .selectDistinctOn([creativePosts.reviewId], {
      reviewId: creativePosts.reviewId,
      id: creativePosts.id,
      status: creativePosts.status,
      imageUrl: creativePosts.imageUrl,
      caption: creativePosts.caption,
    })
    .from(creativePosts)
    .orderBy(creativePosts.reviewId, desc(creativePosts.createdAt))
    .as("latest_creative");

  const rows = await db
    .select({
      id: reviews.id,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      rating: reviews.rating,
      feedback: reviews.feedback,
      service: reviews.serviceType,
      photo: reviews.photoUrl,
      consent: reviews.consentToPublish,
      source: reviews.source,
      status: reviews.status,
      creativeId: latestCreative.id,
      creativeStatus: latestCreative.status,
      creativeUrl: latestCreative.imageUrl,
      caption: latestCreative.caption,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .innerJoin(businesses, eq(businesses.id, reviews.businessId))
    .leftJoin(customers, eq(customers.id, reviews.customerId))
    .leftJoin(latestCreative, eq(latestCreative.reviewId, reviews.id))
    .where(and(...where))
    .orderBy(desc(reviews.createdAt))
    .limit(Math.min(opts.limit ?? 500, 5000));

  const base = appUrl();
  return rows.map((r) => ({
    review_id: r.id,
    business: r.businessName,
    business_slug: r.businessSlug,
    customer_name: r.name,
    phone: r.phone,
    email: r.email,
    rating: r.rating,
    feedback: r.feedback,
    service: r.service,
    // Requires the integration API key (Bearer); photos are never exposed publicly.
    photo_url: r.photo ? `${base}/api/integrations/v1/reviews/${r.id}/photo` : null,
    consent: r.consent,
    source: r.source,
    status: r.status,
    creative_status: r.creativeStatus ?? null,
    creative_url: r.creativeUrl ?? (r.creativeId ? `${base}/admin/creatives?post=${r.creativeId}` : null),
    caption: r.caption ?? null,
    publish_status: r.creativeStatus ? (r.creativeStatus === "PUBLISHED" ? "PUBLISHED" : "NOT_PUBLISHED") : null,
    created_at: r.createdAt.toISOString(),
  }));
}

export function toCsv(rows: ReviewExportRow[]) {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // Neutralize spreadsheet formula injection.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const head = EXPORT_HEADERS.map((h) => esc(h.label)).join(",");
  const body = rows.map((r) => EXPORT_HEADERS.map((h) => esc(r[h.key])).join(","));
  return [head, ...body].join("\r\n") + "\r\n";
}


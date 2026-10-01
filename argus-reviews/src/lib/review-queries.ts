import "server-only";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { customers, reviews, type ReviewStatus } from "@/db/schema";

export const PAGE_SIZE = 20;

export type ReviewRow = {
  id: string;
  rating: number;
  feedback: string;
  serviceType: string | null;
  answers: Record<string, number> | null;
  hasPhoto: boolean;
  consent: boolean;
  source: string;
  status: ReviewStatus;
  createdAt: string;
  customer: { id: string; name: string | null; phone: string | null; email: string | null } | null;
};

const selection = {
  id: reviews.id,
  rating: reviews.rating,
  feedback: reviews.feedback,
  serviceType: reviews.serviceType,
  answers: reviews.answers,
  photoUrl: reviews.photoUrl,
  consent: reviews.consentToPublish,
  source: reviews.source,
  status: reviews.status,
  createdAt: reviews.createdAt,
  customerId: customers.id,
  name: customers.name,
  phone: customers.phone,
  email: customers.email,
};

type Raw = { [K in keyof typeof selection]: unknown } & Record<string, unknown>;

function toRow(r: Raw): ReviewRow {
  return {
    id: r.id as string,
    rating: r.rating as number,
    feedback: r.feedback as string,
    serviceType: (r.serviceType as string) ?? null,
    answers: (r.answers as Record<string, number>) ?? null,
    hasPhoto: Boolean(r.photoUrl),
    consent: r.consent as boolean,
    source: r.source as string,
    status: r.status as ReviewStatus,
    createdAt: (r.createdAt as Date).toISOString(),
    customer: r.customerId
      ? { id: r.customerId as string, name: (r.name as string) ?? null, phone: (r.phone as string) ?? null, email: (r.email as string) ?? null }
      : null,
  };
}

export async function listReviews(
  businessId: string,
  f: { status?: ReviewStatus; rating?: number; q?: string; page?: number },
) {
  const where: SQL[] = [eq(reviews.businessId, businessId)];
  if (f.status) where.push(eq(reviews.status, f.status));
  if (f.rating) where.push(eq(reviews.rating, f.rating));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, "\\$&")}%`;
    where.push(or(ilike(reviews.feedback, like), ilike(customers.name, like), ilike(customers.phone, like), ilike(customers.email, like))!);
  }
  const page = Math.max(1, f.page ?? 1);
  const [rows, [{ n }]] = await Promise.all([
    db
      .select(selection)
      .from(reviews)
      .leftJoin(customers, eq(customers.id, reviews.customerId))
      .where(and(...where))
      .orderBy(desc(reviews.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ n: count() })
      .from(reviews)
      .leftJoin(customers, eq(customers.id, reviews.customerId))
      .where(and(...where)),
  ]);
  return { rows: rows.map(toRow), total: n, page, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

export async function getReview(businessId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [r] = await db
    .select(selection)
    .from(reviews)
    .leftJoin(customers, eq(customers.id, reviews.customerId))
    .where(and(eq(reviews.businessId, businessId), eq(reviews.id, id)))
    .limit(1);
  return r ? toRow(r) : null;
}

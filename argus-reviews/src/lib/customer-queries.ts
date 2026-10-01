import "server-only";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { customers, reviews, type CustomerStatus } from "@/db/schema";

export const CUSTOMER_PAGE_SIZE = 25;

export type CustomerRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: CustomerStatus;
  totalReviews: number;
  averageRating: number | null;
  lastVisit: string | null;
  lastFeedback: string | null;
  createdAt: string;
};

export async function listCustomers(businessId: string, f: { status?: CustomerStatus; q?: string; page?: number }) {
  const where: SQL[] = [eq(customers.businessId, businessId)];
  if (f.status) where.push(eq(customers.status, f.status));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, "\\$&")}%`;
    where.push(or(ilike(customers.name, like), ilike(customers.phone, like), ilike(customers.email, like))!);
  }
  const page = Math.max(1, f.page ?? 1);
  const lastVisit = sql<Date | null>`max(${reviews.createdAt})`;

  const [rows, [{ n }]] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        status: customers.status,
        createdAt: customers.createdAt,
        totalReviews: count(reviews.id),
        averageRating: sql<string | null>`avg(${reviews.rating})`,
        lastVisit,
        lastFeedback: sql<string | null>`(array_agg(${reviews.feedback} order by ${reviews.createdAt} desc))[1]`,
      })
      .from(customers)
      .leftJoin(reviews, eq(reviews.customerId, customers.id))
      .where(and(...where))
      .groupBy(customers.id)
      .orderBy(sql`${lastVisit} desc nulls last`, desc(customers.createdAt))
      .limit(CUSTOMER_PAGE_SIZE)
      .offset((page - 1) * CUSTOMER_PAGE_SIZE),
    db.select({ n: count() }).from(customers).where(and(...where)),
  ]);

  return {
    rows: rows.map<CustomerRow>((r) => ({
      ...r,
      averageRating: r.averageRating ? Number(r.averageRating) : null,
      lastVisit: r.lastVisit ? new Date(r.lastVisit).toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
    total: n,
    page,
    pages: Math.max(1, Math.ceil(n / CUSTOMER_PAGE_SIZE)),
  };
}

export async function getCustomerDetail(businessId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [c] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.businessId, businessId), eq(customers.id, id)))
    .limit(1);
  if (!c) return null;
  const history = await db
    .select({ id: reviews.id, rating: reviews.rating, feedback: reviews.feedback, status: reviews.status, serviceType: reviews.serviceType, createdAt: reviews.createdAt })
    .from(reviews)
    .where(and(eq(reviews.businessId, businessId), eq(reviews.customerId, c.id)))
    .orderBy(desc(reviews.createdAt))
    .limit(100);
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    reviews: history.map((h) => ({ ...h, createdAt: h.createdAt.toISOString() })),
  };
}

export type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomerDetail>>>;

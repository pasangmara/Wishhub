import "server-only";
import { and, avg, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, reviews } from "@/db/schema";

export async function getOverviewStats(businessId: string) {
  const [row] = await db
    .select({
      total: count(),
      average: avg(reviews.rating),
      fiveStar: sql<number>`count(*) filter (where ${reviews.rating} = 5)`.mapWith(Number),
      positive: sql<number>`count(*) filter (where ${reviews.rating} >= 4)`.mapWith(Number),
      followUp: sql<number>`count(*) filter (where ${reviews.status} = 'FOLLOW_UP')`.mapWith(Number),
      featured: sql<number>`count(*) filter (where ${reviews.status} = 'FEATURED')`.mapWith(Number),
      newCount: sql<number>`count(*) filter (where ${reviews.status} = 'NEW')`.mapWith(Number),
      last7: sql<number>`count(*) filter (where ${reviews.createdAt} > now() - interval '7 days')`.mapWith(Number),
    })
    .from(reviews)
    .where(eq(reviews.businessId, businessId));
  return { ...row, average: row.average ? Number(row.average) : 0 };
}

export async function getRecentReviews(businessId: string, limit = 5) {
  return db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      feedback: reviews.feedback,
      status: reviews.status,
      serviceType: reviews.serviceType,
      createdAt: reviews.createdAt,
      name: customers.name,
    })
    .from(reviews)
    .leftJoin(customers, eq(customers.id, reviews.customerId))
    .where(eq(reviews.businessId, businessId))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);
}

export type ActivityDay = { day: string; total: number; positive: number };

export async function getReviewActivity(businessId: string, days = 30): Promise<ActivityDay[]> {
  const rows = await db.execute<{ day: string; total: number; positive: number }>(sql`
    select to_char(d.day, 'YYYY-MM-DD') as day,
           count(r.id)::int as total,
           (count(r.id) filter (where r.rating >= 4))::int as positive
    from generate_series(current_date - ${days - 1}::int, current_date, interval '1 day') as d(day)
    left join ${reviews} r
      on r.business_id = ${businessId}
     and r.created_at >= d.day and r.created_at < d.day + interval '1 day'
    group by d.day
    order by d.day
  `);
  return rows.map((r) => ({ day: r.day, total: Number(r.total), positive: Number(r.positive) }));
}

export async function countByStatus(businessId: string) {
  const rows = await db
    .select({ status: reviews.status, n: count() })
    .from(reviews)
    .where(eq(reviews.businessId, businessId))
    .groupBy(reviews.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>;
}

export async function countCustomersNeedingFollowUp(businessId: string) {
  const [r] = await db
    .select({ n: count() })
    .from(customers)
    .where(and(eq(customers.businessId, businessId), eq(customers.status, "FOLLOW_UP")));
  return r.n;
}

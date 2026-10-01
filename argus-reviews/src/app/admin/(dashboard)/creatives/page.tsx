import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import { Card, EmptyState } from "@/components/admin/ui";
import { db } from "@/db";
import { creativePosts, customers, reviews } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { CreativesBoard } from "./creatives-board";

export const metadata: Metadata = { title: "Creatives" };

export default async function CreativesPage({ searchParams }: PageProps<"/admin/creatives">) {
  const ctx = await requireAdmin();
  const sp = await searchParams;
  const highlight = typeof sp.review === "string" ? sp.review : typeof sp.post === "string" ? sp.post : null;
  const bid = ctx.business.id;

  const [posts, candidates] = await Promise.all([
    db
      .select({
        id: creativePosts.id,
        caption: creativePosts.caption,
        imageUrl: creativePosts.imageUrl,
        status: creativePosts.status,
        createdAt: creativePosts.createdAt,
        reviewId: creativePosts.reviewId,
        rating: reviews.rating,
        name: customers.name,
      })
      .from(creativePosts)
      .leftJoin(reviews, eq(reviews.id, creativePosts.reviewId))
      .leftJoin(customers, eq(customers.id, reviews.customerId))
      .where(eq(creativePosts.businessId, bid))
      .orderBy(desc(creativePosts.createdAt))
      .limit(60),
    db
      .select({ id: reviews.id, rating: reviews.rating, feedback: reviews.feedback, status: reviews.status, name: customers.name, createdAt: reviews.createdAt })
      .from(reviews)
      .leftJoin(customers, eq(customers.id, reviews.customerId))
      .leftJoin(creativePosts, eq(creativePosts.reviewId, reviews.id))
      .where(
        and(
          eq(reviews.businessId, bid),
          eq(reviews.consentToPublish, true),
          inArray(reviews.status, ["APPROVED", "FEATURED"]),
          isNull(creativePosts.id),
        ),
      )
      .orderBy(desc(reviews.createdAt))
      .limit(30),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink-900 sm:text-[30px]">Creatives</h1>
        <p className="mt-1 text-sm text-ink-500">
          Turn approved, consented reviews into ready-to-post social images.
        </p>
      </div>
      {posts.length === 0 && candidates.length === 0 ? (
        <Card>
          <EmptyState
            title="Nothing to create yet"
            body="Approve or feature reviews where the guest gave permission for public use — they'll show up here, ready to become posts."
          />
        </Card>
      ) : (
        <CreativesBoard
          highlight={highlight}
          posts={posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
          candidates={candidates.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
        />
      )}
    </div>
  );
}

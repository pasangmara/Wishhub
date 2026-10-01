import { after, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { createReview } from "@/lib/reviews";
import { clientIp, hashIp } from "@/lib/tokens";
import { firstError, publicReviewSchema } from "@/lib/validation";
import { deliverReviewEvent } from "@/lib/webhooks";

/** Public, unauthenticated: can ONLY create a review. Never returns stored data. */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = publicReviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: firstError(parsed.error) }, { status: 422 });
  }
  const input = parsed.data;

  // Honeypot filled → pretend success, store nothing.
  if (input.website) {
    return NextResponse.json({ success: true, review_id: null, rating: input.rating, show_google_review: false, google_review_url: null });
  }

  try {
    const result = await createReview(input, { ipHash: hashIp(clientIp(req.headers)) });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    if (!result.duplicate) {
      // Automation runs after the response is sent — the guest never waits on it.
      after(async () => {
        const businessId = result.business_id;
        await logActivity({
          businessId,
          actor: "customer",
          action: "review.created",
          entity: "review",
          entityId: result.review_id,
          meta: { rating: result.rating, source: input.source },
        });
        await deliverReviewEvent(businessId, result.review_id, "review.created");
      });
    }

    return NextResponse.json({
      success: true,
      review_id: result.review_id,
      rating: result.rating,
      show_google_review: result.show_google_review,
      google_review_url: result.google_review_url,
    });
  } catch (err) {
    console.error("[reviews] create failed", err);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

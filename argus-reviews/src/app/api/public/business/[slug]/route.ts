import { NextResponse } from "next/server";
import { getPublicBusiness } from "@/lib/business";

export async function GET(_req: Request, ctx: RouteContext<"/api/public/business/[slug]">) {
  const { slug } = await ctx.params;
  const business = await getPublicBusiness(slug);
  if (!business) {
    return NextResponse.json({ success: false, error: "Sorry, this review link is unavailable." }, { status: 404 });
  }
  return NextResponse.json(
    { success: true, business },
    { headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}

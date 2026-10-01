import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/public/review-form";
import { ReviewPageView } from "@/components/public/review-page-view";
import { getPublicBusiness } from "@/lib/business";
import { safeHex } from "@/lib/color";

// Rendered on first request, then served from cache; refreshed instantly when branding changes.
export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/r/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  if (!business) return { title: "Review link unavailable", robots: { index: false } };
  return {
    title: { absolute: `Share your experience · ${business.name}` },
    description: business.description,
    robots: { index: false, follow: false },
    openGraph: {
      title: `How was your experience at ${business.name}?`,
      description: business.description,
      images: business.cover_image_url ? [business.cover_image_url] : business.logo_url ? [business.logo_url] : undefined,
    },
  };
}

export async function generateViewport({ params }: PageProps<"/r/[slug]">): Promise<Viewport> {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  return { themeColor: safeHex(business?.primary_color, "#fbfaf7") };
}

export default async function PublicReviewPage({ params }: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  if (!business) notFound();

  return (
    <ReviewPageView business={business}>
      <ReviewForm business={business} />
    </ReviewPageView>
  );
}

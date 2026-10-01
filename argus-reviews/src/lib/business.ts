import "server-only";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { businesses, type Business } from "@/db/schema";
import { DEFAULT_POSITIVE_THRESHOLD, getTypeConfig, type BusinessTypeKey } from "./business-types";

/** The only business data that ever leaves the server on the public side. */
export type PublicBusiness = {
  name: string;
  slug: string;
  type: BusinessTypeKey;
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  headline: string;
  description: string;
  website_url: string | null;
  phone: string | null;
  address: string | null;
  opening_hours: string | null;
  features: { photo_upload: boolean };
  form: {
    feedback_prompt: string;
    feedback_placeholder: string;
    service_label: string;
    service_options: string[];
    detail_questions: { key: string; label: string }[];
  };
};

export function toPublicBusiness(b: Business): PublicBusiness {
  const cfg = getTypeConfig(b.type);
  return {
    name: b.name,
    slug: b.slug,
    type: b.type,
    logo_url: b.logoUrl,
    cover_image_url: b.coverImageUrl,
    primary_color: b.primaryColor,
    secondary_color: b.secondaryColor,
    headline: b.headline || cfg.headline,
    description: b.description || cfg.description,
    website_url: b.websiteUrl,
    phone: b.phone,
    address: b.address,
    opening_hours: b.openingHours,
    features: { photo_upload: b.plan === "premium" },
    form: {
      feedback_prompt: cfg.feedbackPrompt,
      feedback_placeholder: cfg.feedbackPlaceholder,
      service_label: cfg.serviceLabel,
      service_options: cfg.serviceOptions,
      detail_questions: b.settings?.showDetailQuestions === false ? [] : cfg.detailQuestions,
    },
  };
}

export function positiveThreshold(b: Pick<Business, "settings">) {
  return b.settings?.positiveThreshold ?? DEFAULT_POSITIVE_THRESHOLD;
}

export async function findActiveBusinessBySlug(slug: string) {
  const [b] = await db.select().from(businesses).where(eq(businesses.slug, slug.toLowerCase())).limit(1);
  return b && b.status === "active" ? b : null;
}

export function businessTag(slug: string) {
  return `business:${slug}`;
}

/** Cached public config — one indexed row, refreshed instantly when branding is saved. */
export function getPublicBusiness(slug: string): Promise<PublicBusiness | null> {
  const normalized = slug.toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(normalized)) return Promise.resolve(null);
  return unstable_cache(
    async () => {
      const b = await findActiveBusinessBySlug(normalized);
      return b ? toPublicBusiness(b) : null;
    },
    ["public-business", normalized],
    { tags: [businessTag(normalized)], revalidate: 300 },
  )();
}

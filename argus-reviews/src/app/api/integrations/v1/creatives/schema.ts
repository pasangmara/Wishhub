import { z } from "zod";

const url = z.string().trim().url().max(1000).nullish();

export const creativeCreateSchema = z.object({
  review_id: z.string().uuid(),
  template: z.string().trim().max(60).optional(),
  caption: z.string().max(2200).nullish(),
  image_url: url,
  status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"]).default("DRAFT"),
});

export const creativePatchSchema = z
  .object({
    caption: z.string().max(2200).nullish(),
    image_url: url,
    status: z.enum(["DRAFT", "APPROVED", "PUBLISHED"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

export function serializeCreative(p: {
  id: string;
  reviewId: string | null;
  template: string;
  imageUrl: string | null;
  caption: string | null;
  status: string;
  approvedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: p.id,
    review_id: p.reviewId,
    template: p.template,
    image_url: p.imageUrl,
    caption: p.caption,
    status: p.status,
    approved_at: p.approvedAt?.toISOString() ?? null,
    published_at: p.publishedAt?.toISOString() ?? null,
    created_at: p.createdAt.toISOString(),
  };
}

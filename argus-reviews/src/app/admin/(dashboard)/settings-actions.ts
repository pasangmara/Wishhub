"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { businessTag } from "@/lib/business";
import { requireAdmin } from "@/lib/session";
import { brandingSchema, businessInfoSchema, firstError, reviewSettingsSchema } from "@/lib/validation";

export type SaveState = { ok?: boolean; error?: string; savedAt?: number };

async function afterSave(slug: string, businessId: string, actor: string, action: string) {
  updateTag(businessTag(slug));
  revalidatePath(`/r/${slug}`);
  revalidatePath("/admin", "layout");
  await logActivity({ businessId, actor, action, entity: "business", entityId: businessId });
}

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v : null;
};

export async function saveBranding(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const ctx = await requireAdmin();
  const parsed = brandingSchema.safeParse({
    name: str(fd, "name"),
    headline: str(fd, "headline"),
    description: str(fd, "description"),
    primaryColor: str(fd, "primaryColor"),
    secondaryColor: str(fd, "secondaryColor"),
    logoUrl: str(fd, "logoUrl"),
    coverImageUrl: str(fd, "coverImageUrl"),
    googleReviewUrl: str(fd, "googleReviewUrl"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.update(businesses).set(parsed.data).where(eq(businesses.id, ctx.business.id));
  await afterSave(ctx.business.slug, ctx.business.id, ctx.user.email, "business.branding_updated");
  return { ok: true, savedAt: Date.now() };
}

export async function saveBusinessInfo(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const ctx = await requireAdmin();
  const parsed = businessInfoSchema.safeParse({
    name: str(fd, "name"),
    type: str(fd, "type"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    websiteUrl: str(fd, "websiteUrl"),
    address: str(fd, "address"),
    openingHours: str(fd, "openingHours"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db.update(businesses).set(parsed.data).where(eq(businesses.id, ctx.business.id));
  await afterSave(ctx.business.slug, ctx.business.id, ctx.user.email, "business.info_updated");
  return { ok: true, savedAt: Date.now() };
}

export async function saveReviewSettings(_prev: SaveState, fd: FormData): Promise<SaveState> {
  const ctx = await requireAdmin();
  const parsed = reviewSettingsSchema.safeParse({
    showDetailQuestions: fd.get("showDetailQuestions") === "on",
    googleReviewUrl: str(fd, "googleReviewUrl"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  await db
    .update(businesses)
    .set({
      googleReviewUrl: parsed.data.googleReviewUrl,
      settings: { ...ctx.business.settings, showDetailQuestions: parsed.data.showDetailQuestions },
    })
    .where(eq(businesses.id, ctx.business.id));
  await afterSave(ctx.business.slug, ctx.business.id, ctx.user.email, "business.review_settings_updated");
  return { ok: true, savedAt: Date.now() };
}

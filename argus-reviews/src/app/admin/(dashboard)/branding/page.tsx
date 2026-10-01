import type { Metadata } from "next";
import { toPublicBusiness } from "@/lib/business";
import { requireAdmin } from "@/lib/session";
import { SettingsTabs } from "../settings/settings-tabs";
import { BrandingEditor } from "./branding-editor";

export const metadata: Metadata = { title: "Branding" };

export default async function BrandingPage() {
  const ctx = await requireAdmin();
  const b = ctx.business;
  return (
    <div>
      <SettingsTabs />
      <BrandingEditor
        initial={{
          name: b.name,
          headline: b.headline ?? "",
          description: b.description ?? "",
          primaryColor: b.primaryColor,
          secondaryColor: b.secondaryColor,
          logoUrl: b.logoUrl ?? "",
          coverImageUrl: b.coverImageUrl ?? "",
          googleReviewUrl: b.googleReviewUrl ?? "",
        }}
        publicBusiness={toPublicBusiness(b)}
      />
    </div>
  );
}

import type { Business } from "@/db/schema";
import { emailShareLink, reviewUrl, whatsappShareLink } from "./share";

export function shareProps(business: Pick<Business, "slug" | "name">) {
  return {
    url: reviewUrl(business.slug),
    qrUrl: "/api/admin/qr",
    whatsappHref: whatsappShareLink(business.name, reviewUrl(business.slug, "whatsapp")),
    emailHref: emailShareLink(business.name, reviewUrl(business.slug, "email")),
    businessName: business.name,
  };
}

/**
 * Seeds the demo business (ABC Restaurant), a demo hotel, demo reviews,
 * and the first admin account from ADMIN_EMAIL / ADMIN_PASSWORD.
 *
 *   npm run db:seed            # idempotent
 *   npm run db:seed -- --reset # wipe demo data first
 */
import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

const { businesses, adminUsers, businessMembers, customers, reviews, creativePosts } = schema;

const DEMO = {
  restaurant: {
    name: "ABC Restaurant",
    slug: "abc-restaurant",
    type: "restaurant" as const,
    plan: "premium" as const,
    primaryColor: "#14532d",
    secondaryColor: "#f97316",
    headline: "How was your dining experience?",
    description: "Your feedback helps us make every visit better.",
    websiteUrl: "https://example.com",
    phone: "+8801700000000",
    email: "hello@abc-restaurant.test",
    address: "House 12, Road 5, Dhanmondi, Dhaka",
    openingHours: "Every day · 12:00 PM – 11:00 PM",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=DEMO_PLACE_ID",
    settings: { showDetailQuestions: true, positiveThreshold: 4 },
  },
  hotel: {
    name: "Lakeview Demo Hotel",
    slug: "lakeview-hotel",
    type: "hotel" as const,
    plan: "basic" as const,
    primaryColor: "#0f3d3e",
    secondaryColor: "#e0a458",
    headline: "How was your stay?",
    description: "Your feedback helps us make every stay better.",
    websiteUrl: "https://example.com",
    phone: "+8801800000000",
    address: "Lake Road, Sylhet",
    openingHours: "Reception open 24/7",
    googleReviewUrl: "https://search.google.com/local/writereview?placeid=DEMO_HOTEL_PLACE_ID",
    settings: { showDetailQuestions: true, positiveThreshold: 4 },
  },
};

type SeedReview = {
  name: string | null;
  phone?: string;
  email?: string;
  rating: number;
  feedback: string;
  service: string;
  daysAgo: number;
  status: schema.ReviewStatus;
  consent: boolean;
  source: schema.ReviewSource;
  answers?: Record<string, number>;
};

const RESTAURANT_REVIEWS: SeedReview[] = [
  { name: "Rahim Ahmed", phone: "+8801711000001", rating: 5, feedback: "Excellent food and service. The kacchi biryani was perfectly cooked and the staff made our family dinner feel special. We will definitely come back!", service: "Dining", daysAgo: 0, status: "NEW", consent: true, source: "whatsapp", answers: { food: 5, service: 5 } },
  { name: "Nusrat Jahan", email: "nusrat.demo@example.com", rating: 5, feedback: "Beautiful ambience and the desserts were amazing. Our server was very attentive without being pushy. Perfect place for a birthday dinner.", service: "Ambience", daysAgo: 1, status: "FEATURED", consent: true, source: "qr", answers: { food: 5, service: 5 } },
  { name: "Imran Hossain", phone: "+8801711000003", rating: 3, feedback: "Food was good but we waited almost 40 minutes for our main course. Please improve the waiting time on weekends.", service: "Service", daysAgo: 2, status: "FOLLOW_UP", consent: false, source: "direct", answers: { food: 4, service: 2 } },
  { name: "Farzana Akter", email: "farzana.demo@example.com", rating: 4, feedback: "Great taste and generous portions. The place was a little noisy, but overall a lovely evening.", service: "Food Quality", daysAgo: 3, status: "APPROVED", consent: true, source: "email", answers: { food: 5, service: 4 } },
  { name: "Tanvir Rahman", phone: "+8801711000005", rating: 5, feedback: "Best grilled chicken in the area. Friendly staff and quick service even when it was busy.", service: "Food Quality", daysAgo: 5, status: "APPROVED", consent: true, source: "qr" },
  { name: null, rating: 4, feedback: "Nice lunch set menu, good value for money.", service: "Dining", daysAgo: 7, status: "REVIEWED", consent: false, source: "qr" },
  { name: "Sadia Islam", phone: "+8801711000007", rating: 5, feedback: "We celebrated our anniversary here and the team surprised us with a small cake. Thank you!", service: "Staff", daysAgo: 9, status: "FEATURED", consent: true, source: "whatsapp" },
  { name: "Mehedi Hasan", email: "mehedi.demo@example.com", rating: 2, feedback: "The soup was cold when it arrived and the table was not cleaned properly.", service: "Service", daysAgo: 12, status: "FOLLOW_UP", consent: false, source: "website" },
  { name: "Ayesha Siddiqua", phone: "+8801711000009", rating: 5, feedback: "Lovely atmosphere, great music, and the mocktails were fantastic.", service: "Ambience", daysAgo: 15, status: "APPROVED", consent: true, source: "qr" },
  { name: "Rahim Ahmed", phone: "+8801711000001", rating: 4, feedback: "Came back for lunch with colleagues. Still great food, slightly slow billing.", service: "Dining", daysAgo: 18, status: "REVIEWED", consent: true, source: "whatsapp" },
  { name: "Kamrul Islam", phone: "+8801711000011", rating: 5, feedback: "Excellent service from the moment we walked in. Highly recommended.", service: "Overall Experience", daysAgo: 22, status: "APPROVED", consent: true, source: "direct" },
  { name: "Shirin Akhter", email: "shirin.demo@example.com", rating: 4, feedback: "Tasty food and clean environment. Parking is a bit difficult.", service: "Overall Experience", daysAgo: 26, status: "REVIEWED", consent: false, source: "email" },
];

const HOTEL_REVIEWS: SeedReview[] = [
  { name: "Arif Chowdhury", phone: "+8801911000001", rating: 5, feedback: "Wonderful stay. The lake view from the room was breathtaking and breakfast was excellent.", service: "Room", daysAgo: 1, status: "NEW", consent: true, source: "qr", answers: { room: 5, service: 5 } },
  { name: "Lamia Haque", email: "lamia.demo@example.com", rating: 3, feedback: "Room was comfortable but the Wi-Fi kept disconnecting.", service: "Facilities", daysAgo: 4, status: "FOLLOW_UP", consent: false, source: "email", answers: { room: 4, service: 3 } },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });
  const reset = process.argv.includes("--reset");

  if (reset) {
    await db.delete(businesses).where(inArray(businesses.slug, [DEMO.restaurant.slug, DEMO.hotel.slug]));
    console.log("• Removed existing demo businesses");
  }

  async function ensureBusiness(def: typeof DEMO.restaurant | typeof DEMO.hotel, demoReviews: SeedReview[]) {
    const [existing] = await db.select().from(businesses).where(eq(businesses.slug, def.slug)).limit(1);
    if (existing) {
      console.log(`• ${def.name} already exists (${def.slug})`);
      return existing;
    }
    const [b] = await db.insert(businesses).values(def).returning();
    const customerIds = new Map<string, string>();
    for (const r of [...demoReviews].reverse()) {
      const created = new Date(Date.now() - r.daysAgo * 86_400_000 - Math.floor(Math.random() * 6) * 3_600_000);
      let customerId: string | null = null;
      if (r.name || r.phone || r.email) {
        const key = r.phone ?? r.email ?? r.name!;
        customerId = customerIds.get(key) ?? null;
        if (!customerId) {
          const [c] = await db
            .insert(customers)
            .values({
              businessId: b.id,
              name: r.name,
              phone: r.phone ?? null,
              email: r.email ?? null,
              status: r.rating <= 3 ? "FOLLOW_UP" : "ACTIVE",
              createdAt: created,
              updatedAt: created,
            })
            .returning({ id: customers.id });
          customerId = c.id;
          customerIds.set(key, customerId);
        }
      }
      const [rev] = await db
        .insert(reviews)
        .values({
          businessId: b.id,
          customerId,
          rating: r.rating,
          feedback: r.feedback,
          serviceType: r.service,
          answers: r.answers ?? null,
          consentToPublish: r.consent,
          source: r.source,
          status: r.status,
          createdAt: created,
          updatedAt: created,
        })
        .returning({ id: reviews.id });
      if (r.status === "FEATURED" && r.name === "Nusrat Jahan") {
        await db.insert(creativePosts).values({
          businessId: b.id,
          reviewId: rev.id,
          template: "quote-card",
          caption: `“${r.feedback}” — ${r.name} ⭐⭐⭐⭐⭐\n\nThank you for dining with us at ${b.name}!`,
          status: "DRAFT",
        });
      }
    }
    console.log(`✓ Created ${def.name} with ${demoReviews.length} demo reviews → /r/${def.slug}`);
    return b;
  }

  const restaurant = await ensureBusiness(DEMO.restaurant, RESTAURANT_REVIEWS);
  const hotel = await ensureBusiness(DEMO.hotel, HOTEL_REVIEWS);

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("! ADMIN_EMAIL / ADMIN_PASSWORD not set — skipped admin creation. Run `npm run admin:create` later.");
  } else {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
    let [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    if (!user) {
      [user] = await db
        .insert(adminUsers)
        .values({ email, name: process.env.ADMIN_NAME || "Owner", passwordHash: await hashPassword(password) })
        .returning();
      console.log(`✓ Created admin ${email}`);
    } else {
      console.log(`• Admin ${email} already exists (password unchanged)`);
    }
    for (const b of [restaurant, hotel]) {
      await db.insert(businessMembers).values({ userId: user.id, businessId: b.id, role: "OWNER" }).onConflictDoNothing();
    }
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

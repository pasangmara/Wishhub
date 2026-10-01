import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const businessTypeEnum = pgEnum("business_type", ["restaurant", "hotel", "cafe", "resort"]);
export const businessPlanEnum = pgEnum("business_plan", ["basic", "premium"]);
export const businessStatusEnum = pgEnum("business_status", ["active", "inactive"]);
export const memberRoleEnum = pgEnum("member_role", ["OWNER", "STAFF"]);
export const customerStatusEnum = pgEnum("customer_status", ["NEW", "ACTIVE", "FOLLOW_UP", "COMPLETED"]);
export const reviewStatusEnum = pgEnum("review_status", [
  "NEW",
  "REVIEWED",
  "APPROVED",
  "FEATURED",
  "REJECTED",
  "FOLLOW_UP",
]);
export const reviewSourceEnum = pgEnum("review_source", ["website", "whatsapp", "email", "qr", "direct"]);
export const creativeStatusEnum = pgEnum("creative_status", ["DRAFT", "APPROVED", "PUBLISHED"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export type BusinessSettings = {
  /** Show the 2 short follow-up questions (e.g. food / service) under the main rating. */
  showDetailQuestions?: boolean;
  /** Minimum rating that counts as positive and shows the Google Review CTA. */
  positiveThreshold?: number;
};

export type OpeningHours = string;

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: businessTypeEnum("type").notNull().default("restaurant"),
  plan: businessPlanEnum("plan").notNull().default("basic"),
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  primaryColor: text("primary_color").notNull().default("#14532d"),
  secondaryColor: text("secondary_color").notNull().default("#f97316"),
  headline: text("headline"),
  description: text("description"),
  websiteUrl: text("website_url"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  openingHours: text("opening_hours"),
  googleReviewUrl: text("google_review_url"),
  settings: jsonb("settings").$type<BusinessSettings>().notNull().default({}),
  status: businessStatusEnum("status").notNull().default("active"),
  ...timestamps,
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const businessMembers = pgTable(
  "business_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("OWNER"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("business_members_user_business_idx").on(t.userId, t.businessId)],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name"),
    phone: text("phone"),
    email: text("email"),
    status: customerStatusEnum("status").notNull().default("NEW"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("customers_business_phone_idx")
      .on(t.businessId, t.phone)
      .where(sql`${t.phone} is not null`),
    uniqueIndex("customers_business_email_idx")
      .on(t.businessId, t.email)
      .where(sql`${t.email} is not null`),
    index("customers_business_idx").on(t.businessId, t.createdAt),
  ],
);

export type ReviewAnswers = Record<string, number>;

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    feedback: text("feedback").notNull(),
    serviceType: text("service_type"),
    answers: jsonb("answers").$type<ReviewAnswers>(),
    /** Internal storage key of the optimized photo — never a public URL. */
    photoUrl: text("photo_url"),
    consentToPublish: boolean("consent_to_publish").notNull().default(false),
    source: reviewSourceEnum("source").notNull().default("direct"),
    status: reviewStatusEnum("status").notNull().default("NEW"),
    submissionId: text("submission_id").unique(),
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (t) => [
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
    index("reviews_business_created_idx").on(t.businessId, t.createdAt),
    index("reviews_business_status_idx").on(t.businessId, t.status),
    index("reviews_customer_idx").on(t.customerId),
    index("reviews_ip_hash_idx").on(t.businessId, t.ipHash, t.createdAt),
  ],
);

export const reviewMedia = pgTable(
  "review_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull().unique(),
    mime: text("mime").notNull(),
    width: integer("width"),
    height: integer("height"),
    bytes: integer("bytes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("review_media_review_idx").on(t.reviewId)],
);

export const creativePosts = pgTable(
  "creative_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "set null" }),
    template: text("template").notNull().default("quote-card"),
    imageUrl: text("image_url"),
    caption: text("caption"),
    status: creativeStatusEnum("status").notNull().default("DRAFT"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("creative_posts_business_idx").on(t.businessId, t.createdAt)],
);

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("n8n"),
    enabled: boolean("enabled").notNull().default(true),
    webhookUrl: text("webhook_url"),
    webhookSecret: text("webhook_secret"),
    apiKeyHash: text("api_key_hash").unique(),
    apiKeyPrefix: text("api_key_prefix"),
    ...timestamps,
  },
  (t) => [uniqueIndex("integrations_business_kind_idx").on(t.businessId, t.kind)],
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_logs_business_idx").on(t.businessId, t.createdAt)],
);

export type Business = typeof businesses.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type CreativePost = typeof creativePosts.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type ReviewStatus = (typeof reviewStatusEnum.enumValues)[number];
export type ReviewSource = (typeof reviewSourceEnum.enumValues)[number];
export type CustomerStatus = (typeof customerStatusEnum.enumValues)[number];
export type BusinessType = (typeof businessTypeEnum.enumValues)[number];
export type CreativeStatus = (typeof creativeStatusEnum.enumValues)[number];

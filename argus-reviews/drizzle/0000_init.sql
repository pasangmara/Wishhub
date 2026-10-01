CREATE TYPE "public"."business_plan" AS ENUM('basic', 'premium');--> statement-breakpoint
CREATE TYPE "public"."business_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('restaurant', 'hotel', 'cafe', 'resort');--> statement-breakpoint
CREATE TYPE "public"."creative_status" AS ENUM('DRAFT', 'APPROVED', 'PUBLISHED');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('NEW', 'ACTIVE', 'FOLLOW_UP', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('OWNER', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('website', 'whatsapp', 'email', 'qr', 'direct');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('NEW', 'REVIEWED', 'APPROVED', 'FEATURED', 'REJECTED', 'FOLLOW_UP');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"entity" text,
	"entity_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "business_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'OWNER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"type" "business_type" DEFAULT 'restaurant' NOT NULL,
	"plan" "business_plan" DEFAULT 'basic' NOT NULL,
	"logo_url" text,
	"cover_image_url" text,
	"primary_color" text DEFAULT '#14532d' NOT NULL,
	"secondary_color" text DEFAULT '#f97316' NOT NULL,
	"headline" text,
	"description" text,
	"website_url" text,
	"phone" text,
	"email" text,
	"address" text,
	"opening_hours" text,
	"google_review_url" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "business_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "creative_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"review_id" uuid,
	"template" text DEFAULT 'quote-card' NOT NULL,
	"image_url" text,
	"caption" text,
	"status" "creative_status" DEFAULT 'DRAFT' NOT NULL,
	"approved_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text,
	"phone" text,
	"email" text,
	"status" "customer_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"kind" text DEFAULT 'n8n' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"webhook_url" text,
	"webhook_secret" text,
	"api_key_hash" text,
	"api_key_prefix" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_api_key_hash_unique" UNIQUE("api_key_hash")
);
--> statement-breakpoint
CREATE TABLE "review_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"review_id" uuid,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_media_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid,
	"rating" integer NOT NULL,
	"feedback" text NOT NULL,
	"service_type" text,
	"answers" jsonb,
	"photo_url" text,
	"consent_to_publish" boolean DEFAULT false NOT NULL,
	"source" "review_source" DEFAULT 'direct' NOT NULL,
	"status" "review_status" DEFAULT 'NEW' NOT NULL,
	"submission_id" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_submission_id_unique" UNIQUE("submission_id"),
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_posts" ADD CONSTRAINT "creative_posts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_posts" ADD CONSTRAINT "creative_posts_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_media" ADD CONSTRAINT "review_media_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_media" ADD CONSTRAINT "review_media_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_business_idx" ON "activity_logs" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "business_members_user_business_idx" ON "business_members" USING btree ("user_id","business_id");--> statement-breakpoint
CREATE INDEX "creative_posts_business_idx" ON "creative_posts" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_business_phone_idx" ON "customers" USING btree ("business_id","phone") WHERE "customers"."phone" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_business_email_idx" ON "customers" USING btree ("business_id","email") WHERE "customers"."email" is not null;--> statement-breakpoint
CREATE INDEX "customers_business_idx" ON "customers" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_business_kind_idx" ON "integrations" USING btree ("business_id","kind");--> statement-breakpoint
CREATE INDEX "review_media_review_idx" ON "review_media" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "reviews_business_created_idx" ON "reviews" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "reviews_business_status_idx" ON "reviews" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "reviews_customer_idx" ON "reviews" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "reviews_ip_hash_idx" ON "reviews" USING btree ("business_id","ip_hash","created_at");
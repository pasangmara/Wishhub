import { z } from "zod";
import { normalizeEmail, normalizePhone } from "./contact";

export const REVIEW_SOURCES = ["website", "whatsapp", "email", "qr", "direct"] as const;
export const REVIEW_STATUSES = ["NEW", "REVIEWED", "APPROVED", "FEATURED", "REJECTED", "FOLLOW_UP"] as const;
export const CUSTOMER_STATUSES = ["NEW", "ACTIVE", "FOLLOW_UP", "COMPLETED"] as const;

export const FEEDBACK_MIN = 2;
export const FEEDBACK_MAX = 2000;

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const publicReviewSchema = z.object({
  business_slug: z.string().trim().min(1).max(80),
  rating: z
    .number({ error: "Please choose a star rating." })
    .int("Please choose a rating from 1 to 5.")
    .min(1, "Please choose a rating from 1 to 5.")
    .max(5, "Please choose a rating from 1 to 5."),
  feedback: z.string().trim().min(FEEDBACK_MIN, "Please tell us a little about your experience.").max(FEEDBACK_MAX),
  name: optionalTrimmed(120),
  phone: optionalTrimmed(40).transform((v) => normalizePhone(v)),
  email: optionalTrimmed(200).transform((v) => normalizeEmail(v)),
  service_type: optionalTrimmed(60),
  answers: z.record(z.string().max(30), z.number().int().min(1).max(5)).nullish(),
  photo_token: optionalTrimmed(1000),
  photo_url: z.null().optional(),
  consent_to_publish: z.boolean().default(false),
  source: z
    .string()
    .nullish()
    .transform((v) => ((REVIEW_SOURCES as readonly string[]).includes(v ?? "") ? (v as (typeof REVIEW_SOURCES)[number]) : "direct")),
  submission_id: z.string().trim().min(8).max(100).nullish(),
  /** Honeypot — real users never fill this. */
  website: z.string().max(200).nullish(),
});

export type PublicReviewInput = z.infer<typeof publicReviewSchema>;

export function normalizeSource(v: string | null | undefined): (typeof REVIEW_SOURCES)[number] {
  return (REVIEW_SOURCES as readonly string[]).includes(v ?? "") ? (v as (typeof REVIEW_SOURCES)[number]) : "direct";
}

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #14532d");

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v) || v.startsWith("/api/assets/"), "Enter a full URL starting with https://");

export const brandingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  headline: optionalTrimmed(140),
  description: optionalTrimmed(300),
  primaryColor: hex,
  secondaryColor: hex,
  logoUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  googleReviewUrl: optionalUrl,
});

export const businessInfoSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["restaurant", "hotel", "cafe", "resort"]),
  phone: optionalTrimmed(40),
  email: optionalTrimmed(200),
  websiteUrl: optionalUrl,
  address: optionalTrimmed(300),
  openingHours: optionalTrimmed(300),
});

export const reviewSettingsSchema = z.object({
  showDetailQuestions: z.boolean(),
  googleReviewUrl: optionalUrl,
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes")
  .min(3)
  .max(60);

export function firstError(err: z.ZodError): string {
  const issue = err.issues[0];
  return issue?.message ?? "Invalid input";
}

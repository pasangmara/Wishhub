/**
 * One review system, configured per business type.
 * Adding a new vertical = adding one entry here (no new code paths).
 */
export type BusinessTypeKey = "restaurant" | "hotel" | "cafe" | "resort";

export type DetailQuestion = { key: string; label: string };

export type BusinessTypeConfig = {
  label: string;
  headline: string;
  description: string;
  feedbackPrompt: string;
  feedbackPlaceholder: string;
  serviceLabel: string;
  serviceOptions: string[];
  /** Max two short follow-up questions; the main star rating is always the overall experience. */
  detailQuestions: DetailQuestion[];
  visitNoun: string;
};

export const BUSINESS_TYPES: Record<BusinessTypeKey, BusinessTypeConfig> = {
  restaurant: {
    label: "Restaurant",
    headline: "How was your dining experience?",
    description: "Your feedback helps us make every visit better.",
    feedbackPrompt: "Tell us about your experience",
    feedbackPlaceholder: "What did you enjoy? What could we do better?",
    serviceLabel: "What would you like to tell us about?",
    serviceOptions: ["Dining", "Food Quality", "Service", "Ambience", "Staff", "Overall Experience"],
    detailQuestions: [
      { key: "food", label: "How was your food?" },
      { key: "service", label: "How was the service?" },
    ],
    visitNoun: "visit",
  },
  cafe: {
    label: "Cafe",
    headline: "How was your visit?",
    description: "Your feedback helps us brew a better experience.",
    feedbackPrompt: "Tell us about your visit",
    feedbackPlaceholder: "Coffee, food, vibe — what stood out?",
    serviceLabel: "What would you like to tell us about?",
    serviceOptions: ["Coffee & Drinks", "Food", "Service", "Ambience", "Staff", "Overall Experience"],
    detailQuestions: [
      { key: "food", label: "How were the food & drinks?" },
      { key: "service", label: "How was the service?" },
    ],
    visitNoun: "visit",
  },
  hotel: {
    label: "Hotel",
    headline: "How was your stay?",
    description: "Your feedback helps us make every stay better.",
    feedbackPrompt: "Tell us about your stay",
    feedbackPlaceholder: "What made your stay special? What could we improve?",
    serviceLabel: "What would you like to tell us about?",
    serviceOptions: ["Room", "Restaurant", "Breakfast", "Housekeeping", "Staff", "Facilities", "Overall Stay"],
    detailQuestions: [
      { key: "room", label: "How was the room?" },
      { key: "service", label: "How was the service?" },
    ],
    visitNoun: "stay",
  },
  resort: {
    label: "Resort",
    headline: "How was your stay?",
    description: "Your feedback helps us make every getaway better.",
    feedbackPrompt: "Tell us about your stay",
    feedbackPlaceholder: "What made your stay special? What could we improve?",
    serviceLabel: "What would you like to tell us about?",
    serviceOptions: ["Room", "Dining", "Pool & Spa", "Activities", "Staff", "Facilities", "Overall Stay"],
    detailQuestions: [
      { key: "room", label: "How was the room?" },
      { key: "service", label: "How was the service?" },
    ],
    visitNoun: "stay",
  },
};

export const BUSINESS_TYPE_KEYS = Object.keys(BUSINESS_TYPES) as BusinessTypeKey[];

export function getTypeConfig(type: string | null | undefined): BusinessTypeConfig {
  return BUSINESS_TYPES[(type as BusinessTypeKey) ?? "restaurant"] ?? BUSINESS_TYPES.restaurant;
}

export const RATING_LABELS: Record<number, string> = {
  5: "Excellent",
  4: "Great",
  3: "Good",
  2: "Could be better",
  1: "Needs improvement",
};

export const DEFAULT_POSITIVE_THRESHOLD = 4;

export function isPositiveRating(rating: number, threshold = DEFAULT_POSITIVE_THRESHOLD) {
  return rating >= threshold;
}

/** Google CTA only for positive ratings AND only when the business configured a URL. */
export function shouldShowGoogleReview(
  rating: number,
  googleReviewUrl: string | null | undefined,
  threshold = DEFAULT_POSITIVE_THRESHOLD,
) {
  return isPositiveRating(rating, threshold) && Boolean(googleReviewUrl);
}

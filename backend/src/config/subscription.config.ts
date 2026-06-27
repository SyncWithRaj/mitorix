/**
 * Subscription-Based Access Control (SBAC) — Configuration
 *
 * Single source of truth for subscription tiers, feature access,
 * rate limits, and repository limits. All SBAC middlewares and
 * controllers reference this file — no magic strings elsewhere.
 */

// ── Tier Definitions ──

export type SubscriptionTier = "FREE" | "BASIC" | "PRO";

export const SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = ["FREE", "BASIC", "PRO"] as const;

/** Tier hierarchy for comparison (higher = more powerful) */
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
};

// ── Feature Keys ──

export type FeatureKey =
  | "repo:clone"
  | "repo:upload-local"
  | "repo:embed"
  | "repo:design-doc"
  | "repo:onboarding"
  | "codeflow:analyze"
  | "codeflow:health"
  | "codeflow:security"
  | "codeflow:patterns"
  | "codeflow:blast"
  | "codeflow:suggestions"
  | "codeflow:pr"
  | "chat:ask"
  | "chat:voice"
  | "search:semantic"
  | "clones:detect"
  | "drift:detect"
  | "export:data"
  | "unused:functions";

// ── Feature Access Matrix ──

const FREE_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  "repo:clone",
  "repo:embed",
  "codeflow:analyze",
  "codeflow:health",
  "codeflow:security",
  "codeflow:patterns",
  "chat:ask",
  "search:semantic",
  "unused:functions",
]);

const BASIC_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  // Inherits all FREE features
  ...FREE_FEATURES,
  // Basic-tier additions
  "repo:upload-local",
  "codeflow:blast",
  "codeflow:suggestions",
  "export:data",
]);

const PRO_FEATURES: ReadonlySet<FeatureKey> = new Set<FeatureKey>([
  // Inherits all BASIC features
  ...BASIC_FEATURES,
  // Pro-tier additions
  "repo:design-doc",
  "repo:onboarding",
  "codeflow:pr",
  "chat:voice",
  "clones:detect",
  "drift:detect",
]);

export const FEATURE_ACCESS: Record<SubscriptionTier, ReadonlySet<FeatureKey>> = {
  FREE: FREE_FEATURES,
  BASIC: BASIC_FEATURES,
  PRO: PRO_FEATURES,
};

// ── Rate Limits (daily per-user) ──

export interface TierRateLimits {
  /** Max AI chat queries per day. -1 = unlimited */
  chatPerDay: number;
  /** Max semantic search queries per day. -1 = unlimited */
  searchPerDay: number;
}

export const TIER_RATE_LIMITS: Record<SubscriptionTier, TierRateLimits> = {
  FREE: { chatPerDay: 5, searchPerDay: 10 },
  BASIC: { chatPerDay: 50, searchPerDay: -1 },
  PRO: { chatPerDay: -1, searchPerDay: -1 },
};

// ── Repository Limits ──

/** Max number of repos a user can create. -1 = unlimited */
export const TIER_REPO_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 1,
  BASIC: 5,
  PRO: -1,
};

// ── Plan Pricing (in paise for Razorpay) ──

export interface PlanInfo {
  tier: SubscriptionTier;
  name: string;
  priceInPaise: number;
  priceDisplay: string;
  currency: string;
  durationDays: number;
  features: string[];
}

export const PLAN_DETAILS: Record<Exclude<SubscriptionTier, "FREE">, PlanInfo> = {
  BASIC: {
    tier: "BASIC",
    name: "Basic Plan",
    priceInPaise: 9900, // ₹99
    priceDisplay: "₹99/month",
    currency: "INR",
    durationDays: 30,
    features: [
      "Up to 5 repositories",
      "Local folder/ZIP upload",
      "Qdrant vector embeddings",
      "All 8 visualizations",
      "50 AI chat queries/day",
      "Unlimited semantic search",
      "Blast radius & impact analysis",
      "Suggestions & action items",
      "Export analysis data",
    ],
  },
  PRO: {
    tier: "PRO",
    name: "Professional Plan",
    priceInPaise: 29900, // ₹299
    priceDisplay: "₹299/month",
    currency: "INR",
    durationDays: 30,
    features: [
      "Unlimited repositories",
      "Everything in Basic",
      "Unlimited AI chat queries",
      "Voice call mode (STT + TTS)",
      "System design doc generation",
      "Onboarding guide generation",
      "PR risk analysis",
      "Semantic clone detection",
      "Codebase drift detection",
      "Cross-repo comparison",
    ],
  },
};

// ── Helpers ──

/**
 * Given a feature key, returns the minimum tier required to access it.
 */
export function getMinimumTierForFeature(feature: FeatureKey): SubscriptionTier {
  if (FREE_FEATURES.has(feature)) return "FREE";
  if (BASIC_FEATURES.has(feature)) return "BASIC";
  return "PRO";
}

/**
 * Checks if a given tier has access to a feature.
 */
export function tierHasFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
  return FEATURE_ACCESS[tier].has(feature);
}

/**
 * Returns all features accessible for a given tier.
 */
export function getFeaturesForTier(tier: SubscriptionTier): FeatureKey[] {
  return [...FEATURE_ACCESS[tier]];
}

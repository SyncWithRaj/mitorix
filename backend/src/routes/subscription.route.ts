/**
 * Subscription Status & Plans Routes
 *
 * Provides endpoints for checking current subscription status
 * and listing available plans with features.
 */

import { Router, type Request, type Response } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { getEffectiveTier } from "../middlewares/subscription.middleware.js";
import {
  PLAN_DETAILS,
  TIER_RATE_LIMITS,
  TIER_REPO_LIMITS,
  getFeaturesForTier,
} from "../config/subscription.config.js";

const router = Router();

// ── GET /api/v1/subscription ──
// Returns the current user's subscription status and feature access.

router.get("/", protect, (req: Request, res: Response) => {
  const user = req.user as Express.IUser;
  if (!user) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
  }

  const effectiveTier = getEffectiveTier(user);
  const isExpired = effectiveTier !== (user.subscriptionTier || "FREE");

  const daysRemaining =
    user.subscriptionExpiresAt && !isExpired
      ? Math.max(
          0,
          Math.ceil(
            (new Date(user.subscriptionExpiresAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null;

  res.json({
    success: true,
    subscription: {
      tier: effectiveTier,
      storedTier: user.subscriptionTier || "FREE",
      isExpired,
      expiresAt: user.subscriptionExpiresAt || null,
      daysRemaining,
      features: getFeaturesForTier(effectiveTier),
      limits: {
        repos: TIER_REPO_LIMITS[effectiveTier],
        chatPerDay: TIER_RATE_LIMITS[effectiveTier].chatPerDay,
        searchPerDay: TIER_RATE_LIMITS[effectiveTier].searchPerDay,
      },
    },
  });
});

// ── GET /api/v1/subscription/plans ──
// Lists all available subscription plans with pricing and features.
// Does NOT require authentication — public endpoint for pricing page.

router.get("/plans", (_req: Request, res: Response) => {
  const plans = [
    {
      tier: "FREE",
      name: "Free Plan",
      priceDisplay: "₹0/month",
      features: [
        "1 repository",
        "GitHub clone & index",
        "Qdrant vector embeddings",
        "CodeFlow analysis (health, stats)",
        "Security & pattern detection",
        "2 visualizations (Force + Visual)",
        "5 AI chat queries/day",
        "10 semantic searches/day",
      ],
    },
    {
      ...PLAN_DETAILS.BASIC,
      priceInPaise: undefined, // Don't expose internal pricing
    },
    {
      ...PLAN_DETAILS.PRO,
      priceInPaise: undefined,
    },
  ];

  res.json({
    success: true,
    plans,
  });
});

export default router;

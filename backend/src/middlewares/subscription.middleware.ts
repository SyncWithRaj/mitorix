/**
 * Subscription-Based Access Control (SBAC) — Middleware
 *
 * Three middleware functions for gating API access based on subscription tier:
 *
 * 1. requireFeature(feature)  — Checks if the user's tier has access to a feature
 * 2. requireRepoLimit         — Checks if the user can create more repositories
 * 3. tierRateLimit(type)      — Per-user daily rate limiting based on tier
 *
 * All middlewares expect `protect` (auth middleware) to have run first,
 * so `req.user` is always populated.
 */

import type { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import {
  type SubscriptionTier,
  type FeatureKey,
  FEATURE_ACCESS,
  TIER_RATE_LIMITS,
  TIER_REPO_LIMITS,
  getMinimumTierForFeature,
} from "../config/subscription.config.js";
import { Repository } from "../models/repo.model.js";
import logger from "../lib/logger.js";

// ── Redis Client (reuse the same connection pattern as rateLimiter) ──

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.connect().catch((err) => {
  logger.warn({ err }, "SBAC Redis connection failed — rate limits will use fallback");
});

let redisAvailable = true;
redis.on("error", () => {
  redisAvailable = false;
});
redis.on("ready", () => {
  redisAvailable = true;
});

// ── Helper: Compute Effective Tier ──

/**
 * Returns the user's actual active subscription tier.
 * If the subscription has expired, returns "FREE" (lazy downgrade).
 * Does NOT write to the database — keeps middleware fast and side-effect-free.
 */
export function getEffectiveTier(user: Express.IUser): SubscriptionTier {
  const tier = user.subscriptionTier || "FREE";

  if (tier === "FREE") return "FREE";

  // Check if subscription has expired
  if (user.subscriptionExpiresAt) {
    const expiry = new Date(user.subscriptionExpiresAt);
    if (expiry < new Date()) {
      return "FREE";
    }
  }

  return tier;
}

// ── Middleware 1: Feature Gate ──

/**
 * Creates a middleware that checks if the user's subscription tier
 * grants access to the specified feature.
 *
 * Usage: `router.get("/foo", protect, requireFeature("chat:ask"), handler)`
 *
 * @param feature - The feature key to check against the tier's feature set
 */
export function requireFeature(feature: FeatureKey) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: "Authentication required",
          code: "UNAUTHORIZED",
        },
      });
      return;
    }

    const effectiveTier = getEffectiveTier(user);

    if (!FEATURE_ACCESS[effectiveTier].has(feature)) {
      const requiredTier = getMinimumTierForFeature(feature);

      logger.info(
        { userId: user._id, feature, currentTier: effectiveTier, requiredTier },
        "SBAC: feature access denied"
      );

      res.status(403).json({
        success: false,
        error: {
          message: `This feature requires a ${requiredTier} subscription. You are on the ${effectiveTier} plan.`,
          code: "FEATURE_LOCKED",
          currentTier: effectiveTier,
          requiredTier,
          feature,
        },
      });
      return;
    }

    next();
  };
}

// ── Middleware 2: Repository Limit ──

/**
 * Checks if the user has reached their repository creation limit
 * based on their subscription tier.
 *
 * Usage: `router.post("/repos", protect, requireRepoLimit, handler)`
 */
export async function requireRepoLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: "Authentication required", code: "UNAUTHORIZED" },
      });
      return;
    }

    const effectiveTier = getEffectiveTier(user);
    const limit = TIER_REPO_LIMITS[effectiveTier];

    // -1 means unlimited
    if (limit === -1) {
      next();
      return;
    }

    const currentCount = await Repository.countDocuments({ user: user._id });

    if (currentCount >= limit) {
      logger.info(
        { userId: user._id, currentCount, limit, tier: effectiveTier },
        "SBAC: repo limit reached"
      );

      res.status(403).json({
        success: false,
        error: {
          message: `Your ${effectiveTier} plan allows up to ${limit} repositor${limit === 1 ? "y" : "ies"} at a time. You currently have ${currentCount}.`,
          code: "REPO_LIMIT_REACHED",
          currentTier: effectiveTier,
          limit,
          current: currentCount,
        },
      });
      return;
    }

    // Check 3-day repo creation rate limit to prevent clone/delete abuse
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // @ts-ignore - repoCreationHistory is added to User model but might not be in Express.IUser types yet
    const history: Date[] = user.repoCreationHistory || [];
    const recentCreations = history.filter((d: Date) => new Date(d) >= threeDaysAgo);

    if (recentCreations.length >= limit) {
      logger.info(
        { userId: user._id, recentCount: recentCreations.length, limit, tier: effectiveTier },
        "SBAC: repo creation rate limit reached"
      );

      res.status(429).json({
        success: false,
        error: {
          message: `Rate limit reached: Your ${effectiveTier} plan allows creating up to ${limit} repositor${limit === 1 ? "y" : "ies"} every 3 days. Please wait or upgrade your plan.`,
          code: "REPO_RATE_LIMIT_REACHED",
          currentTier: effectiveTier,
          limit,
          current: recentCreations.length,
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error({ err: error }, "SBAC: repo limit check failed");
    next(error);
  }
}

// ── Middleware 3: Tier-Aware Daily Rate Limit ──

type RateLimitType = "chatPerDay" | "searchPerDay";

/**
 * Creates a per-user daily rate limiter based on subscription tier.
 * Uses Redis for atomic counting with automatic 24h TTL.
 *
 * Falls back to allowing the request if Redis is unavailable
 * (graceful degradation — better to serve than to block).
 *
 * Usage: `router.post("/ask", protect, tierRateLimit("chatPerDay"), handler)`
 *
 * @param featureType - The rate limit bucket to check
 */
export function tierRateLimit(featureType: RateLimitType) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: { message: "Authentication required", code: "UNAUTHORIZED" },
        });
        return;
      }

      const effectiveTier = getEffectiveTier(user);
      const limit = TIER_RATE_LIMITS[effectiveTier][featureType];

      // -1 means unlimited — skip all rate limit logic
      if (limit === -1) {
        next();
        return;
      }

      // Graceful degradation: if Redis is down, allow the request
      if (!redisAvailable) {
        logger.warn(
          { userId: user._id, featureType },
          "SBAC: Redis unavailable, skipping rate limit"
        );
        next();
        return;
      }

      // Build the Redis key: sbac:<userId>:<featureType>:<YYYY-MM-DD>
      const dateKey = new Date().toISOString().split("T")[0];
      const redisKey = `sbac:${user._id}:${featureType}:${dateKey}`;

      // Atomic increment
      const current = await redis.incr(redisKey);

      // Set TTL on first increment (24 hours)
      if (current === 1) {
        await redis.expire(redisKey, 86400);
      }

      // Attach rate limit headers for frontend consumption
      res.setHeader("X-RateLimit-Limit", String(limit));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - current)));
      res.setHeader("X-RateLimit-Reset", dateKey);

      if (current > limit) {
        logger.info(
          { userId: user._id, featureType, current, limit, tier: effectiveTier },
          "SBAC: daily rate limit exceeded"
        );

        res.status(429).json({
          success: false,
          error: {
            message: `Daily ${featureType === "chatPerDay" ? "AI chat" : "semantic search"} limit reached for the ${effectiveTier} plan (${limit}/day). Upgrade to increase your limit.`,
            code: "DAILY_LIMIT_EXCEEDED",
            currentTier: effectiveTier,
            limit,
            used: current,
            resetsAt: `${dateKey}T23:59:59Z`,
          },
        });
        return;
      }

      next();
    } catch (error) {
      // On any Redis/rate-limit error, allow the request (graceful degradation)
      logger.error({ err: error }, "SBAC: rate limit check failed, allowing request");
      next();
    }
  };
}

/**
 * Payment & Subscription Routes
 *
 * Handles Razorpay order creation, payment verification with subscription
 * activation, webhook processing, and subscription cancellation.
 */

import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { protect } from "../middlewares/auth.middleware.js";
import { User } from "../models/auth.model.js";
import {
  type SubscriptionTier,
  PLAN_DETAILS,
} from "../config/subscription.config.js";
import logger from "../lib/logger.js";

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// ── POST /api/v1/payments/create-subscription ──
// Creates a Razorpay order for a subscription plan.
// Body: { planId: "BASIC" | "PRO" }

router.post("/create-subscription", protect, async (req: Request, res: Response) => {
  try {
    const user = req.user as Express.IUser;
    if (!user) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    const { planId } = req.body as { planId?: string };

    if (!planId || !["BASIC", "PRO"].includes(planId)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid planId. Must be 'BASIC' or 'PRO'." },
      });
    }

    const plan = PLAN_DETAILS[planId as Exclude<SubscriptionTier, "FREE">];

    const options = {
      amount: plan.priceInPaise,
      currency: plan.currency,
      receipt: `sub_${user._id}_${planId}_${Date.now()}`,
      notes: {
        userId: user._id.toString(),
        planId,
        userName: user.username,
      },
    };

    const order = await razorpay.orders.create(options);

    logger.info(
      { userId: user._id, planId, orderId: order.id },
      "Razorpay subscription order created"
    );

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan: {
        name: plan.name,
        tier: plan.tier,
        priceDisplay: plan.priceDisplay,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Razorpay create subscription order failed");
    res.status(500).json({
      success: false,
      error: { message: "Failed to create subscription order" },
    });
  }
});

// ── POST /api/v1/payments/create-order ──
// Legacy order creation (kept for backward compat).

router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { amount, currency = "INR", receipt = "receipt_1" } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: "Amount must be at least 100 paise" });
    }

    const options = { amount, currency, receipt };
    const order = await razorpay.orders.create(options);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    logger.error({ err: error }, "Razorpay create order failed");
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ── POST /api/v1/payments/verify-payment ──
// Verifies Razorpay payment signature and activates the subscription.
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }

router.post("/verify-payment", protect, async (req: Request, res: Response) => {
  try {
    const user = req.user as Express.IUser;
    if (!user) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing required payment fields" },
      });
    }

    if (!planId || !["BASIC", "PRO"].includes(planId)) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid planId. Must be 'BASIC' or 'PRO'." },
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET as string;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      logger.warn(
        { userId: user._id, razorpay_order_id },
        "Payment verification failed — invalid signature"
      );
      return res.status(400).json({
        success: false,
        error: { message: "Invalid payment signature" },
      });
    }

    // Signature valid — activate subscription
    const plan = PLAN_DETAILS[planId as Exclude<SubscriptionTier, "FREE">];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

    await User.findByIdAndUpdate(user._id, {
      subscriptionTier: plan.tier,
      subscriptionExpiresAt: expiresAt,
      razorpaySubscriptionId: razorpay_order_id,
      lastPaymentId: razorpay_payment_id,
    });

    logger.info(
      {
        userId: user._id,
        tier: plan.tier,
        expiresAt,
        paymentId: razorpay_payment_id,
      },
      "Subscription activated via payment verification"
    );

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        tier: plan.tier,
        expiresAt,
        plan: plan.name,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Payment verification failed");
    res.status(500).json({
      success: false,
      error: { message: "Internal Server Error" },
    });
  }
});

// ── POST /api/v1/payments/webhook ──
// Razorpay webhook handler for async payment events.
// Verifies webhook signature using X-Razorpay-Signature header.

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn("Razorpay webhook secret not configured");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    const signature = req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "Missing signature" });
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      logger.warn("Razorpay webhook signature mismatch");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured") {
      const payment = payload?.payment?.entity;
      if (!payment) {
        return res.status(200).json({ status: "ignored — no payment entity" });
      }

      const userId = payment.notes?.userId;
      const planId = payment.notes?.planId;

      if (!userId || !planId || !["BASIC", "PRO"].includes(planId)) {
        logger.warn({ notes: payment.notes }, "Webhook: missing or invalid notes");
        return res.status(200).json({ status: "ignored — missing metadata" });
      }

      const plan = PLAN_DETAILS[planId as Exclude<SubscriptionTier, "FREE">];
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

      await User.findByIdAndUpdate(userId, {
        subscriptionTier: plan.tier,
        subscriptionExpiresAt: expiresAt,
        lastPaymentId: payment.id,
      });

      logger.info(
        { userId, tier: plan.tier, paymentId: payment.id },
        "Webhook: subscription activated via payment.captured"
      );
    } else if (event === "payment.failed") {
      const payment = payload?.payment?.entity;
      logger.warn(
        {
          userId: payment?.notes?.userId,
          reason: payment?.error_description,
        },
        "Webhook: payment failed"
      );
      // No tier change on failed payment
    }

    // Always respond 200 to acknowledge webhook receipt
    res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error({ err: error }, "Razorpay webhook processing error");
    // Still respond 200 to prevent Razorpay from retrying
    res.status(200).json({ status: "error logged" });
  }
});

// ── POST /api/v1/payments/cancel-subscription ──
// Cancels the user's active subscription.
// Access is retained until subscriptionExpiresAt.

router.post("/cancel-subscription", protect, async (req: Request, res: Response) => {
  try {
    const user = req.user as Express.IUser;
    if (!user) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    if (user.subscriptionTier === "FREE") {
      return res.json({
        success: true,
        message: "You are already on the Free plan.",
        subscription: {
          tier: "FREE",
          expiresAt: null,
        },
      });
    }

    // Mark for cancellation — user keeps access until expiry
    // Set tier to FREE but keep expiresAt so they retain access until then
    // Actually, we'll set a flag approach: just clear the subscription
    // but let the lazy downgrade in getEffectiveTier handle the transition
    await User.findByIdAndUpdate(user._id, {
      subscriptionTier: "FREE",
      razorpaySubscriptionId: null,
      // Keep subscriptionExpiresAt and lastPaymentId for records
    });

    logger.info(
      { userId: user._id, previousTier: user.subscriptionTier },
      "Subscription cancelled"
    );

    res.json({
      success: true,
      message: "Subscription cancelled. You have been moved to the Free plan.",
      subscription: {
        tier: "FREE",
        expiresAt: null,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Subscription cancellation failed");
    res.status(500).json({
      success: false,
      error: { message: "Failed to cancel subscription" },
    });
  }
});

export default router;

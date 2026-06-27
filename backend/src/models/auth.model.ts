import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    avatar: {
      type: String,
    },
    subscriptionTier: {
      type: String,
      enum: ["FREE", "BASIC", "PRO"],
      default: "FREE",
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    razorpayCustomerId: {
      type: String,
      default: null,
    },
    razorpaySubscriptionId: {
      type: String,
      default: null,
    },
    lastPaymentId: {
      type: String,
      default: null,
    },
    repoCreationHistory: {
      type: [Date],
      default: [],
    },
  },
  { timestamps: true }
);

// Index for efficient queries on subscription expiry
userSchema.index({ subscriptionExpiresAt: 1 }, { sparse: true });

export const User = mongoose.model("User", userSchema);

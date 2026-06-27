"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "@/lib/axios";

// ── Types ──

export type SubscriptionTier = "FREE" | "BASIC" | "PRO";

export interface SubscriptionLimits {
  repos: number;
  chatPerDay: number;
  searchPerDay: number;
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isExpired: boolean;
  expiresAt: string | null;
  features: string[];
  limits: SubscriptionLimits;
}

interface SubscriptionContextType {
  subscription: SubscriptionInfo | null;
  loading: boolean;
  /** Refresh subscription data from the server */
  refresh: () => Promise<void>;
  /** Check if a feature is accessible under the current subscription */
  hasFeature: (feature: string) => boolean;
  /** Get the current effective tier */
  tier: SubscriptionTier;
}

const defaultSubscription: SubscriptionInfo = {
  tier: "FREE",
  isExpired: false,
  expiresAt: null,
  features: [],
  limits: { repos: 1, chatPerDay: 5, searchPerDay: 10 },
};

// ── Context ──

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  refresh: async () => {},
  hasFeature: () => false,
  tier: "FREE",
});

// ── Provider ──

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data.success && res.data.subscription) {
        setSubscription(res.data.subscription);
      } else {
        setSubscription(defaultSubscription);
      }
    } catch {
      // Not logged in or error — use defaults
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const hasFeature = useCallback(
    (feature: string): boolean => {
      if (!subscription) return false;
      return subscription.features.includes(feature);
    },
    [subscription]
  );

  const tier = subscription?.tier || "FREE";

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        refresh: fetchSubscription,
        hasFeature,
        tier,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ── Hook ──

export function useSubscription() {
  return useContext(SubscriptionContext);
}

import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// ── SBAC Error Interceptor ──
// Globally catches subscription-related errors and shows user-friendly toasts.
// Specific error codes from the SBAC middleware:
//   - FEATURE_LOCKED (403)        → Feature requires a higher tier
//   - REPO_LIMIT_REACHED (403)    → Repo count limit hit
//   - DAILY_LIMIT_EXCEEDED (429)  → Daily rate limit exhausted

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    const errorCode = data?.error?.code;

    if (errorCode === "FEATURE_LOCKED") {
      const { requiredTier, feature } = data.error;
      toast.error(
        `🔒 This feature requires the ${requiredTier} plan. Upgrade to unlock it.`,
        { duration: 5000, id: `sbac-feature-${feature}` }
      );
    } else if (errorCode === "REPO_LIMIT_REACHED") {
      const { limit } = data.error;
      toast.error(
        `📦 Repository limit reached (${limit}). Upgrade your plan to add more.`,
        { duration: 5000, id: "sbac-repo-limit" }
      );
    } else if (errorCode === "DAILY_LIMIT_EXCEEDED") {
      const { limit } = data.error;
      toast.error(
        `⏱️ Daily usage limit reached (${limit}/day). Resets at midnight or upgrade for more.`,
        { duration: 5000, id: "sbac-rate-limit" }
      );
    }

    return Promise.reject(error);
  }
);

export default api;

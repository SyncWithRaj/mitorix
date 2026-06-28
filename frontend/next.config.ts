import type { NextConfig } from "next";

import dotenv from "dotenv";
import path from "path";

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    // Explicitly expose this to the browser since it's loaded from a custom path
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  },
  async rewrites() {
    // If EC2_PROXY_TARGET is set (e.g., in Vercel), proxy API requests to bypass CORS/SSL
    if (process.env.EC2_PROXY_TARGET) {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${process.env.EC2_PROXY_TARGET}/api/v1/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;

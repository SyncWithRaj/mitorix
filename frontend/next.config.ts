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
  /* config options here */
};

export default nextConfig;

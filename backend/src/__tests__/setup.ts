/**
 * Global test setup file.
 * Loads environment variables from .env before any tests run.
 */
import dotenv from "dotenv";
import { beforeAll } from "vitest";

beforeAll(() => {
  dotenv.config({ path: "../.env" });
  // Override with test-specific values
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-for-vitest";
  process.env.MONGO_URI = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/RepoLens_test";
});

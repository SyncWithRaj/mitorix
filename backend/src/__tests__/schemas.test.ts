/**
 * Unit tests for Zod validation schemas.
 * Ensures the schemas correctly accept valid data and reject invalid inputs.
 */
import { describe, it, expect } from "vitest";
import { addRepositorySchema, processRepoSchema } from "../schemas/repo.schema.js";
import { querySchema } from "../schemas/query.schema.js";
import { processCallSchema } from "../schemas/call.schema.js";

describe("addRepositorySchema", () => {
  it("should accept a valid GitHub URL", () => {
    const result = addRepositorySchema.safeParse({
      githubUrl: "https://github.com/owner/repo",
    });
    expect(result.success).toBe(true);
  });

  it("should reject a missing githubUrl", () => {
    const result = addRepositorySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject a non-GitHub URL", () => {
    const result = addRepositorySchema.safeParse({
      githubUrl: "https://gitlab.com/owner/repo",
    });
    expect(result.success).toBe(false);
  });

  it("should reject a malformed URL", () => {
    const result = addRepositorySchema.safeParse({ githubUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("querySchema", () => {
  it("should accept valid repoId and question", () => {
    const result = querySchema.safeParse({ repoId: "abc123", question: "What does this do?" });
    expect(result.success).toBe(true);
  });

  it("should reject an empty question", () => {
    const result = querySchema.safeParse({ repoId: "abc123", question: "" });
    expect(result.success).toBe(false);
  });

  it("should reject a question over 2000 characters", () => {
    const result = querySchema.safeParse({ repoId: "abc123", question: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("should reject missing repoId", () => {
    const result = querySchema.safeParse({ question: "What does this do?" });
    expect(result.success).toBe(false);
  });
});

describe("processCallSchema", () => {
  it("should accept valid repoId and audioBase64", () => {
    const result = processCallSchema.safeParse({ repoId: "abc123", audioBase64: "dGVzdA==" });
    expect(result.success).toBe(true);
  });

  it("should reject missing audioBase64", () => {
    const result = processCallSchema.safeParse({ repoId: "abc123" });
    expect(result.success).toBe(false);
  });
});

import { analyzeRepositorySchema, getPRAnalysisSchema } from "../schemas/codeflow.schema.js";

describe("analyzeRepositorySchema", () => {
  it("should accept a valid body with repoId", () => {
    const result = analyzeRepositorySchema.safeParse({
      body: { repoId: "repo123" },
      query: {},
    });
    expect(result.success).toBe(true);
  });

  it("should reject a body missing repoId", () => {
    const result = analyzeRepositorySchema.safeParse({
      body: {},
      query: {},
    });
    expect(result.success).toBe(false);
  });

  it("should accept query with excludes", () => {
    const result = analyzeRepositorySchema.safeParse({
      body: { repoId: "repo123" },
      query: { excludes: "dist,node_modules" },
    });
    expect(result.success).toBe(true);
  });
});

describe("getPRAnalysisSchema", () => {
  it("should accept valid params", () => {
    const result = getPRAnalysisSchema.safeParse({
      params: { repoId: "repo123", prNumber: "45" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing prNumber", () => {
    const result = getPRAnalysisSchema.safeParse({
      params: { repoId: "repo123" },
    });
    expect(result.success).toBe(false);
  });
});


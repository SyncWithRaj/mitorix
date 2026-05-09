/**
 * Unit tests for the authentication middleware (protect).
 *
 * Tests JWT validation, missing token handling, and proper user attachment to request.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// --- Mocks ---
vi.mock("jsonwebtoken");
vi.mock("../models/auth.model.js", () => ({
  User: {
    findById: vi.fn(),
  },
}));

const { protect } = await import("../middlewares/auth.middleware.js");
const { User } = await import("../models/auth.model.js");

const mockUser = { _id: "user123", username: "testuser" };

const makeReq = (overrides: Partial<Request> = {}): Partial<Request> => ({
  cookies: {},
  headers: {},
  ...overrides,
});

const makeRes = (): Partial<Response> => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const next: NextFunction = vi.fn();

describe("protect middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if no token is provided", async () => {
    const req = makeReq();
    const res = makeRes();

    await protect(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Not authorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token is invalid", async () => {
    const req = makeReq({ cookies: { token: "bad-token" } });
    const res = makeRes();

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("invalid token");
    });

    await protect(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach user to request and call next if token is valid", async () => {
    const req = makeReq({ cookies: { token: "valid-token" } });
    const res = makeRes();

    vi.mocked(jwt.verify).mockReturnValue({ id: "user123" } as any);
    vi.mocked(User.findById as any).mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });

    await protect(req as Request, res as Response, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("should return 401 if user is not found in DB", async () => {
    const req = makeReq({ cookies: { token: "valid-token" } });
    const res = makeRes();

    vi.mocked(jwt.verify).mockReturnValue({ id: "user123" } as any);
    vi.mocked(User.findById as any).mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    await protect(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    expect(next).not.toHaveBeenCalled();
  });
});

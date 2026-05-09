/**
 * JWT authentication middleware.
 *
 * Verifies the Bearer token from cookies or Authorization header,
 * looks up the corresponding user from MongoDB, and attaches the
 * typed user object to `req.user` for downstream handlers.
 */
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/auth.model.js";
import logger from "../lib/logger.js";

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined);

    if (!token) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

    const user = await User.findById(decoded.id).select("-__v");

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    req.user = user as Express.IUser;

    next();
  } catch (error) {
    logger.warn({ err: error }, "Authentication failed — invalid or expired token");
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

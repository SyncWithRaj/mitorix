/**
 * Express Request type augmentation.
 *
 * Extends the Express Request interface to include a typed `user` property,
 * populated by the authentication middleware after JWT verification.
 * This eliminates the need for `(req as any).user` casts throughout the codebase.
 */
import type { Document, Types } from "mongoose";

declare global {
  namespace Express {
    interface IUser extends Document {
      _id: Types.ObjectId;
      githubId: string;
      username: string;
      email?: string;
      avatar?: string;
      createdAt: Date;
      updatedAt: Date;
    }

    interface Request {
      user?: IUser;
    }
  }
}

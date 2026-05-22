import mongoose from "mongoose";
import logger from "../lib/logger.js";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(uri);

    logger.info({ uri: uri.replace(/\/\/.*@/, "//<credentials>@") }, "MongoDB connected successfully");
  } catch (error) {
    logger.error({ err: error }, "Failed to connect to MongoDB");
    process.exit(1);
  }
};

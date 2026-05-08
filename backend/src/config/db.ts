import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI not defined");
    }

    await mongoose.connect(uri);

    console.log("Mongo connected successfully");
  } catch (error) {
    console.error("Error connecting to Mongo Atlas:", error);
    process.exit(1);
  }
};

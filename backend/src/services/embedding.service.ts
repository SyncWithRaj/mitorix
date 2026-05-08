import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import dotenv from "dotenv";

dotenv.config();

export const embeddingModel = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "models/gemini-embedding-001",
});

export const embedText = async (text: string) => {
  const vector = await embeddingModel.embedQuery(text);
  return vector;
};

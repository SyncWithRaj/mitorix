import type { Request, Response } from "express";
import ChatHistory from "../models/chatHistory.model.js";
import logger from "../lib/logger.js";

export const getHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { repoId } = req.params;
    const { type } = req.query;

    if (!repoId || !type || (type !== "chat" && type !== "call")) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const history = await ChatHistory.findOne({ userId, repoId, type });
    if (!history) {
      return res.json({ success: true, messages: [] });
    }

    return res.json({ success: true, messages: history.messages });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch chat history");
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { repoId } = req.params;
    const { type } = req.query;

    if (!repoId || !type || (type !== "chat" && type !== "call")) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await ChatHistory.findOneAndDelete({ userId, repoId, type });

    return res.json({ success: true, message: "Chat history deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Failed to delete chat history");
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

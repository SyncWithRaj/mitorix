import type { Request, Response } from "express";
import { askQuestion } from "../services/query.service.js";

export const ask = async (req: Request, res: Response) => {
  try {
    const { repoId, question } = req.body;

    if (!repoId || !question) {
      return res.status(400).json({
        success: false,
        message: "repoId and question required",
      });
    }

    const userId = (req as any).user?._id;
    let historyMessages: any[] = [];
    let ChatHistory: any = null;

    if (userId) {
      const ChatHistoryModule = await import("../models/chatHistory.model.js");
      ChatHistory = ChatHistoryModule.default;
      const historyDoc = await ChatHistory.findOne({ userId, repoId, type: "chat" });
      if (historyDoc) {
        historyMessages = historyDoc.messages;
      }
    }

    const result = await askQuestion(repoId, question, historyMessages);

    if (userId && ChatHistory) {
      await ChatHistory.findOneAndUpdate(
        { userId, repoId, type: "chat" },
        {
          $push: {
            messages: {
              $each: [
                { role: "user", content: question },
                { role: "assistant", content: result.answer, references: result.references || [] },
              ],
            },
          },
        },
        { upsert: true }
      );
    }

    // Update lastAccessedAt for the repository
    const { Repository } = await import("../models/repo.model.js");
    await Repository.findByIdAndUpdate(repoId, { lastAccessedAt: new Date() });

    res.json({
      success: true,
      answer: result.answer,
      references: result.references,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Query failed",
    });
  }
};

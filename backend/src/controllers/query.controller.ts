import type { Request, Response, NextFunction } from "express";
import { askQuestion } from "../services/query.service.js";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";

export const ask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { repoId, question, attachedNodes } = req.body as {
      repoId: string;
      question: string;
      attachedNodes?: Array<{
        id: string;
        type: string;
        name: string;
        path?: string;
        source?: string;
        metadata?: Record<string, any>;
      }>;
    };

    const user = req.user;
    if (!user) throw new AppError("Unauthorized", 401);

    const userId = user._id;
    let historyMessages: any[] = [];
    let ChatHistory: any = null;

    const ChatHistoryModule = await import("../models/chatHistory.model.js");
    ChatHistory = ChatHistoryModule.default;
    const historyDoc = await ChatHistory.findOne({ userId, repoId, type: "chat" });
    if (historyDoc) {
      historyMessages = historyDoc.messages;
    }

    const result = await askQuestion(repoId, question, historyMessages, attachedNodes);

    await ChatHistory.findOneAndUpdate(
      { userId, repoId, type: "chat" },
      {
        $push: {
          messages: {
            $each: [
              { 
                role: "user", 
                content: question, 
                attachments: attachedNodes || [] 
              },
              { 
                role: "assistant", 
                content: result.answer, 
                references: result.references || [] 
              },
            ],
          },
        },
      },
      { upsert: true }
    );

    // Update lastAccessedAt for the repository
    const { Repository } = await import("../models/repo.model.js");
    await Repository.findByIdAndUpdate(repoId, { lastAccessedAt: new Date() });

    res.json({
      success: true,
      answer: result.answer,
      references: result.references,
    });
  } catch (error) {
    next(error);
  }
};

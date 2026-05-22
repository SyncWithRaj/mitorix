import type { Request, Response, NextFunction } from "express";
import { askQuestion } from "../services/query.service.js";
import { AppError } from "../middlewares/error.middleware.js";
import type { QueryInput } from "../schemas/query.schema.js";
import type { IAttachment } from "../models/chatHistory.model.js";

const normalizeAttachment = (
  node: NonNullable<QueryInput["attachedNodes"]>[number]
): IAttachment => {
  const normalized: IAttachment = {
    id: node.id.trim(),
    type: node.type.trim(),
    name: node.name.trim(),
  };

  const path = node.path?.trim();
  const source = node.source?.trim();

  if (path) normalized.path = path;
  if (source) normalized.source = source;
  if (node.metadata) normalized.metadata = node.metadata;

  return normalized;
};

export const ask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user as Express.IUser | undefined;
    if (!user) throw new AppError("Unauthorized", 401);

    const userId = user._id;

    const { repoId, question = "", attachedNodes = [] } = req.body as QueryInput;

    const normalizedQuestion = question.trim();
    const normalizedAttachments: IAttachment[] = attachedNodes.map(normalizeAttachment);

    const ChatHistoryModule = await import("../models/chatHistory.model.js");
    const ChatHistory = ChatHistoryModule.default;

    const historyDoc = await ChatHistory.findOne({ userId, repoId, type: "chat" });
    const historyMessages = historyDoc?.messages || [];

    const result = await askQuestion(
      repoId,
      userId.toString(),
      normalizedQuestion,
      historyMessages,
      normalizedAttachments
    );

    await ChatHistory.findOneAndUpdate(
      { userId, repoId, type: "chat" },
      {
        $push: {
          messages: {
            $each: [
              {
                role: "user",
                content: normalizedQuestion,
                attachments: normalizedAttachments,
              },
              {
                role: "assistant",
                content: result.answer,
                references: result.references || [],
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

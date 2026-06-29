import type { Request, Response, NextFunction } from "express";
import { AssemblyAI } from "assemblyai";
import axios from "axios";
import { askQuestion } from "../services/query.service.js";
import ChatHistory from "../models/chatHistory.model.js";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";
import { requireAuthUser } from "../utils/repositoryAccess.util.js";

const getAaiClient = () =>
  new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY as string,
  });

export const processCall = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const { repoId, audioBase64 } = req.body as { repoId: string; audioBase64: string };

    const audioBuffer = Buffer.from(audioBase64, "base64");

    // 1. STT with AssemblyAI
    logger.info({ repoId }, "Transcribing audio via AssemblyAI");
    const client = getAaiClient();
    const transcript = await client.transcripts.transcribe({
      audio: audioBuffer,
      speech_models: ["universal-2"],
    });

    if (transcript.status === "error") {
      throw new AppError("Transcription failed: " + (transcript.error || ""), 500);
    }

    const text = transcript.text;
    if (!text || text.trim() === "") {
      return res.json({ success: true, text: "", answer: "I didn't catch that." });
    }

    logger.info({ repoId, transcription: text.substring(0, 100) }, "Transcription received");

    // 2. Query the LLM
    const user = requireAuthUser(req.user);
    const userId = user._id;

    let historyMessages: any[] = [];
    const historyDoc = await ChatHistory.findOne({ userId, repoId, type: "call" });
    if (historyDoc) {
      historyMessages = historyDoc.messages;
    }

    const result = await askQuestion(repoId, userId.toString(), text, historyMessages);
    const answer = result.answer;

    await ChatHistory.findOneAndUpdate(
      { userId, repoId, type: "call" },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", content: text },
              { role: "assistant", content: answer, references: result.references || [] },
            ],
          },
        },
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      userText: text,
      answer: answer,
      references: result.references || [],
      chunks: [answer.trim()],
    });
  } catch (error) {
    next(error);
  }
};

export const streamTTS = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { text } = req.query;
    if (!text) throw new AppError("No text provided", 400);

    const apiKey = process.env.MURF_API_KEY;
    if (!apiKey) {
      throw new AppError("TTS service is not configured", 500);
    }

    const config = {
      method: "post",
      url: "https://global.api.murf.ai/v1/speech/stream",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      data: {
        voiceId: "Matthew",
        text: text as string,
        locale: "en-US",
        model: "FALCON",
        format: "MP3",
        sampleRate: 24000,
        channelType: "MONO",
      },
      responseType: "stream" as const,
    };

    const response = await axios(config);

    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (error) {
    next(error);
  }
};

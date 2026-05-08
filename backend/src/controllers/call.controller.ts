import type { Request, Response } from "express";
import { AssemblyAI } from "assemblyai";
import axios from "axios";
import { askQuestion } from "../services/query.service.js";
import ChatHistory from "../models/chatHistory.model.js";

const getAaiClient = () =>
  new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY as string,
  });

export const processCall = async (req: Request, res: Response): Promise<any> => {
  try {
    const { repoId, audioBase64 } = req.body;
    if (!audioBase64 || !repoId) {
      return res
        .status(400)
        .json({ success: false, message: "repoId and audioBase64 are required" });
    }

    const audioBuffer = Buffer.from(audioBase64, "base64");

    // 1. STT with AssemblyAI
    console.log("Transcribing audio...");
    const client = getAaiClient();
    const transcript = await client.transcripts.transcribe({
      audio: audioBuffer,
      speech_model: "nano",
    });

    if (transcript.status === "error") {
      console.error(transcript.error);
      return res.status(500).json({ success: false, message: "Transcription failed" });
    }

    const text = transcript.text;
    if (!text || text.trim() === "") {
      return res.json({ success: true, text: "", answer: "I didn't catch that." });
    }

    console.log("User said:", text);

    // 2. Query the LLM
    console.log("Querying LLM...");
    const userId = (req as any).user?._id;
    let historyMessages: any[] = [];

    if (userId) {
      const historyDoc = await ChatHistory.findOne({ userId, repoId, type: "call" });
      if (historyDoc) {
        historyMessages = historyDoc.messages;
      }
    }

    const result = await askQuestion(repoId, text, historyMessages);
    const answer = result.answer;

    if (userId) {
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
    }

    return res.json({
      success: true,
      userText: text,
      answer: answer,
      references: result.references || [],
      chunks: [answer.trim()], // Feed the entire text as a single un-chunked audio payload
    });
  } catch (error) {
    console.error("Call processing failed:", error);
    return res.status(500).json({ success: false, message: "Call processing failed" });
  }
};

export const streamTTS = async (req: Request, res: Response): Promise<any> => {
  try {
    const { text } = req.query;
    if (!text) return res.status(400).send("No text provided");

    const apiKey = process.env.MURF_API_KEY || "ap2_7fd1bf31-c152-486e-9793-c70980f900bb";

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

    // Pipe the audio stream directly to Express response
    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (error: any) {
    console.error("TTS Stream Error:", error?.response?.data || error.message);
    return res.status(500).send("TTS Streaming failed");
  }
};

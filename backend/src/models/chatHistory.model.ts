import mongoose, { Schema, Document } from "mongoose";

export interface IAttachment {
  id: string;
  type: string;
  name: string;
  path?: string;
  source?: string;
}

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  references?: any[];
  attachments?: IAttachment[];
  timestamp: Date;
}

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  repoId: string;
  type: "chat" | "call";
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  references: { type: [Schema.Types.Mixed], default: [] },
  attachments: { type: [Schema.Types.Mixed], default: [] },
  timestamp: { type: Date, default: Date.now },
});

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    repoId: { type: String, required: true },
    type: { type: String, enum: ["chat", "call"], required: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

ChatHistorySchema.index({ userId: 1, repoId: 1, type: 1 }, { unique: true });

export default mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);

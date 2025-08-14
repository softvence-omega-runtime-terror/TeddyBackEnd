import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHistory extends Document {
  userId: Types.ObjectId;
  human: string;
  assistant: string;
}

const historySchema = new Schema<IHistory>(
  {
    // userId: { type: Schema.Types.ObjectId, ref: 'UserCollection', required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    human: { type: String, required: true },
    assistant: { type: String, required: true }
  },
  { timestamps: true }
);

export const History = mongoose.model<IHistory>("History", historySchema);

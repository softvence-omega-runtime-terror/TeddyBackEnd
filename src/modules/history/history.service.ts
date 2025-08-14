import { History } from "./history.model";
import { Types } from "mongoose";

interface CreateHistoryInput {
  userId: string;
  human: string;
  assistant: string;
}

export const createHistory = async ({ userId, human, assistant }: CreateHistoryInput) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId format");
  }

  const newHistory = new History({
    userId,
    human,
    assistant,
  });

  return await newHistory.save();
};

export const getHistoryByUserId = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId format");
  }

  return await History.find({ userId }).sort({ createdAt: -1 });
};

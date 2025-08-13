import { History } from "./history.model";
import { Types } from "mongoose";

export const createHistoryService = async (
  userId: Types.ObjectId,
  human: string,
  assistant: string
) => {
  const newHistory = await History.create({ userId, human, assistant });
  return newHistory;
};

export const getUserHistoryService = async (userId: Types.ObjectId) => {
  const history = await History.find({ userId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  return history;
};

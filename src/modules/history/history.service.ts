import { ProfileModel } from "../user/user.model";
import { UserSubscriptionModel } from "../userSubscription/userSubscription.model";
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

  const maxChatLimit = await ProfileModel.findOne({ user_id: userId });

  const existingHistoryCount = await History.countDocuments({ userId });
  
  const isPaidUser = await UserSubscriptionModel.find({ user: userId, status: { $in: ['active', 'completed'] }, endDate: { $gt: new Date() } }).countDocuments() > 0;

  if (!isPaidUser && existingHistoryCount >= (maxChatLimit?.aiChatCount || 100)) {
    throw new Error("Chat history limit reached. Please upgrade your plan.");
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

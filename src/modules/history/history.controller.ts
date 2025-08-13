import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  createHistoryService,
  getUserHistoryService
} from "./history.service";
import catchAsync from "../../util/catchAsync";
import sendResponse from "../../util/sendResponse";

export const postHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = new Types.ObjectId((req as any).user.id);
  const { human, assistant } = req.body;

  const newHistory = await createHistoryService(userId, human, assistant);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "History created successfully",
    data: newHistory
  });
});

export const getHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = new Types.ObjectId((req as any).user.id);
  const history = await getUserHistoryService(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User history fetched successfully",
    data: history
  });
});

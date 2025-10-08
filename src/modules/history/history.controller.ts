import { Request, Response } from "express";
import { History } from "./history.model";
import { createHistory } from "./history.service";

export const postHistory = async (req: Request, res: Response) => {
  try {
    const { userId, human, assistant } = req.body;

    if (!userId || !human || !assistant) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const result = await createHistory({ userId, human, assistant });
    const newHistory = result;

    res.status(201).json(newHistory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ message: "Missing or invalid userId in query" });
      return;
    }

    const history = await History.find({ userId }).sort({ createdAt: -1 }); // newest first
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

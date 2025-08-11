import { Request, Response } from 'express';
import * as ReportsService from './report.service';

export async function getMonthlyReport(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id; // from auth middleware
    const report = await ReportsService.getMonthlyReport(userId, req.query);
    res.json({ success: true, ...report });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

import { Request, Response } from "express";
import { ReportService } from "../services/report.service";
import { asyncHandler } from "../shared/utils/asyncHandler";


export class ReportController {
  static transactionSummary = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId as string | undefined;

    const summary = await ReportService.transactionSummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  });

  static earnings = asyncHandler(async (_req: Request, res: Response) => {
    const earnings = await ReportService.earnings();

    res.status(200).json({
      success: true,
      data: earnings,
    });
  });
}

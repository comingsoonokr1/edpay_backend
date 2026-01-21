var _a;
import { ReportService } from "../services/report.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class ReportController {
}
_a = ReportController;
ReportController.transactionSummary = asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    const summary = await ReportService.transactionSummary(userId);
    res.status(200).json({
        success: true,
        data: summary,
    });
});
ReportController.earnings = asyncHandler(async (_req, res) => {
    const earnings = await ReportService.earnings();
    res.status(200).json({
        success: true,
        data: earnings,
    });
});

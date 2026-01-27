var _a;
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { ApiError } from "../shared/errors/api.error.js";
import { DataService } from "../services/data.service.js";
export class DataController {
}
_a = DataController;
// GET /data/providers
DataController.getProviders = asyncHandler(async (req, res) => {
    const providers = await DataService.getProviders();
    res.json({
        success: true,
        data: providers,
    });
});
// GET /data/plans?serviceCategoryId=...
DataController.getPlans = asyncHandler(async (req, res) => {
    const { serviceCategoryId } = req.query;
    if (!serviceCategoryId) {
        throw new ApiError(400, "serviceCategoryId is required");
    }
    const plans = await DataService.getPlans(serviceCategoryId);
    res.json({
        success: true,
        data: plans,
    });
});
// POST /data/purchase
DataController.purchaseData = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const { serviceCategoryId, bundleCode, phone, amount, debitAccountNumber, transactionPin, statusUrl, } = req.body;
    if (!serviceCategoryId || !bundleCode || !phone || !amount || !debitAccountNumber) {
        throw new ApiError(400, "Missing required fields");
    }
    const transaction = await DataService.purchaseData({
        userId,
        serviceCategoryId,
        bundleCode,
        phone,
        amount,
        debitAccountNumber,
        transactionPin,
        statusUrl,
    });
    res.status(201).json({
        success: true,
        message: "Data purchase successful",
        data: transaction,
    });
});
// GET /data/status/:reference
DataController.getStatus = asyncHandler(async (req, res) => {
    const reference = req.params.reference;
    const transaction = await DataService.getStatus(reference);
    res.status(200).json({
        success: true,
        data: transaction,
    });
});

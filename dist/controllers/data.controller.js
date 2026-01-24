var _a;
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { ApiError } from "../shared/errors/api.error.js";
import { DataService } from "../services/data.service.js";
export class DataController {
}
_a = DataController;
DataController.getProviders = asyncHandler(async (req, res) => {
    const providers = await DataService.getProviders();
    res.json({
        success: true,
        data: providers,
    });
});
DataController.getPlans = asyncHandler(async (req, res) => {
    const { serviceID } = req.query;
    if (!serviceID) {
        throw new ApiError(400, "serviceID is required");
    }
    const plans = await DataService.getPlans(serviceID);
    res.json({
        success: true,
        data: plans,
    });
});
DataController.purchaseData = asyncHandler(async (req, res) => {
    const { serviceID, planId, phone } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const transaction = await DataService.purchaseData({
        userId,
        serviceID,
        planId,
        phone,
    });
    res.status(201).json({
        success: true,
        data: transaction,
    });
});
DataController.getStatus = asyncHandler(async (req, res) => {
    const reference = req.params.reference;
    const transaction = await DataService.getStatus(reference);
    res.status(200).json({
        success: true,
        data: transaction,
    });
});

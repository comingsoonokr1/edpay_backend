var _a;
import { AirtimeService } from "../services/airtime.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class AirtimeController {
}
_a = AirtimeController;
AirtimeController.getProviders = asyncHandler(async (_req, res) => {
    const providers = await AirtimeService.getProviders();
    res.status(200).json({
        success: true,
        data: providers,
    });
});
AirtimeController.purchase = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { provider, phone, amount } = req.body;
    const transaction = await AirtimeService.purchaseAirtime({
        userId,
        provider,
        phone,
        amount,
    });
    res.status(201).json({
        success: true,
        message: "Airtime purchase successful",
        data: transaction,
    });
});
AirtimeController.getStatus = asyncHandler(async (req, res) => {
    const reference = req.params.reference;
    const transaction = await AirtimeService.getStatus(reference);
    res.status(200).json({
        success: true,
        data: transaction,
    });
});

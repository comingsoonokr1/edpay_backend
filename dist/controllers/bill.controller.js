var _a;
import { BillService } from "../services/bill.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { ApiError } from "../shared/errors/api.error.js";
export class BillController {
}
_a = BillController;
BillController.getProviders = asyncHandler(async (req, res) => {
    const { category } = req.query;
    if (!category) {
        throw new ApiError(400, "Category is required");
    }
    const providers = await BillService.getProviders(category);
    res.status(200).json({
        success: true,
        data: providers,
    });
});
BillController.payBill = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { provider, customerId, amount } = req.body;
    const transaction = await BillService.payBill({
        userId,
        provider,
        customerId,
        amount,
    });
    res.status(201).json({
        success: true,
        message: "Bill payment successful",
        data: transaction,
    });
});
BillController.getstatus = asyncHandler(async (req, res) => {
    const reference = req.params.reference;
    const transaction = await BillService.getStatus(reference);
    res.status(200).json({
        success: true,
        data: transaction,
    });
});

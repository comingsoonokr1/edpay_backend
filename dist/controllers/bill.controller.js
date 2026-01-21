var _a;
import { BillService } from "../services/bill.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class BillController {
}
_a = BillController;
BillController.getProviders = asyncHandler(async (_req, res) => {
    const providers = await BillService.getProviders();
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

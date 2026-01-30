var _a;
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import { BillService } from "../services/bill.service.js";
export class BillController {
}
_a = BillController;
BillController.getProducts = asyncHandler(async (req, res) => {
    const { serviceCategoryId } = req.params;
    const products = await BillService.getProviderProducts(serviceCategoryId);
    res.status(200).json({ success: true, data: products });
});
// Get providers
BillController.getProviders = asyncHandler(async (req, res) => {
    const { category } = req.query;
    const providers = await BillService.getProviders(category);
    res.status(200).json({ success: true, data: providers });
});
// Pay bill
BillController.payBill = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { provider, customerId, amount, variationCode, billType, transactionPin } = req.body;
    const transaction = await BillService.payBill({
        userId,
        provider,
        customerId,
        amount,
        variationCode,
        billType,
        transactionPin,
    });
    res.status(200).json({
        success: true,
        message: "Bill paid successfully",
        data: transaction,
    });
});
// Get bill status
BillController.getBillStatus = asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const transaction = await BillService.getStatus(reference);
    res.status(200).json({
        success: true,
        data: transaction,
    });
});

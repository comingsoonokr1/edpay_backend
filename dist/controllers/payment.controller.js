var _a;
import { PaymentService } from "../services/payment.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class PaymentController {
}
_a = PaymentController;
PaymentController.initiatePayment = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { amount, channel } = req.body;
    const transaction = await PaymentService.initiatePayment({
        userId,
        amount,
        channel,
    });
    res.status(201).json({
        success: true,
        data: transaction,
    });
});
PaymentController.verifyPayment = asyncHandler(async (req, res) => {
    const { reference } = req.body;
    const transaction = await PaymentService.verifyPayment(reference);
    res.status(200).json({
        success: true,
        data: transaction,
    });
});
PaymentController.getTransaction = asyncHandler(async (req, res) => {
    const transactionId = req.params.transactionId;
    const transaction = await PaymentService.getTransaction(transactionId);
    if (!transaction) {
        return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.status(200).json({
        success: true,
        data: transaction,
    });
});
PaymentController.listTransactions = asyncHandler(async (req, res) => {
    const filter = req.query || {};
    const transactions = await PaymentService.listTransactions(filter);
    res.status(200).json({
        success: true,
        data: transactions,
    });
});

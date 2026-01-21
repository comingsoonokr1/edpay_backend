var _a;
import { WalletService } from "../services/wallet.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class WalletController {
}
_a = WalletController;
WalletController.getBalance = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const balance = await WalletService.getBalance(userId);
    res.status(200).json({
        success: true,
        data: { balance },
    });
});
WalletController.getTransactions = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const transactions = await WalletService.getTransactions(userId);
    res.status(200).json({
        success: true,
        data: transactions,
    });
});
WalletController.fundWallet = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;
    const balance = await WalletService.createStripePaymentIntent(userId, amount);
    res.status(200).json({
        success: true,
        message: "Wallet funded successfully",
        data: { balance },
    });
});
WalletController.withdraw = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { amount } = req.body;
    const balance = await WalletService.withdraw(userId, amount);
    res.status(200).json({
        success: true,
        message: "Withdrawal successful",
        data: { balance },
    });
});
WalletController.transfer = asyncHandler(async (req, res) => {
    const senderId = req.user.userId;
    const { receiverEmail, amount } = req.body;
    const balance = await WalletService.transfer(senderId, receiverEmail, amount);
    res.status(200).json({
        success: true,
        message: "Transfer successful",
        data: { balance },
    });
});

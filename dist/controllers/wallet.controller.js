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
WalletController.getBanks = asyncHandler(async (_req, res) => {
    const banks = await WalletService.getBanks();
    res.status(200).json({
        success: true,
        data: banks,
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
    const { method, recipient, amount, bankName, accountNumber, transactionPin, note } = req.body;
    if (!method || !recipient || !amount) {
        return res.status(400).json({
            success: false,
            message: "Method, recipient, and amount are required",
        });
    }
    const result = await WalletService.transfer({
        senderId,
        method,
        recipient,
        amount,
        bankName,
        accountNumber,
        transactionPin,
        note
    });
    res.status(200).json({
        success: true,
        message: result.message,
        data: {
            balance: result.balance,
            transferReference: result.transferReference,
        },
    });
});
// New endpoint: Check bank transfer status
WalletController.checkTransferStatus = asyncHandler(async (req, res) => {
    const { transferReference } = req.params;
    if (!transferReference) {
        return res.status(400).json({
            success: false,
            message: "Transfer reference is required",
        });
    }
    const result = await WalletService.checkPendingTransfer(transferReference);
    res.status(200).json({
        success: true,
        data: result,
    });
});

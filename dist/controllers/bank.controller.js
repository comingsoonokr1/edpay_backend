var _a;
import { BankService } from "../services/bank.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class BankController {
}
_a = BankController;
BankController.linkBank = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { bankName, accountNumber, accountName, bankCode } = req.body;
    const bankAccount = await BankService.linkBankAccount({
        userId,
        bankName,
        accountNumber,
        accountName,
        bankCode
    });
    res.status(201).json({
        success: true,
        message: "Bank account linked successfully",
        data: bankAccount,
    });
});
BankController.getUserBanks = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const banks = await BankService.getUserBanks(userId);
    res.status(200).json({
        success: true,
        data: banks,
    });
});

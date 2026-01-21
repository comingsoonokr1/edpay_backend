import { ApiError } from "../shared/errors/api.error.js";
import { BankAccount } from "../model/BankAccount.model.js";
import { BankVerificationProvider } from "../providers/bankVerification.provider.js";
export class BankService {
    static async linkBankAccount(data) {
        // Verify bank account via API
        const verified = await BankVerificationProvider.verifyAccount(data.accountNumber, data.bankCode);
        if (!verified || verified.account_name.toLowerCase() !== data.accountName.toLowerCase()) {
            throw new ApiError(400, "Bank account verification failed");
        }
        const existing = await BankAccount.findOne({
            userId: data.userId,
            accountNumber: data.accountNumber,
        });
        if (existing) {
            throw new ApiError(409, "Bank account already linked");
        }
        return BankAccount.create({
            userId: data.userId,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            accountName: data.accountName,
            isVerified: true, // mock verification
        });
    }
    static async getUserBanks(userId) {
        return BankAccount.find({ userId });
    }
}

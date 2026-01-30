import { SafeHavenProvider } from "../providers/safeHeaven.provider.js";
import { ApiError } from "../shared/errors/api.error.js";
export class BankService {
    static async getBanks() {
        try {
            const banks = await SafeHavenProvider.getBanks();
            console.log(banks);
            return banks;
        }
        catch (err) {
            console.error("Get banks failed:", err);
            throw new ApiError(500, "Unable to fetch banks");
        }
    }
    static async nameEnquiry(data) {
        try {
            // 1️⃣ Fetch banks
            const banks = await SafeHavenProvider.getBanks();
            if (!Array.isArray(banks)) {
                throw new ApiError(500, "Invalid banks response");
            }
            // 2️⃣ Normalize user input
            const userBankName = data.bankName.trim().toUpperCase();
            // 3️⃣ Find matching bank
            const matchedBank = banks.find((bank) => bank.name.toUpperCase().includes(userBankName));
            if (!matchedBank) {
                throw new ApiError(404, "Bank not found. Please check bank name.");
            }
            // 4️⃣ Name enquiry
            const response = await SafeHavenProvider.nameEnquiry(matchedBank.bankCode, data.accountNumber);
            console.log(response);
            return {
                bankName: matchedBank.bankName,
                bankCode: matchedBank.bankCode,
                accountName: response.accountName,
                sessionId: response.sessionId
            };
        }
        catch (err) {
            console.error("Name enquiry failed:", err);
            if (err instanceof ApiError)
                throw err;
            throw new ApiError(400, "Bank account verification failed");
        }
    }
}

// import dotenv from "dotenv";
// dotenv.config();

import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export class BankVerificationProvider {
  static async verifyAccount(accountNumber: string, bankCode: string) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      if (response.data.status) {
        return response.data.data; // Contains account_name, etc.
      } else {
        throw new Error("Bank account verification failed");
      }
    } catch (err) {
      throw new Error("Bank verification API error");
    }
  }
}

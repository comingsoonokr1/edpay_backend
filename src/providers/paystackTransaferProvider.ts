import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export class PaystackTransferProvider {
    static async createRecipient(
        name: string,
        accountNumber: string,
        bankCode: string
    ) {
        const response = await axios.post(
            "https://api.paystack.co/transferrecipient",
            {
                type: "nuban",
                name,
                account_number: accountNumber,
                bank_code: bankCode,
                currency: "NGN",
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        return response.data.data.recipient_code;
    }

    static async initiateTransfer(
        recipientCode: string,
        amount: number,
        reason?: string
    ) {
        const response = await axios.post(
            "https://api.paystack.co/transfer",
            {
                source: "balance",
                amount: amount * 100, // Paystack uses kobo
                recipient: recipientCode,
                reason,
            },
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                },
            }
        );

        return response.data.data; // includes transfer_code & status
    }

}

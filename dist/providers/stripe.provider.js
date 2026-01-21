import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
console.log("Stripe key:", process.env.STRIPE_SECRET_KEY);
console.log("REFRESH_TOKEN_EXPIRES:", process.env.REFRESH_TOKEN_EXPIRES);
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
});
export class StripeProvider {
    static async retrievePaymentMethod(paymentMethodId) {
        return stripe.paymentMethods.retrieve(paymentMethodId);
    }
    static async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
        return stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
    }
    static async createCustomer(email, name) {
        return stripe.customers.create({
            email,
            name,
        });
    }
}

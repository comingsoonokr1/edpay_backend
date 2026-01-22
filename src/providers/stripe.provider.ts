import dotenv from "dotenv";
dotenv.config();

import Stripe from "stripe";

console.log("Stripe API key:", process.env.STRIPE_API_KEY);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});




export class StripeProvider {

  static async retrievePaymentMethod(paymentMethodId: string) {
    return stripe.paymentMethods.retrieve(paymentMethodId);
  }

  static async attachPaymentMethodToCustomer(
    paymentMethodId: string,
    customerId: string
  ) {
    return stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  static async createCustomer(email: string, name?: string) {
    return stripe.customers.create({
      email,
      name,
    });
  }
}

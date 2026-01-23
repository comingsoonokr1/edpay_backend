import dotenv from "dotenv";
dotenv.config();


import Stripe from "stripe";



export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
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

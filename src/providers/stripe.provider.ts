// import dotenv from "dotenv";
// dotenv.config();
console.log("refresh token:", process.env.REFRESH_TOKEN_EXPIRES)
console.log("ENV vars:");
console.log("Stripe SECRET key:", process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY env variable");
}


import Stripe from "stripe";



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

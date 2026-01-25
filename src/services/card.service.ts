import { Card } from "../model/Card.model.js";
import { StripeProvider } from "../providers/stripe.provider.js";
import { ApiError } from "../shared/errors/api.error.js";


export class CardService {
  static async storeCard(userId: string, paymentMethodId: string) {
    const paymentMethod = await StripeProvider.retrievePaymentMethod(paymentMethodId);

    if (!paymentMethod || paymentMethod.type !== "card") {
      throw new ApiError(400, "Invalid payment method");
    }

    const exists = await Card.findOne({
      userId,
      last4: paymentMethod.card?.last4,
      cardBrand: paymentMethod.card?.brand, 
    });

    if (exists) {
      throw new ApiError(409, "Card already stored");
    }

    return Card.create({
      userId,
      last4: paymentMethod.card?.last4,
      cardBrand: paymentMethod.card?.brand,
      token: paymentMethod.id,
      expiryMonth: paymentMethod.card?.exp_month,
      expiryYear: paymentMethod.card?.exp_year,
    });
  }


  static async removeCard(userId: string, cardId: string) {
    const card = await Card.findOneAndDelete({ _id: cardId, userId });

    if (!card) {
      throw new ApiError(404, "Card not found");
    }

    return { message: "Card removed successfully" };
  }
}

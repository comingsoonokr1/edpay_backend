import { Request, Response } from "express";
import { CheckoutService } from "../services/checkout.service";

export class CheckoutController {
  static async verifyCheckout(req: Request, res: Response) {
    const { reference } = req.params as { reference: string };
    const userId = req.user!.userId;

    const result = await CheckoutService.verifyCheckout(reference, userId);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result,
    });
  }
}

import { CheckoutService } from "../services/checkout.service";
export class CheckoutController {
    static async verifyCheckout(req, res) {
        const { reference } = req.params;
        const userId = req.user.userId;
        const result = await CheckoutService.verifyCheckout(reference, userId);
        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            data: result,
        });
    }
}

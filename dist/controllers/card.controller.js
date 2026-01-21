var _a;
import { CardService } from "../services/card.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
export class CardController {
}
_a = CardController;
CardController.storeCard = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
        return res.status(400).json({
            success: false,
            message: "paymentMethodId is required",
        });
    }
    const card = await CardService.storeCard(userId, paymentMethodId);
    res.status(201).json({
        success: true,
        message: "Card stored successfully",
        data: card,
    });
});
CardController.removeCard = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const cardId = req.params.cardId;
    const result = await CardService.removeCard(userId, cardId);
    res.status(200).json({
        success: true,
        message: result.message,
    });
});

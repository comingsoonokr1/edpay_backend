import { Request, Response } from "express";
import { CardService } from "../services/card.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";

export class CardController {
  static storeCard = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

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

  static removeCard = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const cardId = req.params.cardId as string;

    const result = await CardService.removeCard(userId, cardId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });
}

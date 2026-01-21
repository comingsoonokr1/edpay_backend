import { Router } from "express";
import { CardController } from "../controllers/card.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  removeCardSchema,
  storeCardSchema,
} from "../schemas/card.schema";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cards
 *   description: Payment card management
 */

router.use(authMiddleware);

/**
 * @swagger
 * /cards/store:
 *   post:
 *     summary: Store a payment card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoreCardRequest'
 *     responses:
 *       201:
 *         description: Card stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cardId:
 *                   type: string
 *                   example: card_123456
 *                 last4:
 *                   type: string
 *                   example: "4242"
 *                 brand:
 *                   type: string
 *                   example: Visa
 *       400:
 *         description: Invalid card details
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/store",
  validate(storeCardSchema),
  CardController.storeCard
);

/**
 * @swagger
 * /cards/remove/{cardId}:
 *   delete:
 *     summary: Remove a stored payment card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *         example: card_123456
 *     responses:
 *       200:
 *         description: Card removed successfully
 *       404:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/remove/:cardId",
  validate(removeCardSchema),
  CardController.removeCard
);

export default router;

import { Router } from "express";
import { BankController } from "../controllers/bank.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  getUserBanksSchema,
  linkBankSchema,
} from "../schemas/bank.schema";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Banks
 *   description: User bank account management
 */

router.use(authMiddleware);

/**
 * @swagger
 * /banks/link:
 *   post:
 *     summary: Link a new bank account
 *     tags: [Banks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkBankRequest'
 *     responses:
 *       201:
 *         description: Bank account linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bankName:
 *                   type: string
 *                   example: Access Bank
 *                 accountNumber:
 *                   type: string
 *                   example: "0123456789"
 *                 accountName:
 *                   type: string
 *                   example: John Doe
 *       400:
 *         description: Invalid bank details
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/link",
  validate(linkBankSchema),
  BankController.linkBank
);

/**
 * @swagger
 * /banks/accounts:
 *   get:
 *     summary: Get all linked bank accounts for the user
 *     tags: [Banks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of linked bank accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                     example: GTBank
 *                   accountNumber:
 *                     type: string
 *                     example: "0123456789"
 *                   accountName:
 *                     type: string
 *                     example: John Doe
 *       401:
 *         description: Unauthorized
 */
router.get("/accounts", BankController.getUserBanks);

export default router;

import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { fundWalletSchema, withdrawSchema, } from "../schemas/wallet.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet balance, funding, withdrawal, and transfers
 */
router.use(authMiddleware);
/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Get wallet balance for current user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   example: 15000.50
 *                 currency:
 *                   type: string
 *                   example: NGN
 *       401:
 *         description: Unauthorized
 */
router.get("/balance", WalletController.getBalance);
/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallet transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     example: credit
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                     example: success
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/transactions", WalletController.getTransactions);
/**
 * @swagger
 * /wallet/fund:
 *   post:
 *     summary: Fund wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FundWalletRequest'
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/fund", validate(fundWalletSchema), WalletController.fundWallet);
/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Withdraw from wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawRequest'
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Invalid withdrawal request
 *       401:
 *         description: Unauthorized
 */
router.post("/withdraw", validate(withdrawSchema), WalletController.withdraw);
/**
 * @swagger
 * /wallet/transfer:
 *   post:
 *     summary: Transfer money to another user wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *     responses:
 *       200:
 *         description: Transfer successful
 *       400:
 *         description: Invalid transfer request
 *       401:
 *         description: Unauthorized
 */
router.post("/transfer", 
// validate(transferSchema),
WalletController.transfer);
export default router;

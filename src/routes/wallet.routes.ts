import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  withdrawSchema,
} from "../schemas/wallet.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet balance, funding, withdrawal, and transfers
 */

router.get("/account/:accountId", WalletController.getAccount);

router.use(authMiddleware);

/**
 * Get wallet balance
 */
router.get("/balance", WalletController.getBalance);

/**
 * Get wallet transaction history
 */
router.get("/transactions", WalletController.getTransactions);


/**
 * Withdraw from wallet
 */
router.post(
  "/withdraw",
  validate(withdrawSchema),
  WalletController.withdraw
);

/**
 * Transfer money (user wallet or bank)
 */
router.post(
  "/transfer",
  // validate(transferSchema),
  WalletController.transfer
);

/**
 * Get list of banks (for bank transfers)
 */
router.get("/banks", WalletController.getBanks);

/**
 * Check status of a pending bank transfer
 */
router.get("/transfer/:transferReference/status", WalletController.checkTransferStatus);

export default router;

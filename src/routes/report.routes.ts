import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { validate } from "../middlewares/validate.middleware";
import { transactionsSummarySchema } from "../schemas/report.schema";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Financial reports and analytics
 */

router.use(authMiddleware);

/**
 * @swagger
 * /reports/transactions-summary:
 *   get:
 *     summary: Get transaction summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: 2024-01-01
 *       - in: query
 *         name: to
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: 2024-01-31
 *     responses:
 *       200:
 *         description: Transaction summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTransactions:
 *                   type: number
 *                   example: 150
 *                 totalAmount:
 *                   type: number
 *                   example: 450000
 *                 success:
 *                   type: number
 *                   example: 140
 *                 failed:
 *                   type: number
 *                   example: 10
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/transactions-summary",
  validate(transactionsSummarySchema),
  ReportController.transactionSummary
);

/**
 * @swagger
 * /reports/earnings:
 *   get:
 *     summary: Get earnings report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEarnings:
 *                   type: number
 *                   example: 75000
 *                 currency:
 *                   type: string
 *                   example: NGN
 *       401:
 *         description: Unauthorized
 */
router.get("/earnings", ReportController.earnings);

export default router;

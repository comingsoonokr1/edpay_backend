import { Router } from "express";
import { BillController } from "../controllers/bill.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  billStatusSchema,
  payBillSchema,
} from "../schemas/bill.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bills
 *   description: Bill payments and bill management
 */

router.use(authMiddleware);

/**
 * @swagger
 * /bills/providers:
 *   get:
 *     summary: Get available bill providers
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bill providers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: DSTV
 *                   name:
 *                     type: string
 *                     example: DSTV Nigeria
 *       401:
 *         description: Unauthorized
 */
router.get("/providers", BillController.getProviders);

/**
 * @swagger
 * /bills/pay:
 *   post:
 *     summary: Pay a bill
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayBillRequest'
 *     responses:
 *       200:
 *         description: Bill payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                   example: BILL_987654321
 *                 status:
 *                   type: string
 *                   example: pending
 *       400:
 *         description: Invalid bill details
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/pay",
  validate(payBillSchema),
  BillController.payBill
);

/**
 * @swagger
 * /bills/status/{reference}:
 *   get:
 *     summary: Get bill payment status
 *     tags: [Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         example: BILL_987654321
 *     responses:
 *       200:
 *         description: Bill payment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: success
 *                 amount:
 *                   type: number
 *                   example: 5000
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/status/:reference",
  validate(billStatusSchema),
  BillController.getBillStatus
);

export default router;

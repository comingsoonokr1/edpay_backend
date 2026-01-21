import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { initiatePaymentSchema, transactionIdSchema, verifyPaymentSchema, } from "../schemas/payment.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment initiation and transaction management
 */
router.use(authMiddleware);
/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InitiatePaymentRequest'
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                   example: PAY_123456789
 *                 authorizationUrl:
 *                   type: string
 *                   example: https://paystack.com/pay/xyz
 *       400:
 *         description: Invalid payment request
 *       401:
 *         description: Unauthorized
 */
router.post("/initiate", validate(initiatePaymentSchema), PaymentController.initiatePayment);
/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyPaymentRequest'
 *     responses:
 *       200:
 *         description: Payment verified successfully
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
 *                   example: 10000
 *       400:
 *         description: Verification failed
 *       401:
 *         description: Unauthorized
 */
router.post("/verify", validate(verifyPaymentSchema), PaymentController.verifyPayment);
/**
 * @swagger
 * /payments/{transactionId}:
 *   get:
 *     summary: Get a single transaction by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         example: 65af02c93fd8aa0012de445a
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 reference:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: success
 *                 amount:
 *                   type: number
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:transactionId", validate(transactionIdSchema), PaymentController.getTransaction);
/**
 * @swagger
 * /payments:
 *   get:
 *     summary: List user transactions
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   reference:
 *                     type: string
 *                   status:
 *                     type: string
 *                     example: success
 *                   amount:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get("/", PaymentController.listTransactions);
export default router;

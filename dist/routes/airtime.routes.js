import { Router } from "express";
import { AirtimeController } from "../controllers/airtime.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { airtimeStatusSchema, } from "../schemas/airtime.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Airtime
 *   description: Airtime purchase and management
 */
/**
 * @swagger
 * /airtime/providers:
 *   get:
 *     summary: Get available airtime providers
 *     tags: [Airtime]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of airtime providers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: MTN
 *                   name:
 *                     type: string
 *                     example: MTN Nigeria
 *       401:
 *         description: Unauthorized
 */
router.get("/providers", authMiddleware, AirtimeController.getProviders);
/**
 * @swagger
 * /airtime/purchase:
 *   post:
 *     summary: Purchase airtime
 *     tags: [Airtime]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseAirtimeRequest'
 *     responses:
 *       200:
 *         description: Airtime purchase successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                   example: AIRTIME_123456789
 *                 status:
 *                   type: string
 *                   example: pending
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/purchase", authMiddleware, 
// validate(purchaseAirtimeSchema),
AirtimeController.purchase);
/**
 * @swagger
 * /airtime/status/{reference}:
 *   get:
 *     summary: Get airtime purchase status
 *     tags: [Airtime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         example: AIRTIME_123456789
 *     responses:
 *       200:
 *         description: Airtime transaction status
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
 *                   example: 1000
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get("/status/:reference", authMiddleware, validate(airtimeStatusSchema), AirtimeController.getStatus);
export default router;

import { Router } from "express";
import { DataController } from "../controllers/data.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { dataPurchaseSchema } from "../schemas/data.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Data
 *   description: Mobile data purchase and management
 */
router.use(authMiddleware);
/**
 * @swagger
 * /data/purchase:
 *   post:
 *     summary: Purchase mobile data
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PurchaseDataRequest'
 *     responses:
 *       200:
 *         description: Data purchase initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reference:
 *                   type: string
 *                   example: DATA_123456789
 *                 status:
 *                   type: string
 *                   example: pending
 *       400:
 *         description: Invalid data purchase request
 *       401:
 *         description: Unauthorized
 */
router.post("/purchase", validate(dataPurchaseSchema), DataController.purchaseData);
/**
 * @swagger
 * /data/status/{reference}:
 *   get:
 *     summary: Get data purchase status
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         example: DATA_123456789
 *     responses:
 *       200:
 *         description: Data transaction status
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
 *                 plan:
 *                   type: string
 *                   example: 2GB Monthly
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get("/status/:reference", DataController.getStatus);
export default router;

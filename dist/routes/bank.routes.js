import { Router } from "express";
import { BankController } from "../controllers/bank.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { z } from "zod";
const router = Router();
/**
 * GET /api/banks
 */
router.get("/", 
// authMiddleware,
BankController.getBanks);
/**
 * POST /api/banks/name-enquiry
 */
router.post("/name-enquiry", 
// authMiddleware,
validate(z.object({
    body: z.object({
        bankName: z.string().min(3),
        accountNumber: z.string().length(10),
    }),
})), BankController.nameEnquiry);
export default router;

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { CheckoutController } from "../controllers/checkout.controller";
const router = Router();
router.use(authMiddleware);
router.get("/verify/:reference", CheckoutController.verifyCheckout);
export default router;

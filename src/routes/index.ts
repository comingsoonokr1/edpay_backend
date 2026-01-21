import { Router } from "express";
import authRoutes from "./auth.routes.js";
import airtimeRoutes from "./airtime.routes.js";
import bankRoutes from "./bank.routes.js";
import billRoutes from "./bill.routes.js";
import cardRoutes from "./card.routes.js";
import notificationRoutes from "./notification.routes.js";
import paymentRoutes from "./payment.routes.js";
import reportRoutes from "./report.routes.js";
import userRoutes from "./user.routes.js";
import walletRoutes from "./wallet.routes.js";
import dataRoutes from "./data.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/airtime", airtimeRoutes);
router.use("/bank", bankRoutes);
router.use("/user", userRoutes);
router.use("/bill", billRoutes);
router.use("/card", cardRoutes);
router.use("/notification", notificationRoutes);
router.use("/payment", paymentRoutes);
router.use("/report", reportRoutes);
router.use("/wallet", walletRoutes);
router.use("/data", dataRoutes);





export default router;
import { Router } from "express";
import authRoutes from "./auth.routes";
import airtimeRoutes from "./airtime.routes";
import bankRoutes from "./bank.routes";
import billRoutes from "./bill.routes";
import cardRoutes from "./card.routes";
import notificationRoutes from "./notification.routes";
import paymentRoutes from "./payment.routes";
import reportRoutes from "./report.routes";
import userRoutes from "./user.routes";
import walletRoutes from "./wallet.routes";
import dataRoutes from "./data.routes";

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
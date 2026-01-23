import express from "express";
import crypto from "crypto";
import { Transaction } from "../model/Transaction.model.js";
import { Wallet } from "../model/Wallet.model.js";

const router = express.Router();

/**
 * Paystack Webhook (SECURED)
 */
router.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"];

      // Verify Paystack signature
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
        .update(req.body)
        .digest("hex");

      if (hash !== signature) {
        return res.sendStatus(401); // Unauthorized
      }

      // Parse event AFTER verification
      const event = JSON.parse(req.body.toString());

      /** Transfer Successful */
      if (event.event === "transfer.success") {
        const ref = event.data.transfer_code;

        const tx = await Transaction.findOne({ reference: ref });
        if (!tx) return res.sendStatus(200);
        if (tx.status === "success") return res.sendStatus(200); // Idempotency guard

        const wallet = await Wallet.findOne({ userId: tx.userId });
        if (!wallet) return res.sendStatus(200);

        // Release reserved funds and debit actual balance
        wallet.reservedBalance = Math.max(
          0,
          (wallet.reservedBalance || 0) - tx.amount
        );
        wallet.balance -= tx.amount;

        await wallet.save();

        tx.status = "success";
        await tx.save();
      }

      /** Transfer Failed */
      if (event.event === "transfer.failed") {
        const ref = event.data.transfer_code;

        const tx = await Transaction.findOne({ reference: ref });
        if (!tx) return res.sendStatus(200);
        if (tx.status === "failed") return res.sendStatus(200); // Idempotency guard

        const wallet = await Wallet.findOne({ userId: tx.userId });
        if (wallet) {
          // Release reserved funds ONLY
          wallet.reservedBalance = Math.max(
            0,
            (wallet.reservedBalance || 0) - tx.amount
          );
          await wallet.save();
        }

        tx.status = "failed";
        await tx.save();
      }

      return res.sendStatus(200);
    } catch (error) {
      console.error("Paystack Webhook Error:", error);
      return res.sendStatus(500);
    }
  }
);

export default router;

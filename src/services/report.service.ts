import { Transaction } from "../model/Transaction.model.js";

export class ReportService {
  static async transactionSummary(userId?: string) {
    const match: any = {};
    if (userId) match.userId = userId;

    return Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  static async earnings() {
    return Transaction.aggregate([
      { $match: { status: "success" } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$amount" },
        },
      },
    ]);
  }
}

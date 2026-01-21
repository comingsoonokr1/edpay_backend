export type PaymentChannel = "card" | "bank" | "wallet";

export interface TransactionDocument {
  userId: string;
  amount: number;
  type: "payment" | "airtime" | "bill" | "transfer";
  status: "pending" | "success" | "failed";
  reference: string;
  channel?: PaymentChannel;
  meta?: Record<string, any>;
}

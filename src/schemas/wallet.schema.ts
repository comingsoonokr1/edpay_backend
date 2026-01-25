import { z } from "zod";

export const fundWalletSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than zero"),
  }),
});

export const withdrawSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be greater than zero"),
  }),
});

// export const transferSchema = z.object({
//   body: z.object({
//     receiverEmail: z.string().email("Invalid receiver email"),
//     amount: z.number().positive("Amount must be greater than zero"),
//   }),
// });

// export const transferSchema = z.object({
//   body: z.object({
//     method: z.enum(["user", "bank"]),
//     recipient: z.string().optional(),
//     bank: z.string().optional(),
//     accountNumber: z.string().optional(),
//     amount: z.coerce.number().positive("Amount must be greater than zero"),
//   }).superRefine((data, ctx) => {
//     if (data.method === "user" && !data.recipient) {
//       ctx.addIssue({
//         path: ["recipient"],
//         message: "Recipient is required for user transfer",
//         code: z.ZodIssueCode.custom,
//       });
//     }

//     if (data.method === "bank") {
//       if (!data.bank) {
//         ctx.addIssue({
//           path: ["bank"],
//           message: "Bank is required for bank transfer",
//           code: z.ZodIssueCode.custom,
//         });
//       }
//       if (!data.accountNumber) {
//         ctx.addIssue({
//           path: ["accountNumber"],
//           message: "Account number is required for bank transfer",
//           code: z.ZodIssueCode.custom,
//         });
//       }
//     }
//   }),
// });



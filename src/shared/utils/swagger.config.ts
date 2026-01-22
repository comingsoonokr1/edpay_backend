import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EDPay API",
      version: "1.0.0",
      description: "EDPay API Documentation",
    },

    // servers: [
    //   {
    //     url: "https://edpay-backend.onrender.com/api",
    //     description: "Production server",
    //   },
    // ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["fullName", "email", "password"],
          properties: {
            fullName: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "Password123" },
          },
        },

        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "Password123" },
          },
        },

        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },

        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", example: "john@example.com" },
          },
        },

        ResetPasswordRequest: {
          type: "object",
          required: ["token", "password"],
          properties: {
            token: { type: "string" },
            password: { type: "string", example: "NewPassword123" },
          },
        },

        VerifyEmailRequest: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: { type: "string", example: "john@example.com" },
            otp: { type: "string", example: "123456" },
          },
        },

        ResendOTPRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", example: "john@example.com" },
          },
        },

        PurchaseAirtimeRequest: {
          type: "object",
          required: ["provider", "phone", "amount"],
          properties: {
            provider: {
              type: "string",
              example: "MTN",
            },
            phone: {
              type: "string",
              example: "08031234567",
            },
            amount: {
              type: "number",
              example: 1000,
            },
          },
        },
        LinkBankRequest: {
          type: "object",
          required: ["bankCode", "accountNumber"],
          properties: {
            bankCode: {
              type: "string",
              example: "044",
            },
            accountNumber: {
              type: "string",
              example: "0123456789",
            },
          },
        },
        PayBillRequest: {
          type: "object",
          required: ["provider", "customerId", "amount"],
          properties: {
            provider: {
              type: "string",
              example: "DSTV",
            },
            customerId: {
              type: "string",
              example: "1234567890",
            },
            amount: {
              type: "number",
              example: 5000,
            },
          },
        },
        StoreCardRequest: {
          type: "object",
          required: ["token"],
          properties: {
            token: {
              type: "string",
              example: "tok_visa_123456789",
            },
          },
        },
        PurchaseDataRequest: {
          type: "object",
          required: ["provider", "phone", "planId"],
          properties: {
            provider: {
              type: "string",
              example: "MTN",
            },
            phone: {
              type: "string",
              example: "08031234567",
            },
            planId: {
              type: "string",
              example: "MTN_2GB_30D",
            },
          },
        },
        SendNotificationRequest: {
          type: "object",
          required: ["userId", "title", "message"],
          properties: {
            userId: {
              type: "string",
              example: "64f2a0c9b8a1e90012abcd34",
            },
            title: {
              type: "string",
              example: "Payment Successful",
            },
            message: {
              type: "string",
              example: "Your airtime purchase was successful",
            },
          },
        },
        InitiatePaymentRequest: {
          type: "object",
          required: ["amount", "currency"],
          properties: {
            amount: {
              type: "number",
              example: 10000,
            },
            currency: {
              type: "string",
              example: "NGN",
            },
            description: {
              type: "string",
              example: "Wallet funding",
            },
          },
        },

        VerifyPaymentRequest: {
          type: "object",
          required: ["reference"],
          properties: {
            reference: {
              type: "string",
              example: "PAY_123456789",
            },
          },
        },
        TransactionsSummaryQuery: {
          type: "object",
          properties: {
            from: {
              type: "string",
              format: "date",
              example: "2024-01-01",
            },
            to: {
              type: "string",
              format: "date",
              example: "2024-01-31",
            },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          properties: {
            fullName: {
              type: "string",
              example: "John Doe",
            },
            phone: {
              type: "string",
              example: "08031234567",
            },
          },
        },

        ChangePasswordRequest: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: {
              type: "string",
              example: "OldPassword123",
            },
            newPassword: {
              type: "string",
              example: "NewPassword123",
            },
          },
        },
        FundWalletRequest: {
          type: "object",
          required: ["amount"],
          properties: {
            amount: {
              type: "number",
              example: 10000,
            },
          },
        },

        WithdrawRequest: {
          type: "object",
          required: ["amount", "method"],
          properties: {
            amount: {
              type: "number",
              example: 5000,
            },
            method: {
              type: "string",
              example: "bank_transfer",
            },
          },
        },

        TransferRequest: {
          type: "object",
          required: ["recipientId", "amount"],
          properties: {
            recipientId: {
              type: "string",
              example: "64f2a0c9b8a1e90012abcd34",
            },
            amount: {
              type: "number",
              example: 2000,
            },
          },
        },

      },
    },
  },

  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  console.log("Swagger setup loaded");

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
}

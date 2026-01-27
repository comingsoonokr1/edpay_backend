import dotenv from "dotenv";
dotenv.config();

import axios, { AxiosInstance } from "axios";
import { ApiError } from "../shared/errors/api.error.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const BASE_URL =
    process.env.NODE_ENV === "production"
        ? "https://api.safehavenmfb.com"
        : "https://api.sandbox.safehavenmfb.com";

const CLIENT_ID = process.env.SAFEHAVEN_CLIENT_ID!;
const PRIVATE_KEY = process.env.SAFE_HAVEN_PRIVATE_KEY!; // RSA PRIVATE KEY

interface TokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
}

export class SafeHavenProvider {
    private static axiosInstance: AxiosInstance | null = null;
    private static tokenExpiry = 0;

    /**
     * Generate OAuth2 Client Assertion (JWT Bearer)
     */
    private static generateClientAssertion(): string {
        const now = Math.floor(Date.now() / 1000);

        return jwt.sign(
            {
                iss: CLIENT_ID,
                sub: CLIENT_ID,
                aud: `${BASE_URL}/oauth2/token`,
                iat: now,
                exp: now + 300, // max 5 minutes
                jti: crypto.randomUUID(),
            },
            PRIVATE_KEY.replace(/\\n/g, "\n"), // important for env vars
            { algorithm: "RS256" }
        );
    }

    /**
     * Fetch / refresh Safe Haven access token
     */
    private static async refreshAccessToken(): Promise<string> {
        try {
            const clientAssertion = this.generateClientAssertion();

            const response = await axios.post<TokenResponse>(
                `${BASE_URL}/oauth2/token`,
                new URLSearchParams({
                    grant_type: "client_credentials",
                    client_id: CLIENT_ID,
                    client_assertion: clientAssertion,
                    client_assertion_type:
                        "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                }).toString(),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const { access_token, expires_in } = response.data;

            this.tokenExpiry = Date.now() + expires_in * 1000 - 30_000;
            return access_token;
        } catch (err: any) {
            throw new ApiError(
                500,
                `Safe Haven auth failed: ${err.response?.data?.error_description ||
                err.response?.data?.error ||
                err.message
                }`
            );
        }
    }

    /**
     * Axios instance with auto token refresh
     */
    private static async getAuthorizedInstance(): Promise<AxiosInstance> {
        const now = Date.now();

        if (!this.axiosInstance || now >= this.tokenExpiry) {
            const token = await this.refreshAccessToken();

            this.axiosInstance = axios.create({
                baseURL: BASE_URL,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
        }

        return this.axiosInstance;
    }

    /**
     * Create Individual Sub-Account
     */
    static async createSubAccount(data: {
        email: string;
        phone: string;
        externalReference?: string;
        identityType: "BVN" | "NIN" | "vNIN" | "BVNUSSD" | "vID";
        identityNumber?: string; // BVN / NIN
        identityId: string;      // REQUIRED
        otp?: string;
        callbackUrl?: string;
        autoSweep?: boolean;
        autoSweepDetails?: {
            schedule: "Instant" | "Daily";
        };
    }) {
        const api = await this.getAuthorizedInstance();

        try {
            const externalReference =
                data.externalReference || crypto.randomUUID();

            const payload: Record<string, any> = {
                phoneNumber: data.phone.startsWith("+")
                    ? data.phone
                    : `+${data.phone}`,
                emailAddress: data.email,
                externalReference,
                identityType: data.identityType,
                identityId: data.identityId,
            };

            if (data.identityNumber) {
                payload.identityNumber = data.identityNumber;
            }

            if (data.otp) payload.otp = data.otp;
            if (data.callbackUrl) payload.callbackUrl = data.callbackUrl;

            if (typeof data.autoSweep === "boolean") {
                payload.autoSweep = data.autoSweep;
                if (data.autoSweepDetails) {
                    payload.autoSweepDetails = data.autoSweepDetails;
                }
            }

            const response = await api.post(
                "/accounts/v2/subaccount",
                payload
            );

            return response.data;
        } catch (err: any) {
            throw new ApiError(
                err.response?.status || 500,
                `Safe Haven sub-account creation failed: ${err.response?.data?.message ||
                err.response?.data?.error ||
                err.message
                }`
            );
        }
    }

    //Get Airtime provider
    static async getAirtimeProviders() {
        const api = await this.getAuthorizedInstance();

        // 1️ Get all services
        const servicesRes = await api.get("/vas/services", {
            headers: {
                ClientID: CLIENT_ID, // Add this metadata
            },
        });
        console.log(servicesRes);
        const airtimeService = servicesRes.data.find(
            (s: any) => s.name.toLowerCase() === "airtime"
        );

        if (!airtimeService) throw new ApiError(404, "Airtime service not found");

        // 2️ Get categories for the Airtime service
        const categoriesRes = await api.get(`/vas/service/${airtimeService._id}/service-categories`);
        const categories = categoriesRes.data;

        // 3️ Optionally, fetch products under each category
        const providers = await Promise.all(
            categories.map(async (cat: any) => {
                const productsRes = await api.get(`/vas/service-category/${cat._id}/products`);
                const product = productsRes.data[0]; // pick first product as representative
                return {
                    code: cat.name.split(" ")[0].toUpperCase(), // e.g., MTN, GLO
                    name: cat.name,
                    id: cat._id, // serviceCategoryId
                    productId: product?._id,
                };
            })
        );

        return providers;
    }



    /**
     * Purchase Airtime
     */
    static async purchaseAirtime(payload: {
        serviceCategoryId: string;
        phone: string;
        amount: number;
        reference: string;
        debitAccountNumber: string; // mandatory
        statusUrl?: string; // optional
    }) {
        const api = await this.getAuthorizedInstance();

        try {
            const response = await api.post("/vas/pay/airtime", {
                serviceCategoryId: payload.serviceCategoryId,
                amount: payload.amount,
                channel: "WEB",
                debitAccountNumber: payload.debitAccountNumber, // your funding account
                phoneNumber: payload.phone,
                statusUrl: payload.statusUrl, // optional callback
                metadata: {
                    reference: payload.reference,
                },
            });


            return response.data;
        } catch (err: any) {
            throw new ApiError(
                err.response?.status || 500,
                `Airtime purchase failed: ${err.response?.data?.message ||
                err.response?.data?.error ||
                err.message
                }`
            );
        }
    }

    //  verify  checkout provider
    static async verifyCheckout(reference: string) {
        const api = await this.getAuthorizedInstance();

        const response = await api.get(`/checkout/verify/${reference}`);
        return response.data;
    }


    static async getDataProviders() {
        const api = await this.getAuthorizedInstance();

        // 1️⃣ Get all services
        const servicesRes = await api.get("/vas/services", {
            headers: {
                ClientID: CLIENT_ID, // Add this metadata
            },
        });
        console.log(servicesRes);
        const dataService = servicesRes.data.find(
            (s: any) => s.name.toLowerCase() === "data purchase"
        );

        if (!dataService) throw new ApiError(404, "Data service not found");

        // 2️⃣ Get categories for the Data service
        const categoriesRes = await api.get(`/vas/service/${dataService._id}/service-categories`);
        const categories = categoriesRes.data;

        // 3️⃣ Optionally fetch products under each category
        const providers = await Promise.all(
            categories.map(async (cat: any) => {
                const productsRes = await api.get(`/vas/service-category/${cat._id}/products`);
                const product = productsRes.data[0]; // pick first product as representative
                return {
                    code: cat.name.split(" ")[0].toLowerCase(), // e.g., "mtn", "airtel"
                    name: cat.name,
                    id: cat._id, // serviceCategoryId
                    productId: product?._id,
                };
            })
        );

        return providers;
    }

    /**
     * Get Data plans for a specific provider
     */
    static async getDataPlans(serviceCategoryId: string) {
        const api = await this.getAuthorizedInstance();

        const productsRes = await api.get(`/vas/service-category/${serviceCategoryId}/products`);
        const products = productsRes.data;

        if (!products.length) {
            throw new ApiError(404, "No data plans found for this provider");
        }

        // Map products into a simple plan format
        return products.map((p: any) => ({
            bundleCode: p.bundleCode,
            name: p.name,
            amount: p.amount,
            id: p._id,
        }));
    }

    /**
     * Purchase a Data bundle
     */
    static async purchaseData(payload: {
        serviceCategoryId: string;
        phone: string;
        bundleCode: string; // specific plan code
        amount: number;
        debitAccountNumber: string;
        reference: string;
        statusUrl?: string;
    }) {
        const api = await this.getAuthorizedInstance();

        try {
            const response = await api.post("/vas/pay/data", {
                serviceCategoryId: payload.serviceCategoryId,
                bundleCode: payload.bundleCode,
                amount: payload.amount,
                channel: "WEB",
                debitAccountNumber: payload.debitAccountNumber,
                phoneNumber: payload.phone,
                statusUrl: payload.statusUrl,
                metadata: {
                    reference: payload.reference,
                },
            });

            return response.data;
        } catch (err: any) {
            throw new ApiError(
                err.response?.status || 500,
                `Data purchase failed: ${err.response?.data?.message ||
                err.response?.data?.error ||
                err.message
                }`
            );
        }
    }



    // banks
    // in safehaven.provider.ts
    static async getBanks() {
        const api = await this.getAuthorizedInstance();
        const response = await api.get("/transfers/banks");
        return response.data; // returns the list of banks
    }


    static async nameEnquiry(bankCode: string, accountNumber: string) {
        const api = await this.getAuthorizedInstance();
        const response = await api.post("/transfers/name-enquiry", {
            bankCode,
            accountNumber,
            clientId: CLIENT_ID, // metadata as per SafeHaven docs
        });
        return response.data; // includes sessionId
    }

    static async transfer(payload: {
        nameEnquiryReference: string;
        debitAccountNumber: string;
        beneficiaryBankCode: string;
        beneficiaryAccountNumber: string;
        amount: number;
        saveBeneficiary?: boolean;
        narration?: string;
        paymentReference?: string;
    }) {
        const api = await this.getAuthorizedInstance();

        const fullPayload = {
            ...payload,
            clientId: CLIENT_ID,
        };

        const response = await api.post("/transfers", fullPayload);
        return response.data;
    }


    /**
 * Check the status of a transfer
 * Either sessionId or paymentReference must be provided
 */
    static async transferStatus(params: { sessionId?: string; paymentReference?: string }) {
        const { sessionId, paymentReference } = params;

        if (!sessionId && !paymentReference) {
            throw new ApiError(400, "Either sessionId or paymentReference is required");
        }

        try {
            const api = await this.getAuthorizedInstance();

            const payload: Record<string, string> = {};
            if (sessionId) payload.sessionId = sessionId;
            if (paymentReference) payload.paymentReference = paymentReference;

            const response = await api.post("/transfers/status", {
                ...payload,
                clientId: CLIENT_ID,
            });

            return response.data; // includes status, queued, limitExceeded, etc.
        } catch (err: any) {
            throw new ApiError(
                err.response?.status || 500,
                `Safe Haven transfer status check failed: ${err.response?.data?.message || err.message}`
            );
        }
    }


    /**
 * Fetch VAS providers by category: tv, electricity, education
 */
    static async getVASProviders(category: "tv" | "electricity" | "education") {
        const api = await this.getAuthorizedInstance();

        try {
            // 1️⃣ Get all VAS services
            const servicesRes = await api.get("/vas/services", {
                headers: {
                    ClientID: CLIENT_ID, // Add this metadata
                },
            });
            console.log(servicesRes);
            const service = servicesRes.data.find((s: any) =>
                s.name.toLowerCase().includes(category)
            );

            if (!service) throw new ApiError(404, `${category} service not found`);

            // 2️⃣ Get categories under the service
            const categoriesRes = await api.get(
                `/vas/service/${service._id}/service-categories`
            );
            const categories = categoriesRes.data;

            // 3️⃣ Map providers
            const providers = await Promise.all(
                categories.map(async (cat: any) => {
                    // Optionally fetch first product for representative info
                    const productsRes = await api.get(
                        `/vas/service-category/${cat._id}/products`
                    );
                    const product = productsRes.data[0];

                    return {
                        id: cat._id, // serviceCategoryId
                        name: cat.name,
                        code: cat.name.split(" ")[0].toUpperCase(), // e.g., DSTV, IK-ELECTRIC
                        type: product?.type || null, // prepaid/postpaid or null
                        productId: product?._id,
                    };
                })
            );

            return providers;
        } catch (err: any) {
            throw new ApiError(
                err.response?.status || 500,
                `Failed to fetch ${category} providers: ${err.response?.data?.message || err.message}`
            );
        }
    }

    /**
     * Fetch products/plans under a specific provider (serviceCategoryId)
     * e.g., TV bundles or electricity plans
     */
    static async getProviderProducts(serviceCategoryId: string) {
        const api = await this.getAuthorizedInstance();

        try {
            const res = await api.get(`/vas/service-category/${serviceCategoryId}/products`);
            const products = res.data;

            if (!products.length) {
                throw new ApiError(404, "No products found for this provider");
            }

            // Map into simplified plan structure
            return products.map((p: any) => ({
                id: p._id,
                name: p.name,
                amount: p.amount,
                bundleCode: p.bundleCode,
                type: p.type || null,
            }));
        } catch (err: any) {
            throw new ApiError(
                err.response?.status || 500,
                `Failed to fetch provider products: ${err.response?.data?.message || err.message}`
            );
        }
    }


    // In SafeHavenProvider
    static async payBill(payload: {
        serviceCategoryId: string;
        amount: number;
        debitAccountNumber: string;
        customerId: string;         // cardNumber for TV, meterNumber for Utility
        bundleCode?: string;        // for TV subscription
        vendType?: string;          // for Utility payment
        channel?: "WEB" | "POS" | "ATM";
        statusUrl?: string;
    }) {
        const api = await this.getAuthorizedInstance();

        try {
            // Determine endpoint
            let endpoint = "";
            const body: any = {
                serviceCategoryId: payload.serviceCategoryId,
                amount: payload.amount,
                channel: payload.channel || "WEB",
                debitAccountNumber: payload.debitAccountNumber,
                statusUrl: payload.statusUrl,
                metadata: { clientId: CLIENT_ID },
            };

            if (payload.bundleCode) {
                // Cable TV subscription
                endpoint = "/vas/pay/cable-tv";
                body.cardNumber = payload.customerId;
                body.bundleCode = payload.bundleCode;
            } else if (payload.vendType) {
                // Utility bill payment
                endpoint = "/vas/pay/utility";
                body.meterNumber = payload.customerId;
                body.vendType = payload.vendType;
            } else {
                throw new ApiError(400, "Cannot determine bill type. Provide bundleCode or vendType.");
            }

            const response = await api.post(endpoint, body);
            return response.data;
        } catch (err: any) {
            throw new ApiError(
                err.response?.status || 500,
                `Bill payment failed: ${err.response?.data?.message || err.message}`
            );
        }
    }



    static async initiateVerification(payload: {
  type: "BVN" | "NIN" | "vNIN" | "BVNUSSD" | "CAC" | "CREDITCHECK";
  number?: string;                 // BVN / NIN
  debitAccountNumber?: string;     // Required for BVN
  otp?: string;                    // Only for BVNUSSD
  provider?: "creditRegistry" | "firstCentral"; // CREDITCHECK
  async?: boolean;
}) {
  const api = await this.getAuthorizedInstance();

  try {
    const response = await api.post(
      "/identity/v2",
      {
        ...payload,
        async: payload.async ?? true,
      },
      {
        headers: {
          ClientID: CLIENT_ID,
        },
      }
    );

    return response.data; // contains _id (identityId)
  } catch (err: any) {
    throw new ApiError(
      err.response?.status || 500,
      `SafeHaven identity initiation failed: ${
        err.response?.data?.message || err.message
      }`
    );
  }
}

static async validateVerification(payload: {
  identityId: string;
  type: "BVN" | "NIN";
  otp: string;
}) {
  const api = await this.getAuthorizedInstance();

  try {
    const response = await api.post(
      "/identity/v2/validate",
      {
        identityId: payload.identityId,
        type: payload.type,
        otp: payload.otp,
      },
      {
        headers: {
          ClientID: CLIENT_ID,
        },
      }
    );

    return response.data; // status: VERIFIED + verified data
  } catch (err: any) {
    throw new ApiError(
      err.response?.status || 500,
      `SafeHaven identity validation failed: ${
        err.response?.data?.message || err.message
      }`
    );
  }
}


}

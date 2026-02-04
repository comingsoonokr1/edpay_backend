import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { ApiError } from "../shared/errors/api.error.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
const BASE_URL = "https://api.safehavenmfb.com";
// process.env.NODE_ENV === "production"
//     ? "https://api.safehavenmfb.com"
//     : "https://api.sandbox.safehavenmfb.com";
const CLIENT_ID = process.env.SAFEHAVEN_CLIENT_ID;
const PRIVATE_KEY = process.env.SAFE_HAVEN_PRIVATE_KEY; // RSA PRIVATE KEY
export class SafeHavenProvider {
    /**
     * Generate OAuth2 Client Assertion (JWT Bearer)
     */
    static generateClientAssertion() {
        const now = Math.floor(Date.now() / 1000);
        return jwt.sign({
            iss: "https://edpays.online",
            sub: CLIENT_ID,
            aud: "https://api.safehavenmfb.com",
            iat: now,
            exp: now + 300, // max 5 minutes
        }, PRIVATE_KEY.replace(/\\n/g, "\n"), // important for env vars
        { algorithm: "RS256" });
    }
    /**
     * Fetch / refresh Safe Haven access token
     */
    static async refreshAccessToken() {
        try {
            const clientAssertion = this.generateClientAssertion();
            const response = await axios.post(`${BASE_URL}/oauth2/token`, new URLSearchParams({
                grant_type: "client_credentials",
                client_id: CLIENT_ID,
                client_assertion: clientAssertion,
                client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            }).toString(), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            const { access_token, expires_in } = response.data;
            this.tokenExpiry = Date.now() + expires_in * 1000 - 300000;
            return access_token;
        }
        catch (err) {
            throw new ApiError(500, `Safe Haven auth failed: ${err.response?.data?.error_description ||
                err.response?.data?.error ||
                err.message}`);
        }
    }
    /**
     * Axios instance with auto token refresh
     */
    static async getAuthorizedInstance() {
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
    static async createSubAccount(data) {
        const api = await this.getAuthorizedInstance();
        try {
            const externalReference = data.externalReference || crypto.randomUUID();
            const payload = {
                phoneNumber: data.phone.startsWith("+")
                    ? data.phone
                    : `+${data.phone}`,
                emailAddress: data.email,
                externalReference,
                identityType: "vID",
                // identityNumber: data.identityNumber || "22728319473",
                identityId: data.identityId,
                otp: data.otp
            };
            if (data.identityNumber) {
                payload.identityNumber = data.identityNumber;
            }
            if (data.otp)
                payload.otp = data.otp;
            if (data.callbackUrl)
                payload.callbackUrl = data.callbackUrl;
            if (typeof data.autoSweep === "boolean") {
                payload.autoSweep = data.autoSweep;
                if (data.autoSweepDetails) {
                    payload.autoSweepDetails = data.autoSweepDetails;
                }
            }
            const response = await api.post("/accounts/v2/subaccount", payload, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            console.log("REsponse", response.data);
            return response.data;
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `Safe Haven sub-account creation failed: ${err.response?.data?.message ||
                err.response?.data?.error ||
                err.message}`);
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
        const airtimeService = servicesRes.data.data.find((s) => s.identifier.toLowerCase() === "airtime");
        if (!airtimeService)
            throw new ApiError(404, "Airtime service not found");
        // 2️ Get categories for the Airtime service
        const categoriesRes = await api.get(`/vas/service/${airtimeService._id}/service-categories`, {
            headers: {
                ClientID: CLIENT_ID, // Add this metadata
            },
        });
        const providers = categoriesRes.data.data.map((cat) => ({
            code: cat.name.split(" ")[0].toUpperCase(),
            name: cat.name,
            id: cat._id,
        }));
        console.log(providers);
        return providers;
    }
    /**
     * Purchase Airtime
     */
    static async purchaseAirtime(payload) {
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
            }, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            return response.data;
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `Airtime purchase failed: ${err.response?.data?.message ||
                err.response?.data?.error ||
                err.message}`);
        }
    }
    //  verify  checkout provider
    static async verifyCheckout(reference) {
        const api = await this.getAuthorizedInstance();
        const response = await api.get(`/checkout/verify/${reference}`, {
            headers: {
                ClientID: CLIENT_ID,
            },
        });
        return response.data;
    }
    static async getDataProviders() {
        const api = await this.getAuthorizedInstance();
        //  Get all services
        const servicesRes = await api.get("/vas/services", {
            headers: {
                ClientID: CLIENT_ID, // Add this metadata
            },
        });
        console.log(servicesRes.data.data);
        const dataService = servicesRes.data.data.find((s) => s.identifier.toLowerCase() === "data");
        if (!dataService)
            throw new ApiError(404, "Data service not found");
        //  Get categories for the Data service
        const categoriesRes = await api.get(`/vas/service/${dataService._id}/service-categories`, {
            headers: {
                ClientID: CLIENT_ID,
            },
        });
        const categories = categoriesRes.data.data;
        const providers = categories.map((cat) => ({
            code: cat.name.split(" ")[0].toUpperCase(),
            name: cat.name,
            id: cat._id,
        }));
        return providers;
    }
    /**
     * Get Data plans for a specific provider
     */
    static async getDataPlans(serviceCategoryId) {
        const api = await this.getAuthorizedInstance();
        const productsRes = await api.get(`/vas/service-category/${serviceCategoryId}/products`, {
            headers: {
                ClientID: CLIENT_ID,
            },
        });
        const products = productsRes.data.data;
        if (!products.length) {
            throw new ApiError(404, "No data plans found for this provider");
        }
        // Map products into a simple plan format
        return products.map((p) => ({
            validity: p.validity,
            bundleCode: p.bundleCode,
            name: p.name,
            amount: p.amount,
            id: p._id,
        }));
    }
    /**
     * Purchase a Data bundle
     */
    static async purchaseData(payload) {
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
            }, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            return response.data;
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `Data purchase failed: ${err.response?.data?.message ||
                err.response?.data?.error ||
                err.message}`);
        }
    }
    // banks
    // in safehaven.provider.ts
    static async getBanks() {
        const api = await this.getAuthorizedInstance();
        const response = await api.get("/transfers/banks", {
            headers: {
                ClientID: CLIENT_ID,
            },
        });
        return response.data.data; // returns the list of banks
    }
    static async nameEnquiry(bankCode, accountNumber) {
        const api = await this.getAuthorizedInstance();
        const response = await api.post("/transfers/name-enquiry", {
            bankCode,
            accountNumber,
        }, {
            headers: {
                ClientID: CLIENT_ID,
            },
        });
        return response.data.data; // includes sessionId
    }
    // transfer to other banks
    static async transfer(payload) {
        const api = await this.getAuthorizedInstance();
        const response = await api.post("/transfers", payload, {
            headers: {
                ClientID: CLIENT_ID,
            },
        });
        return response.data.data;
    }
    /**
 * Check the status of a transfer
 * Either sessionId or paymentReference must be provided
 */
    static async transferStatus(params) {
        const { sessionId, paymentReference } = params;
        if (!sessionId && !paymentReference) {
            throw new ApiError(400, "Either sessionId or paymentReference is required");
        }
        try {
            const api = await this.getAuthorizedInstance();
            const payload = {};
            if (sessionId)
                payload.sessionId = sessionId;
            if (paymentReference)
                payload.paymentReference = paymentReference;
            const response = await api.post("/transfers/status", payload, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            return response.data.data; // includes status, queued, limitExceeded, etc.
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `Safe Haven transfer status check failed: ${err.response?.data?.message || err.message}`);
        }
    }
    static async getVASProviders(category) {
        const api = await this.getAuthorizedInstance();
        try {
            // 1️⃣ Get all VAS services
            const servicesRes = await api.get("/vas/services", {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            const services = servicesRes.data?.data || servicesRes.data;
            const identifier = this.VAS_SERVICE_MAP[category];
            if (!identifier)
                throw new ApiError(400, `Invalid category: ${category}`);
            const service = services.find((s) => s.identifier === identifier);
            if (!service)
                throw new ApiError(404, `${category} service not found`);
            // 2️⃣ Get categories under the service
            const categoriesRes = await api.get(`/vas/service/${service._id}/service-categories`, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            const categories = categoriesRes.data.data;
            console.log(categories);
            const providers = categories.map((cat) => ({
                id: cat._id,
                name: cat.name,
                code: cat.identifier.toUpperCase(),
            }));
            return providers;
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `Failed to fetch ${category} providers: ${err.response?.data?.message || err.message}`);
        }
    }
    /**
     * Fetch products/plans under a specific provider (serviceCategoryId)
     * e.g., TV bundles or electricity plans
     */
    static async getProviderProducts(serviceCategoryId) {
        const api = await this.getAuthorizedInstance();
        try {
            const res = await api.get(`/vas/service-category/${serviceCategoryId}/products`, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            const products = res.data.data;
            console.log(products);
            if (!products.length) {
                throw new ApiError(404, "No products found for this provider");
            }
            // Map into simplified plan structure
            return products.map((p) => ({
                id: p._id,
                name: p.name,
                amount: p.amount,
                bundleCode: p.bundleCode,
                type: p.type || null,
            }));
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `Failed to fetch provider products: ${err.response?.data?.message || err.message}`);
        }
    }
    // In SafeHavenProvider
    static async payBill(payload) {
        const api = await this.getAuthorizedInstance();
        try {
            // Determine endpoint
            let endpoint = "";
            const body = {
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
            }
            else if (payload.vendType) {
                // Utility bill payment
                endpoint = "/vas/pay/utility";
                body.meterNumber = payload.customerId;
                body.vendType = payload.vendType;
            }
            else {
                throw new ApiError(400, "Cannot determine bill type. Provide bundleCode or vendType.");
            }
            const response = await api.post(endpoint, body, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            return response.data;
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `Bill payment failed: ${err.response?.data?.message || err.message}`);
        }
    }
    static async initiateVerification(payload) {
        const api = await this.getAuthorizedInstance();
        try {
            const response = await api.post("/identity/v2", {
                ...payload,
                async: payload.async ?? false,
            }, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            return response.data; // contains _id (identityId)
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `SafeHaven identity initiation failed: ${err.response?.data?.message || err.message}`);
        }
    }
    static async validateVerification(payload) {
        const api = await this.getAuthorizedInstance();
        try {
            const response = await api.post("/identity/v2/validate", {
                identityId: payload.identityId,
                type: payload.type,
                otp: payload.otp,
            }, {
                headers: {
                    ClientID: CLIENT_ID,
                },
            });
            return response.data; // status: VERIFIED + verified data
        }
        catch (err) {
            throw new ApiError(err.response?.status || 500, `SafeHaven identity validation failed: ${err.response?.data?.message || err.message}`);
        }
    }
    // get account
    static async getAccount(accountId) {
        const api = await this.getAuthorizedInstance();
        const response = await api.get(`/accounts/${accountId}`, {
            headers: {
                ClientID: CLIENT_ID,
            },
        });
        return response.data.data;
    }
}
SafeHavenProvider.axiosInstance = null;
SafeHavenProvider.tokenExpiry = 0;
/**
* Fetch VAS providers by category: tv, electricity, education
*/
SafeHavenProvider.VAS_SERVICE_MAP = {
    tv: "CABLETV",
    electricity: "UTILITY",
};

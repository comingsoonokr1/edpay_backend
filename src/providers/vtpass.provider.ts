import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import {
  AirtimePurchasePayload,
  BillPaymentPayload,
  DataPurchasePayload,
} from "./provider.types.js";

const VTPASS_BASE_URL = "https://api-service.vtpass.com/api";
const API_KEY = process.env.VTPASS_API_KEY!; 

const axiosInstance = axios.create({
  baseURL: VTPASS_BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`, 
  },
});

export class VTPassProvider {
  static async purchaseAirtime(payload: AirtimePurchasePayload) {
    const { data } = await axiosInstance.post("/pay", payload);
    return data;
  }

  static async payBill(payload: BillPaymentPayload) {
    const { data } = await axiosInstance.post("/pay", payload);
    return data;
  }

  static async getDataPlans(serviceID: string) {
    const { data } = await axiosInstance.get(`/service-variations?serviceID=${serviceID}`);
    return data;
  }

  static async purchaseData(payload: DataPurchasePayload) {
    const { data } = await axiosInstance.post("/pay", payload);
    return data;
  }

   static async getCategoryBillers(category: "tv" | "electricity") {
    // Map your category to VTpass expected API category identifiers
    const categoryMap: Record<string, string> = {
      tv: "tv-subscription",
      electricity: "electricity-bill", // Note: Corrected from "electricity-bills" to "electricity-bill" based on VTpass docs
    };

    const vtpassCategory = categoryMap[category];
    if (!vtpassCategory) {
      throw new Error("Invalid category");
    }

    const { data } = await axiosInstance.get(`/services?identifier=${vtpassCategory}`);
    return data;
  }
}
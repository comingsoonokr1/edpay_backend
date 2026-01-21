export interface AirtimePurchasePayload {
  serviceID: string;
  phone: string;
  amount: number;
  request_id: string;
}

export interface BillPaymentPayload {
  serviceID: string;
  billersCode: string;
  variation_code?: string;
  amount: number;
  request_id: string;
}


export interface DataPlansResponse {
  code: string;
  content: {
    ServiceName: string;
    serviceID: string;
    variations: {
      variation_code: string;
      name: string;
      variation_amount: string;
      fixedPrice: string;
    }[];
  };
}

export interface DataPurchasePayload {
  request_id: string;
  serviceID: string;
  billersCode: string; // phone number
  variation_code: string; // plan ID
  amount: string | number;
}

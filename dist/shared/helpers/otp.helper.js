import axios from "axios";
export const sendOTPSMS = async (phoneNumber, otp) => {
    const formattedPhone = phoneNumber.startsWith("0")
        ? `234${phoneNumber.slice(1)}`
        : phoneNumber;
    const payload = {
        to: formattedPhone,
        from: "EdPays",
        sms: `Your EdPays verification code is ${otp}. It expires in 10 minutes.`,
        type: "plain",
        channel: "generic",
        api_key: process.env.TERMII_API_KEY,
    };
    await axios.post("https://v3.api.termii.com/api/sms/send", payload);
};
// import axios from 'axios';
// export const sendOTPSMS = async (phoneNumber: string, otp: string): Promise<void> => {
//   const TERMII_API_KEY = process.env.TERMII_API_KEY;
//   const TERMII_BASE_URL = "https://api.ng.termii.com/api/sms/send";
//   // 1. Format number: remove all non-digits (Termii wants 23481...)
//   const formattedNumber = phoneNumber.replace(/\D/g, "");
//   const payload = {
//     api_key: TERMII_API_KEY,
//     to: formattedNumber,
//     from: "Termii", 
//     sms: `Your EDPay code is ${otp}`,
//     type: "plain",
//     channel: "generic", // Switched to generic for initial testing
//   };
//   // --- DEBUG LOGGING START ---
//   console.log("======= TERMII DEBUG START =======");
//   console.log("URL:", TERMII_BASE_URL);
//   console.log("Payload:", JSON.stringify(payload, null, 2));
//   console.log("API Key Length:", TERMII_API_KEY?.length);
//   console.log("API Key Preview:", TERMII_API_KEY ? `${TERMII_API_KEY.substring(0, 5)}...` : "MISSING");
//   console.log("======= TERMII DEBUG END =======");
//   // --- DEBUG LOGGING END ---
//   try {
//     const response = await axios.post(TERMII_BASE_URL, payload, {
//       headers: { 'Content-Type': 'application/json' }
//     });
//     console.log("Termii Raw Response:", response.data);
//     return;
//   } catch (error: any) {
//     if (error.response) {
//       // The request was made and the server responded with a status code
//       console.error("Termii API Rejected Request:", error.response.data);
//     } else if (error.request) {
//       // The request was made but no response was received
//       console.error("No response from Termii. Check internet/firewall.");
//     } else {
//       console.error("Request Error:", error.message);
//     }
//     throw new Error("Failed to send SMS via Termii");
//   }
// };

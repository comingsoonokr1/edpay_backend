import axios from "axios";
export const sendOTPSMS = async (phoneNumber, otp) => {
    const formattedPhone = phoneNumber.startsWith("0")
        ? `234${phoneNumber.slice(1)}`
        : phoneNumber;
    const payload = {
        to: formattedPhone,
        from: "EdPay",
        sms: `Your EdPay verification code is ${otp}. It expires in 10 minutes.`,
        type: "plain",
        channel: "generic",
        api_key: process.env.TERMII_API_KEY,
    };
    await axios.post("https://v3.api.termii.com/api/sms/send", payload);
};

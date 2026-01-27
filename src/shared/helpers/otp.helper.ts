import axios from "axios";

export const sendOTPSMS = async (
  phoneNumber: string,
  otp: string
) => {
  const payload = {
    to: phoneNumber,
    from: "EdPays",
    sms: `Your EdPays verification code is ${otp}. It expires in 10 minutes.`,
    type: "plain",
    channel: "generic",
    api_key: process.env.TERMII_API_KEY,
  };

  await axios.post(
    "https://v3.api.termii.com/api/sms/send",
    payload
  );
};

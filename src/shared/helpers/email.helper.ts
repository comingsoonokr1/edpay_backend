import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: `"EasyPay" <no-reply@easypay.com>`,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Email Verification</h2>
      <h1>${otp}</h1>
      <p>Expires in 10 minutes</p>
    `,
  });
}

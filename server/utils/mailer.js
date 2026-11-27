import nodemailer from "nodemailer";

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendResetCodeEmail({ to, code }) {
  if (!isSmtpConfigured()) {
    console.log(`[Offerly] Password reset code for ${to}: ${code}`);
    return { emailSent: false, devCode: code };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Offerly password reset code",
    text: `Your Offerly password reset code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your Offerly password reset code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
  });

  return { emailSent: true };
}

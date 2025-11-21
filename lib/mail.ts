import nodemailer from "nodemailer";

export function createMailer() {
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : undefined;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  if (!host || !port || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, auth: { user, pass } });
}

export async function sendMail(opts: { to: string; subject: string; html: string; from?: string }) {
  const transporter = createMailer();
  if (!transporter) throw new Error("Mail transport not configured");
  const from = opts.from || "noreply@example.com";
  await transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
}
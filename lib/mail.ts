import nodemailer from "nodemailer";
import { env } from "@/lib/config/env";

export function createMailer() {
  const host = env.MAIL_HOST;
  const port = env.MAIL_PORT;
  const user = env.MAIL_USER;
  const pass = env.MAIL_PASS;
  if (!host || !port || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, auth: { user, pass } });
}

export async function sendMail(opts: { to: string; subject: string; html: string; from?: string }) {
  const transporter = createMailer();
  if (!transporter) throw new Error("Mail transport not configured");
  const from = opts.from || "noreply@example.com";
  await transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
}
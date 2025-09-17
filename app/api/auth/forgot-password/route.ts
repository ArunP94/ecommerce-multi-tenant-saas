import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { sendMail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, userEmail: user.email, expiresAt },
  });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const link = `${base}/reset-password?token=${token}`;

  try {
    await sendMail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Click the link to reset your password:</p><p><a href="${link}">${link}</a></p>`,
    });
  } catch {}

  return NextResponse.json({ ok: true });
}
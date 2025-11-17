import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { sendMail } from "@/lib/mail";
import { resetPasswordEmail } from "@/lib/email-templates";
import { ApiResponse } from "@/lib/api/response-factory";
import { rateLimit } from "@/lib/redis";
import { env } from "@/lib/config/env";

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const limiterResult = await rateLimit(`forgot-password:${clientIp}`, 5, 3600);

    if (!limiterResult.allowed) {
      return ApiResponse.tooManyRequests(
        "Too many password reset requests. Please try again later."
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return ApiResponse.badRequest("Email is required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return ApiResponse.success({ ok: true }, 200);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, userEmail: user.email, expiresAt },
    });

    const base = env.NEXTAUTH_URL || "http://localhost:3000";
    const link = `${base}/reset-password?token=${token}`;

    try {
      await sendMail({
        to: user.email,
        subject: "Reset your password",
        html: resetPasswordEmail({ actionUrl: link }),
      });
    } catch (error) {
      console.error("Failed to send reset password email:", error);
    }

    return ApiResponse.success({ ok: true }, 200);
  } catch (error) {
    console.error("Forgot password error:", error);
    return ApiResponse.internalError();
  }
}

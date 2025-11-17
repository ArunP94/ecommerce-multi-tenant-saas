import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ApiResponse } from "@/lib/api/response-factory";
import { rateLimit } from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const limiterResult = await rateLimit(`reset-password:${clientIp}`, 5, 3600);

    if (!limiterResult.allowed) {
      return ApiResponse.tooManyRequests(
        "Too many password reset attempts. Please try again later."
      );
    }

    const body = await req.json().catch(() => ({}));
    const { token, password } = body;

    if (!token || typeof token !== "string" || !password || typeof password !== "string") {
      return ApiResponse.badRequest("Invalid request");
    }

    const rec = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!rec || rec.expiresAt < new Date()) {
      return ApiResponse.badRequest("Invalid or expired token");
    }

    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: rec.userId }, data: { hashedPassword: hash } });
    await prisma.passwordResetToken.delete({ where: { token } });

    return ApiResponse.success({ ok: true }, 200);
  } catch (error) {
    console.error("Reset password error:", error);
    return ApiResponse.internalError();
  }
}
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import crypto from "node:crypto";
import { sendMail } from "@/lib/mail";
import { inviteEmail } from "@/lib/email-templates";
import { ApiResponse } from "@/lib/api/response-factory";
import { rateLimit } from "@/lib/redis";
import { env } from "@/lib/config/env";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["STORE_OWNER", "STAFF"]),
  storeId: z.string(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return ApiResponse.forbidden();
    }

    const limiterResult = await rateLimit(`invite:${session.user.id}`, 20, 3600);
    if (!limiterResult.allowed) {
      return ApiResponse.tooManyRequests("Too many invitations. Please try again later.");
    }

    const json = await req.json().catch(() => ({}));
    const parsed = inviteSchema.safeParse(json);
    if (!parsed.success) {
      return ApiResponse.validationError(parsed.error);
    }
    const { email, role, storeId } = parsed.data;

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true, name: true, ownerId: true } });
    if (!store) return ApiResponse.notFound("Store not found");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.role === "SUPER_ADMIN") {
      return ApiResponse.badRequest("Cannot modify SUPER_ADMIN user");
    }

    let userId: string;
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email,
          role,
          storeId,
          hashedPassword: null,
        },
        select: { id: true },
      });
      userId = created.id;
    } else {
      const updated = await prisma.user.update({ where: { id: existing.id }, data: { role, storeId }, select: { id: true, hashedPassword: true } });
      userId = updated.id;
    }

    if (role === "STORE_OWNER" && store.ownerId !== userId) {
      await prisma.store.update({ where: { id: storeId }, data: { ownerId: userId } });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await prisma.passwordResetToken.create({ data: { token, userId, userEmail: email, expiresAt } });

    const base = env.NEXTAUTH_URL || "http://localhost:3000";
    const link = `${base}/reset-password?token=${token}`;

    try {
      await sendMail({
        to: email,
        subject: `You're invited to ${store.name}`,
        html: inviteEmail({ storeName: store.name, role, actionUrl: link }),
      });
    } catch (error) {
      console.error("Failed to send invite email:", error);
    }

    return ApiResponse.success({ ok: true, userId }, 200);
  } catch (error) {
    console.error("Invite user error:", error);
    return ApiResponse.internalError();
  }
}

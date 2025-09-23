import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import crypto from "node:crypto";
import { sendMail } from "@/lib/mail";
import { inviteEmail } from "@/lib/email-templates";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["STORE_OWNER", "STAFF"]),
  storeId: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = inviteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { email, role, storeId } = parsed.data;

  // Ensure store exists
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true, name: true, ownerId: true } });
  if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

  // Find or create user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot modify SUPER_ADMIN user" }, { status: 400 });
  }

  let userId: string;
  if (!existing) {
    const created = await prisma.user.create({
      data: {
        email,
        role, // STORE_OWNER or STAFF
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

  // If inviting as owner, set the store ownerId to this user
  if (role === "STORE_OWNER" && store.ownerId !== userId) {
    await prisma.store.update({ where: { id: storeId }, data: { ownerId: userId } });
  }

  // Create password setup/reset token and send invite email
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  await prisma.passwordResetToken.create({ data: { token, userId, userEmail: email, expiresAt } });

  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const link = `${base}/reset-password?token=${token}`;

  try {
    await sendMail({
      to: email,
      subject: `You're invited to ${store.name}`,
      html: inviteEmail({ storeName: store.name, role, actionUrl: link }),
    });
  } catch {
    // do not fail the request if email fails; the admin can resend
  }

  return NextResponse.json({ ok: true, userId });
}

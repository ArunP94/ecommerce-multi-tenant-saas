import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const name = (form.get("name") as string | null) ?? undefined;
  if (!name) return NextResponse.redirect(new URL("/admin/account", req.url));
  await prisma.user.update({ where: { id: session.user.id }, data: { name } });
  return NextResponse.redirect(new URL("/admin/account", req.url));
}
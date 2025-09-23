import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const name = (form.get("name") as string | null) ?? undefined;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: session.user.id }, data: { name } });
  return NextResponse.json({ success: true, user: { id: updated.id, name: updated.name, image: updated.image } });
}

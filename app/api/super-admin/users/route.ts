import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, storeId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const storeIds = Array.from(new Set(users.map(u => u.storeId).filter((v): v is string => typeof v === "string")));
  const stores = storeIds.length > 0
    ? await prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true } })
    : [];
  const storeMap = new Map(stores.map(s => [s.id, s.name] as const));

  const data = users.map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    storeId: u.storeId ?? null,
    storeName: u.storeId ? (storeMap.get(u.storeId) ?? null) : null,
    createdAt: u.createdAt,
  }));

  return NextResponse.json({ users: data });
}

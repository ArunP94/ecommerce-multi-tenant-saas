import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await req.json();
    const storeId = (json?.storeId as string | undefined)?.trim();
    if (!storeId) return NextResponse.json({ error: "Missing storeId" }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const role = session.user.role;
    const userStoreId = session.user.storeId ?? null;
    if (role !== "SUPER_ADMIN" && userStoreId !== storeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("current_store_id", storeId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

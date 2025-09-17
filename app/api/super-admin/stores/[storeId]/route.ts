import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { storeId: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const storeId = params.storeId;
  // Consider cascading deletes or soft-deletes in real apps.
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.store.delete({ where: { id: storeId } });
  return NextResponse.json({ ok: true });
}

// Method override via POST with _method=DELETE for HTML forms
export async function POST(req: Request, ctx: { params: { storeId: string } }) {
  const contentType = req.headers.get('content-type') || '';
  let methodOverride = '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const data = new URLSearchParams(text);
    methodOverride = (data.get('_method') || '').toUpperCase();
  }

  if (methodOverride === 'DELETE') {
    return DELETE(new Request(req.url, { method: 'DELETE' }), ctx);
  }

  return NextResponse.json({ error: 'Unsupported' }, { status: 400 });
}

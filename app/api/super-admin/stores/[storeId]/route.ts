import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";

export async function DELETE(_req: NextRequest, context: { params: Promise<{ storeId: string }> }) {
  try {
    await requireSuperAdmin();

    const { storeId } = await context.params;
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return ApiResponse.notFound("Store not found");
    }

    await prisma.store.delete({ where: { id: storeId } });
    return ApiResponse.success({ ok: true });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ storeId: string }> }) {
  const contentType = req.headers.get('content-type') || '';
  let methodOverride = '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const data = new URLSearchParams(text);
    methodOverride = (data.get('_method') || '').toUpperCase();
  }

  if (methodOverride === 'DELETE') {
    return DELETE(new Request(req.url, { method: 'DELETE' }) as unknown as NextRequest, context);
  }

  return ApiResponse.badRequest('Unsupported method override');
}

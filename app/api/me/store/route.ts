import { prisma } from "@/lib/prisma";
import { requireStoreAccess, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const storeId = (json?.storeId as string | undefined)?.trim();
    if (!storeId) return ApiResponse.badRequest("Missing storeId");

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
    if (!store) return ApiResponse.notFound("Store not found");

    await requireStoreAccess(storeId);

    const res = ApiResponse.success({ ok: true });
    res.cookies.set("current_store_id", storeId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (error) {
    return handleAuthError(error);
  }
}

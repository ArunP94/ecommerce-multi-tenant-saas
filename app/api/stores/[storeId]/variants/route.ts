import { prisma } from "@/lib/prisma";
import { requireStoreAccess, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";

export async function GET(
  _req: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await context.params;
    await requireStoreAccess(storeId);

    const variants = await prisma.variant.findMany({
      where: { product: { storeId } },
      include: { product: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });

    return ApiResponse.success({ variants });
  } catch (error) {
    return handleAuthError(error);
  }
}

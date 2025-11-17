import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";

export async function DELETE() {
  try {
    const session = await requireAuth();
    await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });
    return ApiResponse.success({ success: true });
  } catch (error) {
    return handleAuthError(error);
  }
}
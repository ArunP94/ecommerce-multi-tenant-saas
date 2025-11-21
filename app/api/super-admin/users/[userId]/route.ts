import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api/response-factory";
import { requireSuperAdmin, handleAuthError } from "@/lib/api/auth-middleware";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return ApiResponse.notFound("User not found");
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return ApiResponse.success({ message: "User deleted successfully" });
  } catch (error) {
    return handleAuthError(error);
  }
}

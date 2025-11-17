import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const form = await req.formData();
    const name = (form.get("name") as string | null) ?? undefined;
    if (!name) return ApiResponse.badRequest("Name is required");
    const updated = await prisma.user.update({ where: { id: session.user.id }, data: { name } });
    return ApiResponse.success({ user: { id: updated.id, name: updated.name, image: updated.image } });
  } catch (error) {
    return handleAuthError(error);
  }
}

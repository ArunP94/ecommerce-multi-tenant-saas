import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/api/response-factory";
import { requireStoreAccess } from "@/lib/require-store";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ storeId: string; categoryName: string }> }
) {
  try {
    const { storeId, categoryName } = await params;
    await requireStoreAccess(storeId);

    const decodedCategoryName = decodeURIComponent(categoryName);

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { settings: true },
    });

    if (!store) {
      return ApiResponse.notFound("Store not found");
    }

    const settings = ((store.settings ?? {}) as { categories?: string[] });
    const categories = settings.categories ?? [];

    if (!categories.includes(decodedCategoryName)) {
      return ApiResponse.notFound("Category not found");
    }

    const updatedCategories = categories.filter((c) => c !== decodedCategoryName);

    await prisma.store.update({
      where: { id: storeId },
      data: {
        settings: {
          ...settings,
          categories: updatedCategories,
        },
      },
    });

    return ApiResponse.success({ message: "Category deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return ApiResponse.forbidden("Unauthorized");
    }
    return ApiResponse.internalError("Internal server error");
  }
}

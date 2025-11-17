import { prisma } from "@/lib/prisma";
import { requireAuth, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";
import { uploadImageSchema } from "@/lib/validation/api-schemas";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const role = session.user.role;
    const userStoreId = session.user.storeId ?? null;

    const json = await req.json();
    const parsed = uploadImageSchema.safeParse(json);
    if (!parsed.success) return ApiResponse.validationError(parsed.error);

    const { url, altText, metadata, productId, variantId } = parsed.data;

    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return ApiResponse.notFound("Product not found");
      if (role !== "SUPER_ADMIN" && userStoreId !== product.storeId)
        return ApiResponse.forbidden();
    }
    if (variantId) {
      const variant = await prisma.variant.findUnique({ where: { id: variantId } });
      if (!variant) return ApiResponse.notFound("Variant not found");
      const product = await prisma.product.findUnique({ where: { id: variant.productId } });
      if (!product) return ApiResponse.notFound("Product not found");
      if (role !== "SUPER_ADMIN" && userStoreId !== product.storeId)
        return ApiResponse.forbidden();
    }

    const image = await prisma.image.create({
      data: {
        url,
        altText,
        metadata,
        productId: productId ?? null,
        variantId: variantId ?? null,
      },
    });

    return ApiResponse.created({ image });
  } catch (error) {
    return handleAuthError(error);
  }
}
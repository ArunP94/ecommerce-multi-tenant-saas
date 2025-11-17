import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStoreAccess, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";
import { patchVariantSchema } from "@/lib/validation/api-schemas";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ storeId: string; variantId: string }> }
) {
  try {
    const { variantId } = await context.params;
    const variant = await prisma.variant.findUnique({ where: { id: variantId }, include: { product: true } });
    if (!variant) return ApiResponse.notFound("Variant not found");

    await requireStoreAccess(variant.product.storeId);

    const json = await req.json();
    const parsed = patchVariantSchema.safeParse(json);
    if (!parsed.success) return ApiResponse.validationError(parsed.error);

    const { sku, price, inventory, trackInventory, backorder } = parsed.data;

    const attributes = {
      ...(variant.attributes as Record<string, unknown>),
      ...(trackInventory !== undefined ? { trackInventory } : {}),
      ...(backorder !== undefined ? { backorder } : {}),
    };

    const updated = await prisma.variant.update({
      where: { id: variantId },
      data: {
        ...(sku !== undefined ? { sku } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(inventory !== undefined ? { inventory } : {}),
        attributes,
      },
    });

    return ApiResponse.success({ variant: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}

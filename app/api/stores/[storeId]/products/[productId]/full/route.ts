import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireStoreAccess, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";
import { fullUpdateProductSchema } from "@/lib/validation/api-schemas";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { storeId, productId } = await context.params;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return ApiResponse.notFound("Product not found");

    await requireStoreAccess(product.storeId);

    const json = await req.json();
    const parsed = fullUpdateProductSchema.safeParse(json);
    if (!parsed.success) return ApiResponse.validationError(parsed.error);

    const { title, description, sku, price, hasVariants, categories, status, images, options, variants, currency, salePrice, saleStart, saleEnd } = parsed.data;

    if (!hasVariants && typeof price !== "number") {
      return ApiResponse.badRequest("Price is required when product has no variants.");
    }
    if (hasVariants && variants.length === 0) {
      return ApiResponse.badRequest("At least one variant is required when hasVariants is true.");
    }
    const hasAnyImages = images.length > 0 || variants.some((v) => (v.images?.length ?? 0) > 0);
    if (!hasAnyImages) {
      return ApiResponse.badRequest("At least one image (product-level or variant-level) is required.");
    }

    if (sku && sku !== product.sku) {
      const existingSku = await prisma.product.findFirst({ where: { storeId, sku } });
      if (existingSku) return ApiResponse.badRequest("A product with this SKU already exists in this store.");
    }

    const makeSku = () => `V-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const variantsWithSku = variants.map((v) => ({ ...v, sku: (v.sku?.trim() || makeSku()) }));
    const dupSet = new Set<string>();
    for (const v of variantsWithSku) {
      if (dupSet.has(v.sku)) return ApiResponse.badRequest(`Duplicate variant SKU in request: ${v.sku}`);
      dupSet.add(v.sku);
    }
    const existingCollisions = await prisma.variant.findMany({ where: { sku: { in: Array.from(dupSet) } }, select: { sku: true, productId: true, id: true } });
    const collisions = existingCollisions.filter((v) => v.productId !== productId);
    if (collisions.length > 0) return ApiResponse.badRequest(`Variant SKU(s) already exist: ${collisions.map((c) => c.sku).join(", ")}`);

    const prevVariants = await prisma.variant.findMany({ where: { productId }, select: { id: true } });
    const prevVariantIds = prevVariants.map((v) => v.id);

    if (prevVariantIds.length > 0) {
      await prisma.image.deleteMany({ where: { variantId: { in: prevVariantIds } } });
    }
    await prisma.image.deleteMany({ where: { productId, variantId: null } });
    await prisma.variant.deleteMany({ where: { productId } });

    const metadata: Record<string, unknown> = { status, options, currency };
    if (salePrice !== undefined || saleStart || saleEnd) {
      metadata.sale = {
        price: salePrice ?? null,
        start: saleStart ? new Date(saleStart) : null,
        end: saleEnd ? new Date(saleEnd) : null,
      };
    }

    const anyPrimaryAtProduct = images.some((i) => i.isPrimary);
    const productImagesCreate = images.map((img, idx) => ({
      url: img.url,
      altText: img.altText,
      metadata: {
        ...(img.metadata ?? {}),
        isPrimary: anyPrimaryAtProduct ? Boolean(img.isPrimary) : idx === 0,
        sort: typeof img.sort === "number" ? img.sort : idx,
      },
    }));

    const variantsCreate = hasVariants
      ? variantsWithSku.map((v) => {
          const anyVariantPrimary = v.images?.some((i) => i.isPrimary) ?? false;
          const imagesCreate = (v.images ?? []).map((img, idx) => ({
            url: img.url,
            altText: img.altText,
            metadata: {
              ...(img.metadata ?? {}),
              isPrimary: anyVariantPrimary ? Boolean(img.isPrimary) : idx === 0,
              sort: typeof img.sort === "number" ? img.sort : idx,
            },
          }));
          const attributes = { ...(v.attributes || {}) } as Record<string, unknown>;
          if (v.salePrice !== undefined || v.saleStart || v.saleEnd) {
            (attributes as Record<string, unknown>)["sale"] = { price: v.salePrice ?? null, start: v.saleStart ? new Date(v.saleStart) : null, end: v.saleEnd ? new Date(v.saleEnd) : null } as unknown;
          }
          return { sku: v.sku, price: v.price, inventory: v.inventory ?? 0, attributes: attributes as Prisma.InputJsonValue, images: { create: imagesCreate } };
        })
      : undefined;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        description: description ?? null,
        sku: sku ?? null,
        price: hasVariants ? null : (typeof price === "number" ? price : null),
        hasVariants,
        categories,
        metadata: metadata as Prisma.InputJsonValue,
        images: productImagesCreate.length > 0 ? { create: productImagesCreate } : undefined,
        variants: variantsCreate && variantsCreate.length > 0 ? { create: variantsCreate } : undefined,
      },
      include: { variants: true, images: true },
    });

    return ApiResponse.success({ product: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}

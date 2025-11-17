import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ApiResponse } from "@/lib/api/response-factory";
import { requireStoreAccess, requireStoreOwnerOrStaff, handleAuthError } from "@/lib/api/auth-middleware";
import { createProductSchema } from "@/lib/validation/api-schemas";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await context.params;
    await requireStoreAccess(storeId);

    const products = await prisma.product.findMany({ where: { storeId } });
    return ApiResponse.success({ products, storeId }, 200);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await context.params;
    await requireStoreAccess(storeId);
    await requireStoreOwnerOrStaff();

    const json = await req.json().catch(() => ({}));
    const parsed = createProductSchema.safeParse(json);
    if (!parsed.success) {
      return ApiResponse.validationError(parsed.error);
    }

  const {
    title,
    description,
    sku,
    price,
    hasVariants,
    categories,
    status,
    images,
    options,
    variants,
    currency,
    salePrice,
    saleStart,
    saleEnd,
  } = parsed.data;

    if (!hasVariants) {
      if (typeof price !== "number") {
        return ApiResponse.badRequest("Price is required when product has no variants.");
      }
    } else {
      if (!variants || variants.length === 0) {
        return ApiResponse.badRequest("At least one variant is required when hasVariants is true.");
      }
    }

    const hasAnyImages = (images?.length ?? 0) > 0 || (variants ?? []).some(v => (v.images?.length ?? 0) > 0);
    if (!hasAnyImages) {
      return ApiResponse.badRequest("At least one image (product-level or variant-level) is required.");
    }

    if (sku) {
      const existingSku = await prisma.product.findFirst({ where: { storeId, sku } });
      if (existingSku) {
        return ApiResponse.badRequest("A product with this SKU already exists in this store.");
      }
    }

    const makeSku = () => `V-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const variantsWithSku = (variants ?? []).map((v) => ({ ...v, sku: (v.sku?.trim() || makeSku()) }));
    const payloadSkuSet = new Set<string>();
    for (const v of variantsWithSku) {
      if (payloadSkuSet.has(v.sku)) {
        return ApiResponse.badRequest(`Duplicate variant SKU in request: ${v.sku}`);
      }
      payloadSkuSet.add(v.sku);
    }
    if (variantsWithSku.length > 0) {
      const existingVariants = await prisma.variant.findMany({ where: { sku: { in: Array.from(payloadSkuSet) } }, select: { sku: true } });
      if (existingVariants.length > 0) {
        return ApiResponse.badRequest(`Variant SKU(s) already exist: ${existingVariants.map(v => v.sku).join(", ")}`);
      }
    }

    const anyPrimaryAtProduct = images?.some(i => i.isPrimary) ?? false;
    const productImagesCreate = (images ?? []).map((img, idx) => ({
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
        const anyPrimaryAtVariant = v.images?.some(i => i.isPrimary) ?? false;
        const imagesCreate = (v.images ?? []).map((img, idx) => ({
          url: img.url,
          altText: img.altText,
          metadata: {
            ...(img.metadata ?? {}),
            isPrimary: anyPrimaryAtVariant ? Boolean(img.isPrimary) : idx === 0,
            sort: typeof img.sort === "number" ? img.sort : idx,
          },
        }));
        const attributes: Record<string, unknown> = { ...v.attributes };
        if (v.salePrice !== undefined || v.saleStart || v.saleEnd) {
          (attributes as Record<string, unknown>)["sale"] = {
            price: v.salePrice ?? null,
            start: v.saleStart ? new Date(v.saleStart) : null,
            end: v.saleEnd ? new Date(v.saleEnd) : null,
          } as unknown;
        }
        return {
          sku: v.sku,
          price: v.price,
          inventory: typeof v.inventory === "number" ? v.inventory : 0,
          attributes: attributes as Prisma.InputJsonValue,
          images: { create: imagesCreate },
        };
      })
      : undefined;

    const metadata: Record<string, unknown> = {
      status,
      options,
      currency,
    };
    if (salePrice !== undefined || saleStart || saleEnd) {
      metadata.sale = {
        price: salePrice ?? null,
        start: saleStart ? new Date(saleStart) : null,
        end: saleEnd ? new Date(saleEnd) : null,
      };
    }

    const product = await prisma.product.create({
      data: {
        storeId,
        title,
        description,
        sku: sku ?? null,
        price: hasVariants ? null : (typeof price === "number" ? price : null),
        hasVariants,
        categories,
        metadata: metadata as Prisma.InputJsonValue,
        images: productImagesCreate.length > 0 ? { create: productImagesCreate } : undefined,
        variants: variantsCreate && variantsCreate.length > 0 ? { create: variantsCreate } : undefined,
      },
    });

    return ApiResponse.created({ product, storeId });
  } catch (error) {
    return handleAuthError(error);
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ApiResponse } from "@/lib/api/response-factory";
import { requireStoreAccess, requireStoreOwnerOrStaff, handleAuthError } from "@/lib/api/auth-middleware";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  categories: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  price: z.number().optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { storeId, productId } = await context.params;
    await requireStoreAccess(storeId);

    const product = await prisma.product.findUnique({ where: { id: productId }, include: { variants: true, images: true } });
    if (!product || product.storeId !== storeId) return ApiResponse.notFound();
    return ApiResponse.success({ product }, 200);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { storeId, productId } = await context.params;
    await requireStoreAccess(storeId);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.storeId !== storeId) return ApiResponse.notFound();

    const json = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) return ApiResponse.validationError(parsed.error);

    const { title, description, sku, categories, status, price } = parsed.data;

    if (sku && sku !== product.sku) {
      const existing = await prisma.product.findFirst({ where: { storeId, sku } });
      if (existing) return ApiResponse.badRequest("A product with this SKU already exists in this store.");
    }

    const metadata = {
      ...(product.metadata as Record<string, unknown> | null) ?? {},
      ...(status ? { status } : {}),
    };

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(sku !== undefined ? { sku } : {}),
        ...(categories !== undefined ? { categories } : {}),
        ...(price !== undefined && !product.hasVariants ? { price } : {}),
        metadata,
      },
    });

    return ApiResponse.success({ product: updated }, 200);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ storeId: string; productId: string }> }
) {
  try {
    const { storeId, productId } = await context.params;
    await requireStoreAccess(storeId);
    await requireStoreOwnerOrStaff();

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, storeId: true } });
    if (!product || product.storeId !== storeId) return ApiResponse.notFound();

    const variants = await prisma.variant.findMany({ where: { productId }, select: { id: true } });
    const variantIds = variants.map(v => v.id);
    if (variantIds.length > 0) {
      await prisma.image.deleteMany({ where: { variantId: { in: variantIds } } });
    }
    await prisma.image.deleteMany({ where: { productId, variantId: null } });
    await prisma.variant.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });

    return ApiResponse.success({ ok: true }, 200);
  } catch (error) {
    return handleAuthError(error);
  }
}

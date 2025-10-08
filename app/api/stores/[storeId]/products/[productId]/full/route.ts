import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Reuse the same input structure as create for full replace update
const imageInput = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  metadata: z.any().optional(),
  isPrimary: z.boolean().optional(),
  sort: z.number().int().optional(),
});

const variantInput = z.object({
  sku: z.string().min(1),
  price: z.number().nonnegative(),
  inventory: z.number().int().min(0).default(0),
  attributes: z.record(z.string(), z.unknown()).default({}),
  images: z.array(imageInput).default([]),
  salePrice: z.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
});

const optionInput = z.object({
  name: z.string().min(1),
  type: z.enum(["color", "size", "custom"]).optional(),
  values: z.array(z.object({ value: z.string().min(1), hex: z.string().optional(), imageUrl: z.string().url().optional() })).min(1),
});

const fullUpdateSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().optional(),
  hasVariants: z.boolean().default(false),
  categories: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  images: z.array(imageInput).default([]),
  options: z.array(optionInput).default([]),
  variants: z.array(variantInput).default([]),
  currency: z.string().default("GBP"),
  salePrice: z.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ storeId: string; productId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { storeId, productId } = await context.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "SUPER_ADMIN" && userStoreId !== product.storeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = fullUpdateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { title, description, sku, price, hasVariants, categories, status, images, options, variants, currency, salePrice, saleStart, saleEnd } = parsed.data;

  if (!hasVariants && typeof price !== "number") {
    return NextResponse.json({ error: "Price is required when product has no variants." }, { status: 400 });
  }
  if (hasVariants && variants.length === 0) {
    return NextResponse.json({ error: "At least one variant is required when hasVariants is true." }, { status: 400 });
  }
  const hasAnyImages = images.length > 0 || variants.some((v) => (v.images?.length ?? 0) > 0);
  if (!hasAnyImages) {
    return NextResponse.json({ error: "At least one image (product-level or variant-level) is required." }, { status: 400 });
  }

  // SKU uniqueness per store
  if (sku && sku !== product.sku) {
    const existingSku = await prisma.product.findFirst({ where: { storeId, sku } });
    if (existingSku) return NextResponse.json({ error: "A product with this SKU already exists in this store." }, { status: 400 });
  }

  const makeSku = () => `V-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const variantsWithSku = variants.map((v) => ({ ...v, sku: (v.sku?.trim() || makeSku()) }));
  const dupSet = new Set<string>();
  for (const v of variantsWithSku) {
    if (dupSet.has(v.sku)) return NextResponse.json({ error: `Duplicate variant SKU in request: ${v.sku}` }, { status: 400 });
    dupSet.add(v.sku);
  }
  const existingCollisions = await prisma.variant.findMany({ where: { sku: { in: Array.from(dupSet) } }, select: { sku: true, productId: true, id: true } });
  const collisions = existingCollisions.filter((v) => v.productId !== productId);
  if (collisions.length > 0) return NextResponse.json({ error: `Variant SKU(s) already exist: ${collisions.map((c) => c.sku).join(", ")}` }, { status: 400 });

  // Replace strategy: delete variant images, variants, and product-level images; then recreate
  const prevVariants = await prisma.variant.findMany({ where: { productId }, select: { id: true } });
  const prevVariantIds = prevVariants.map((v) => v.id);

  if (prevVariantIds.length > 0) {
    await prisma.image.deleteMany({ where: { variantId: { in: prevVariantIds } } });
  }
  await prisma.image.deleteMany({ where: { productId, variantId: null } });
  await prisma.variant.deleteMany({ where: { productId } });

  // Build metadata
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

  return NextResponse.json({ product: updated });
}

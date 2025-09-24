import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

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
  attributes: z.record(z.any()).default({}),
  images: z.array(imageInput).default([]),
  salePrice: z.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
});

const optionInput = z.object({
  name: z.string().min(1),
  type: z.enum(["color", "size", "custom"]).optional(),
  values: z.array(z.object({
    value: z.string().min(1),
    hex: z.string().optional(),
    imageUrl: z.string().url().optional(),
  })).min(1),
});

const createProductSchema = z.object({
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

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ storeId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { storeId } = await context.params;
  if (role !== "SUPER_ADMIN" && userStoreId !== storeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await prisma.product.findMany({ where: { storeId } });
  return NextResponse.json({ products, storeId });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ storeId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { storeId } = await context.params;
  if (role !== "SUPER_ADMIN" && userStoreId !== storeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(["SUPER_ADMIN", "STORE_OWNER"].includes(role))) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = createProductSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
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

  // Basic validations
  if (!hasVariants) {
    if (typeof price !== "number") {
      return NextResponse.json({ error: "Price is required when product has no variants." }, { status: 400 });
    }
  } else {
    if (!variants || variants.length === 0) {
      return NextResponse.json({ error: "At least one variant is required when hasVariants is true." }, { status: 400 });
    }
  }

  const hasAnyImages = (images?.length ?? 0) > 0 || (variants ?? []).some(v => (v.images?.length ?? 0) > 0);
  if (!hasAnyImages) {
    return NextResponse.json({ error: "At least one image (product-level or variant-level) is required." }, { status: 400 });
  }

  // Enforce SKU uniqueness: product-level within store
  if (sku) {
    const existingSku = await prisma.product.findFirst({ where: { storeId, sku } });
    if (existingSku) {
      return NextResponse.json({ error: "A product with this SKU already exists in this store." }, { status: 400 });
    }
  }

  // Variant SKU validations: duplicates in payload and collisions in DB
  const variantSkus = (variants ?? []).map(v => v.sku).filter((s): s is string => typeof s === "string");
  const dupInPayload = new Set<string>();
  for (const s of variantSkus) {
    if (dupInPayload.has(s)) {
      return NextResponse.json({ error: `Duplicate variant SKU in request: ${s}` }, { status: 400 });
    }
    dupInPayload.add(s);
  }
  if (variantSkus.length > 0) {
    const existingVariants = await prisma.variant.findMany({ where: { sku: { in: variantSkus } }, select: { sku: true } });
    if (existingVariants.length > 0) {
      return NextResponse.json({ error: `Variant SKU(s) already exist: ${existingVariants.map(v => v.sku).join(", ")}` }, { status: 400 });
    }
  }

  // Prepare nested data
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
      ? (variants ?? []).map((v) => {
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
          attributes,
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
      metadata,
      images: productImagesCreate.length > 0 ? { create: productImagesCreate } : undefined,
      variants: variantsCreate && variantsCreate.length > 0 ? { create: variantsCreate } : undefined,
    },
  });

  return NextResponse.json({ product, storeId }, { status: 201 });
}

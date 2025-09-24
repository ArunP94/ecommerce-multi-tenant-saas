import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

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
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { storeId, productId } = await context.params;
  if (role !== "SUPER_ADMIN" && userStoreId !== storeId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const product = await prisma.product.findUnique({ where: { id: productId, /* store scoped via check */ }, include: { variants: true, images: true } });
  if (!product || product.storeId !== storeId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

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
  if (!product || (role !== "SUPER_ADMIN" && userStoreId !== product.storeId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { title, description, sku, categories, status, price } = parsed.data;

  // SKU uniqueness check within store
  if (sku && sku !== product.sku) {
    const existing = await prisma.product.findFirst({ where: { storeId, sku } });
    if (existing) return NextResponse.json({ error: "A product with this SKU already exists in this store." }, { status: 400 });
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

  return NextResponse.json({ product: updated });
}

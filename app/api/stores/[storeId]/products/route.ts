import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().optional(),
  hasVariants: z.boolean().default(false),
  categories: z.array(z.string()).default([]),
});

export async function GET(
  _req: Request,
  { params }: { params: { storeId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { storeId } = params;
  if (role !== "SUPER_ADMIN" && userStoreId !== storeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await prisma.product.findMany({ where: { storeId } });
  return NextResponse.json({ products, storeId });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { storeId } = params;
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
  const { title, description, sku, price, hasVariants, categories } = parsed.data;

  const product = await prisma.product.create({
    data: {
      storeId,
      title,
      description,
      sku,
      price: hasVariants ? null : price ?? null,
      hasVariants,
      categories,
    },
  });
  return NextResponse.json({ product, storeId }, { status: 201 });
}

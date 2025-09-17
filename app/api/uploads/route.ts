import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  metadata: z.any().optional(),
  productId: z.string().optional(),
  variantId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { url, altText, metadata, productId, variantId } = parsed.data;

  // Tenant enforcement if attaching to product/variant
  if (productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (role !== "SUPER_ADMIN" && userStoreId !== product.storeId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (variantId) {
    const variant = await prisma.variant.findUnique({ where: { id: variantId } });
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    const product = await prisma.product.findUnique({ where: { id: variant.productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (role !== "SUPER_ADMIN" && userStoreId !== product.storeId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  return NextResponse.json({ image }, { status: 201 });
}
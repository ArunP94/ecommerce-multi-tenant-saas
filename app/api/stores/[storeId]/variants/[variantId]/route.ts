import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  sku: z.string().optional(),
  price: z.number().nonnegative().optional(),
  inventory: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  backorder: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ storeId: string; variantId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { variantId } = await context.params;
  const variant = await prisma.variant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "SUPER_ADMIN" && userStoreId !== variant.product.storeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { sku, price, inventory, trackInventory, backorder } = parsed.data;

  // Merge flags into attributes JSON
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

  return NextResponse.json({ variant: updated });
}

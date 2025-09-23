export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";

export default async function StoreProductsPage({ params }: { params: Promise<{ storeId: string; }>; }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
  const storeName = store?.name ?? storeId;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Products</h1>
      <p className="text-sm text-muted-foreground">Manage products for store {storeName}.</p>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import { OrdersPageClient } from "@/components/domain/admin/orders/orders-page-client";

export default async function StoreOrdersPage({ params }: { params: Promise<{ storeId: string; }>; }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
  const storeName = store?.name ?? storeId;

  return (
    <div className="p-6">
      <OrdersPageClient storeId={storeId} />
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="text-sm text-muted-foreground">Track and fulfill orders for store {storeName}.</p>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import InventoryTable from "@/components/admin/inventory/inventory-table";
import { InventoryPageClient } from "@/components/admin/inventory/inventory-page-client";

export default async function InventoryPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const variants = await prisma.variant.findMany({
    where: { product: { storeId } },
    include: { product: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <InventoryPageClient storeId={storeId} />
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-sm text-muted-foreground">Manage stock and inventory flags per variant</p>
      </div>
      <InventoryTable storeId={storeId} initialVariants={variants} />
    </div>
  );
}

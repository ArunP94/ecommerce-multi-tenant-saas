export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import InventoryTable from "@/components/domain/admin/inventory/inventory-table";
import { InventoryPageClient } from "@/components/domain/admin/inventory/inventory-page-client";
import { PageHeader, PageSection } from "@/components/primitives";

export default async function InventoryPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const variants = await prisma.variant.findMany({
    where: { product: { storeId } },
    include: { product: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageSection>
      <InventoryPageClient storeId={storeId} />
      
      <PageHeader
        title="Inventory"
        description="Manage stock and inventory flags per variant"
      />
      
      <InventoryTable storeId={storeId} initialVariants={variants} />
    </PageSection>
  );
}

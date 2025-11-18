export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import { OrdersPageClient } from "@/components/domain/admin/orders/orders-page-client";
import { PageHeader, PageSection } from "@/components/primitives";

export default async function StoreOrdersPage({ params }: { params: Promise<{ storeId: string; }>; }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
  const storeName = store?.name ?? storeId;

  return (
    <PageSection>
      <OrdersPageClient storeId={storeId} />
      
      <PageHeader
        title="Orders"
        description={`Track and fulfill orders for store ${storeName}.`}
      />
    </PageSection>
  );
}

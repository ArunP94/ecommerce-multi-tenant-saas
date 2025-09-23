export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";

export default async function StoreOrdersPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="text-sm text-muted-foreground">Track and fulfill orders for store {params.storeId}.</p>
    </div>
  );
}

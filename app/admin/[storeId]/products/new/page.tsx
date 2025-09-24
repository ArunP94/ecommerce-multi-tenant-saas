export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/products/product-form";

export default async function NewProductPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true, settings: true } });
  const storeName = store?.name ?? storeId;
  type StoreSettings = { currency?: string; multiCurrency?: boolean; conversionRates?: Record<string, number>; categories?: string[] };
  const settings = ((store?.settings ?? {}) as StoreSettings);
  const currency = settings.currency ?? "GBP";

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Create product</h1>
        <p className="text-sm text-muted-foreground">Store: {storeName}</p>
      </div>
      <ProductForm storeId={storeId} defaultCurrency={currency} storeSettings={settings} />
    </div>
  );
}

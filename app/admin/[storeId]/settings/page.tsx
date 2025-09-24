export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import StoreSettingsForm from "@/components/admin/stores/settings-form";

export default async function StoreSettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true, name: true } });
  type StoreSettings = { currency?: string; multiCurrency?: boolean; conversionRates?: Record<string, number> };
  const settings = ((store?.settings ?? {}) as StoreSettings);

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Store settings</h1>
        <p className="text-sm text-muted-foreground">Currency and conversions for pricing previews</p>
      </div>
      <StoreSettingsForm storeId={storeId} initial={settings} />
    </div>
  );
}

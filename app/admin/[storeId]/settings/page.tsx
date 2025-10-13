export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import StoreSettingsForm from "@/components/admin/stores/settings-form";
import StorefrontHomeForm from "@/components/admin/stores/storefront-home-form";

export default async function StoreSettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true, name: true } });
  type StoreSettings = { currency?: string; multiCurrency?: boolean; conversionRates?: Record<string, number>; home?: any };
  const settings = ((store?.settings ?? {}) as StoreSettings);

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Store settings</h1>
        <p className="text-sm text-muted-foreground">Currency, storefront, and more</p>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Currency</h2>
        <p className="text-sm text-muted-foreground mb-4">Currency and conversions for pricing previews</p>
        <StoreSettingsForm storeId={storeId} initial={settings} />
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Storefront Home</h2>
        <p className="text-sm text-muted-foreground mb-4">Set the hero image, text, and links shown on your storefront home page</p>
        <StorefrontHomeForm storeId={storeId} initial={settings.home ?? {}} storeName={store?.name ?? "Store"} />
      </div>
    </div>
  );
}

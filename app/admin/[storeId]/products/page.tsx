import { requireStoreAccess } from "@/lib/require-store";

export default async function StoreProductsPage({ params }: { params: { storeId: string; }; }) {
  await requireStoreAccess(params.storeId);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Products</h1>
      <p className="text-sm text-muted-foreground">Manage products for store {params.storeId}.</p>
    </div>
  );
}

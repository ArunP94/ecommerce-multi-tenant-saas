export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import ProductEditor from "@/components/admin/products/product-editor";

export default async function EditProductPage({ params }: { params: Promise<{ storeId: string; productId: string }> }) {
  const { storeId, productId } = await params;
  await requireStoreAccess(storeId);
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { images: true, variants: { include: { images: true } } } });
  if (!product || product.storeId !== storeId) {
    return <div className="p-6">Product not found.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductEditor storeId={storeId} product={product} />
    </div>
  );
}

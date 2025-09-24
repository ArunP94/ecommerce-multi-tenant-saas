export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductsTable from "@/components/admin/products/products-table";

export default async function StoreProductsPage({ params, searchParams }: { params: Promise<{ storeId: string; }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true } });
  const storeName = store?.name ?? storeId;

  const sp = await searchParams;
  const q = sp?.q ?? "";
  const page = Number.parseInt(sp?.page ?? "1");
  const pageSize = 20;
  const where = q
    ? { storeId, title: { contains: q, mode: "insensitive" as const } }
    : { storeId };
  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { updatedAt: "desc" }, take: pageSize, skip: (page - 1) * pageSize }),
    prisma.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage products for store {storeName}.</p>
        </div>
        <Button asChild>
          <Link href={`/admin/${storeId}/products/new`}>Create product</Link>
        </Button>
      </div>

      <form className="flex gap-2" method="get">
        <Input name="q" placeholder="Search by title" defaultValue={q} />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <ProductsTable
        storeId={storeId}
        data={products.map((p) => ({
          id: p.id,
          title: p.title,
          sku: p.sku ?? null,
          hasVariants: p.hasVariants,
          status: ((p.metadata as Record<string, unknown> | null)?.["status"] as string | undefined) ?? null,
          updatedAt: (p.updatedAt as unknown as string),
        }))}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total} items)</div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" disabled={page <= 1}>
            <Link href={`?${new URLSearchParams({ q, page: String(Math.max(1, page - 1)) }).toString()}`}>Previous</Link>
          </Button>
          <Button asChild size="sm" variant="outline" disabled={page >= totalPages}>
            <Link href={`?${new URLSearchParams({ q, page: String(Math.min(totalPages, page + 1)) }).toString()}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductsTable from "@/components/domain/admin/products/products-table";
import { ProductsPageClient } from "@/components/domain/admin/products/products-page-client";
import { PageHeader, PageSection } from "@/components/primitives";
import { TablePagination } from "@/components/patterns";

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
    <PageSection>
      <ProductsPageClient storeId={storeId} />
      
      <PageHeader
        title="Products"
        description={`Manage products for store ${storeName}.`}
        action={
          <Button asChild>
            <Link href={`/admin/${storeId}/products/new`}>Create product</Link>
          </Button>
        }
      />

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

      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        buildPageUrl={(p) => `?${new URLSearchParams({ q, page: String(p) }).toString()}`}
      />
    </PageSection>
  );
}

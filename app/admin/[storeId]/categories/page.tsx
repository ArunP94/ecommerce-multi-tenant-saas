export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import CategoriesTable from "@/components/domain/admin/categories/categories-table";
import { PageHeader, PageSection } from "@/components/primitives";

export default async function CategoriesPage({ params }: { params: Promise<{ storeId: string; }>; }) {
  const { storeId } = await params;
  await requireStoreAccess(storeId);
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { name: true, settings: true } });
  const settings = ((store?.settings ?? {}) as { categories?: string[]; });
  const categories = settings.categories ?? [];

  async function AddCategoryForm() {
    async function action(formData: FormData) {
      'use server';
      const name = String(formData.get('name') || '').trim();
      if (!name) return;
      const s = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true } });
      const current = ((s?.settings ?? {}) as { categories?: string[]; });
      const list = Array.from(new Set([...(current.categories ?? []), name])).sort((a, b) => a.localeCompare(b));
      await prisma.store.update({ where: { id: storeId }, data: { settings: { ...current, categories: list } } });
      revalidatePath(`/admin/${storeId}/categories`);
    }
    return (
      <form action={action} className="flex items-center gap-2">
        <Input name="name" placeholder="New category name" className="w-64" />
        <Button type="submit">Add</Button>
      </form>
    );
  }

  return (
    <PageSection spacing="lg">
      <PageHeader
        title="Categories"
        description="Manage product categories for this store."
      />

      <Card>
        <CardHeader>
          <CardTitle>Add Category</CardTitle>
          <CardDescription>Create a new product category.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddCategoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
          <CardDescription>Manage your store categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesTable storeId={storeId} categories={categories} />
        </CardContent>
      </Card>
    </PageSection>
  );
}

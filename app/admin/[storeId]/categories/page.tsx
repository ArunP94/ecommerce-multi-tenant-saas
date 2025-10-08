export const dynamic = "force-dynamic";

import { requireStoreAccess } from "@/lib/require-store";
import { prisma } from "@/lib/prisma";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    }
    return (
      <form action={action} className="flex items-center gap-2">
        <Input name="name" placeholder="New category name" className="w-64" />
        <Button type="submit">Add</Button>
      </form>
    );
  }

  async function RemoveButton({ name }: { name: string; }) {
    async function action() {
      'use server';
      const s = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true } });
      const current = ((s?.settings ?? {}) as { categories?: string[]; });
      const list = (current.categories ?? []).filter((c) => c !== name);
      await prisma.store.update({ where: { id: storeId }, data: { settings: { ...current, categories: list } } });
    }
    return (
      <form action={action}>
        <Button variant="destructive" size="sm">Remove</Button>
      </form>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <AddCategoryForm />
      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-2 py-2 text-left font-medium">Category</TableHead>
                  <TableHead className="px-2 py-2 text-left font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c} className="border-b last:border-0">
                    <TableCell className="px-2 py-2">{c}</TableCell>
                    <TableCell className="px-2 py-2"><RemoveButton name={c} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

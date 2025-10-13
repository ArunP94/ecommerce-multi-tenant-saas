import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DeleteStoreButton } from "@/components/admin/delete-store-button";
import { CreateStoreForm } from "@/components/admin/forms/create-store-form";
import { ViewStoreLink } from "@/components/admin/view-store-link";
import { ClientOnly } from "@/components/core/client-only";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function StoresPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Stores</h1>
        <p className="text-sm text-muted-foreground">Only super admins can manage stores.</p>
      </div>
    );
  }

  const stores = await prisma.store.findMany({ select: { id: true, name: true, slug: true, customDomain: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="px-4 pb-8 lg:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Stores</h1>
        <p className="text-sm text-muted-foreground">Create and manage stores.</p>
      </div>

      <Card className="@container">
        <CardHeader>
          <CardTitle>Create Store</CardTitle>
          <CardDescription>Create a new store for an existing owner email.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClientOnly
            skeleton={
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="md:col-span-2">
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            }
          >
            <CreateStoreForm />
          </ClientOnly>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Stores</CardTitle>
          <CardDescription>Recently created stores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-2 py-2 text-left font-medium">Name</TableHead>
                  <TableHead className="px-2 py-2 text-left font-medium">Slug</TableHead>
                  <TableHead className="px-2 py-2 text-left font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((s) => (
                  <TableRow key={s.id} className="border-b last:border-0">
                    <TableCell className="px-2 py-2">{s.name}</TableCell>
                    <TableCell className="px-2 py-2">/{s.slug}</TableCell>
                    <TableCell className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <ViewStoreLink slug={s.slug} customDomain={s.customDomain} />
                        <DeleteStoreButton storeId={s.id} storeName={s.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {stores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="px-2 py-2 text-sm text-muted-foreground">No stores yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

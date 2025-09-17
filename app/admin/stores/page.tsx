import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DeleteStoreButton } from "@/components/admin/delete-store-button";
import { CreateStoreForm } from "@/components/admin/forms/create-store-form";
import { ViewStoreLink } from "@/components/admin/view-store-link";
import { ClientOnly } from "@/components/core/client-only";
import { Skeleton } from "@/components/ui/skeleton";

export default async function StoresPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Stores</h1>
        <p className="text-sm text-muted-foreground">Only super admins can manage stores.</p>
      </div>
    );
  }

  const stores = await prisma.store.findMany({ select: { id: true, name: true, slug: true }, orderBy: { createdAt: "desc" } });

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
          <div className="divide-y rounded-md border">
            {stores.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">/{s.slug}</div>
                </div>
                <div className="flex items-center gap-3">
                  <ViewStoreLink slug={s.slug} />
                  <DeleteStoreButton storeId={s.id} storeName={s.name} />
                </div>
              </div>
            ))}
            {stores.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No stores yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CreateStoreForm } from "@/components/domain/forms/create-store-form";
import { ClientOnly } from "@/components/core/client-only";
import { Skeleton } from "@/components/ui/skeleton";
import { StoresPageClient } from "@/components/domain/admin/stores/stores-page-client";
import StoresTable from "@/components/domain/admin/stores/stores-table";
import { PageHeader, PageSection } from "@/components/primitives";

export default async function StoresPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return (
      <PageSection>
        <PageHeader
          title="Stores"
          description="Only super admins can manage stores."
        />
      </PageSection>
    );
  }

  const stores = await prisma.store.findMany({ select: { id: true, name: true, slug: true, customDomain: true }, orderBy: { createdAt: "desc" } });

  return (
    <PageSection spacing="lg">
      <StoresPageClient />
      
      <PageHeader
        title="Stores"
        description="Create and manage stores."
      />

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
          <StoresTable
            data={stores.map((s) => ({
              id: s.id,
              name: s.name,
              slug: s.slug,
              customDomain: s.customDomain,
            }))}
          />
        </CardContent>
      </Card>
    </PageSection>
  );
}

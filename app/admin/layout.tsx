import { AdminSidebar, SiteHeader, SidebarToggleBridge } from "@/components/domain/admin";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getBaseDomain } from "@/lib/domain";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/signin");
  }

  // Server-fetched data for client components
  const role = session.user.role ?? "CUSTOMER";
  const latestUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true },
  });
  const name = latestUser?.name || session.user.name || "User";
  const avatarUrl = latestUser?.image ?? session.user.image ?? null;

  // Stores/current store for header and path templates
  let storesMeta: { id: string; name: string; slug: string; customDomain: string | null }[] = [];
  let currentStoreId: string | null = null;
  if (role === "SUPER_ADMIN") {
    storesMeta = await prisma.store.findMany({ select: { id: true, name: true, slug: true, customDomain: true }, orderBy: { name: "asc" } });
  } else if (session.user.storeId) {
    const store = await prisma.store.findUnique({ where: { id: session.user.storeId }, select: { id: true, name: true, slug: true, customDomain: true } });
    if (store) storesMeta = [store];
  }
  const stores = storesMeta.map(({ id, name }) => ({ id, name }));
  const cookieStore = (await cookies()).get("current_store_id")?.value ?? null;
  if (role === "SUPER_ADMIN" && cookieStore && stores.some((s) => s.id === cookieStore)) {
    currentStoreId = cookieStore;
  } else {
    currentStoreId = session.user.storeId ?? stores[0]?.id ?? null;
  }

  const storeDomains = Object.fromEntries(storesMeta.map((s) => [s.id, { slug: s.slug, customDomain: s.customDomain }]));
  const baseDomain = getBaseDomain();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SidebarToggleBridge />
      <AdminSidebar variant="inset" name={name} avatarUrl={avatarUrl} role={role} currentStoreId={currentStoreId} />
      <SidebarInset>
        <SiteHeader role={role} stores={stores} currentStoreId={currentStoreId} storeDomains={storeDomains} baseDomain={baseDomain} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

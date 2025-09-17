import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoreSelector } from "@/components/admin/store-selector";
import { cookies } from "next/headers";
import Link from "next/link";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const role = session?.user.role ?? "CUSTOMER";

  let stores: { id: string; name: string; }[] = [];
  let currentStoreId: string | null = null;

  if (role === "SUPER_ADMIN") {
    stores = await prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  } else if (session?.user.storeId) {
    const store = await prisma.store.findUnique({ where: { id: session.user.storeId }, select: { id: true, name: true } });
    if (store) stores = [store];
  }
  // Default for SUPER_ADMIN: last opened (cookie) if exists, else first
  const cookieStore = (await cookies()).get("current_store_id")?.value ?? null;
  if (role === "SUPER_ADMIN" && cookieStore && stores.some((s) => s.id === cookieStore)) {
    currentStoreId = cookieStore;
  } else {
    currentStoreId = session?.user.storeId ?? stores[0]?.id ?? null;
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex items-center gap-2">
          <StoreSelector stores={stores} currentStoreId={currentStoreId} readOnly={role !== "SUPER_ADMIN"} />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/admin/stores" className="dark:text-foreground">Manage Stores</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StoreSelector } from "@/components/admin/store-selector";
import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";

export function SiteHeader({
  role,
  stores,
  currentStoreId,
  storeDomains,
  baseDomain,
}: {
  role: string;
  stores: { id: string; name: string; }[];
  currentStoreId: string | null;
  storeDomains: Record<string, { slug: string; customDomain: string | null }>;
  baseDomain: string;
}) {
  function buildUrl(): string | null {
    const effectiveStoreId = currentStoreId ?? (stores[0]?.id ?? null);
    if (!effectiveStoreId) return null;
    const meta = storeDomains[effectiveStoreId];
    if (!meta) return null;
    const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : "";
    const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
    const isLocalBase = baseDomain === "localhost" || baseDomain.endsWith(".localhost");
    if (meta.customDomain && !isLocalBase) {
      return `${protocol}//${meta.customDomain}?preview=1`;
    }
    return `${protocol}//${meta.slug}.${baseDomain}${port}?preview=1`;
  }

  const viewHref = buildUrl();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear py-2">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle Sidebar"
          onClick={() => window.dispatchEvent(new Event("sidebar:toggle"))}
          className="-ml-1"
        >
          <PanelLeftIcon />
        </Button>
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex items-center gap-2">
          <StoreSelector stores={stores} currentStoreId={currentStoreId} readOnly={role !== "SUPER_ADMIN"} />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" size="sm" disabled={!viewHref} aria-disabled={!viewHref}>
            {viewHref ? (
              <a href={viewHref} target="_blank" rel="noreferrer">View Store</a>
            ) : (
              <span>View Store</span>
            )}
          </Button>
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/admin/stores" className="dark:text-foreground">Manage Stores</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

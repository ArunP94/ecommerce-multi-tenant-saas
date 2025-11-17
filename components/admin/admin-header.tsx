"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StoreSelector } from "@/components/admin/store-selector";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  storeDomains: Record<string, { slug: string; customDomain: string | null; }>;
  baseDomain: string;
}) {
  const [viewHref, setViewHref] = useState<string | null>(null);

  useEffect(() => {
    const effectiveStoreId = currentStoreId ?? (stores[0]?.id ?? null);
    if (!effectiveStoreId) {
      setViewHref(null);
      return;
    }
    const meta = storeDomains[effectiveStoreId];
    if (!meta) {
      setViewHref(null);
      return;
    }
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;
    const isLocalBase = baseDomain === "localhost" || baseDomain.endsWith(".localhost");
    if (meta.customDomain && !isLocalBase) {
      setViewHref(`${protocol}//${meta.customDomain}?preview=1`);
    } else {
      setViewHref(`${protocol}//${meta.slug}.${baseDomain}${port}?preview=1`);
    }
  }, [currentStoreId, stores, storeDomains, baseDomain]);

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
          <ThemeSwitcher />
          <Button asChild variant="outline" size="sm" disabled={!viewHref} aria-disabled={!viewHref}>
            {viewHref ? (
              <a href={viewHref} target="_blank" rel="noreferrer">View Store</a>
            ) : (
              <span>View Store</span>
            )}
          </Button>
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/admin/stores">Manage Stores</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

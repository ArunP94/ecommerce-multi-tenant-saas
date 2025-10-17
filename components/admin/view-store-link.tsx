"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ViewStoreLink({ slug, customDomain }: { slug: string; customDomain?: string | null; }) {
  const [isPending, startTransition] = useTransition();

  const baseDomain = process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN || (typeof window !== "undefined" ? window.location.hostname : "localhost");
  const port = typeof window !== "undefined" && window.location.port ? `:${window.location.port}` : "";
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const isLocalBase = baseDomain === "localhost" || baseDomain.endsWith(".localhost");
  const href = customDomain && !isLocalBase ? `${protocol}//${customDomain}?preview=1` : `${protocol}//${slug}.${baseDomain}${port}?preview=1`;

  return (
    <Button
      asChild
      onClick={() => {
        startTransition(() => { /* noop; allow pending state */ });
      }}
      disabled={isPending}
    >
      <a href={href} target="_blank" rel="noreferrer">{isPending ? "Opening…" : "View"}</a>
    </Button>
  );
}

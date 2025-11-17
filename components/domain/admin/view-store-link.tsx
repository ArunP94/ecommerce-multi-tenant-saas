"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ViewStoreLink({ slug, customDomain }: { slug: string; customDomain?: string | null; }) {
  const [isPending, startTransition] = useTransition();
  const [href, setHref] = useState<string>("");

  useEffect(() => {
    const baseDomain = process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN || window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;
    const isLocalBase = baseDomain === "localhost" || baseDomain.endsWith(".localhost");
    const url = customDomain && !isLocalBase ? `${protocol}//${customDomain}?preview=1` : `${protocol}//${slug}.${baseDomain}${port}?preview=1`;
    setHref(url);
  }, [slug, customDomain]);

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

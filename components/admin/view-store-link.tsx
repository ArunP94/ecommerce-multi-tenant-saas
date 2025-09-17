"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ViewStoreLink({ slug }: { slug: string; }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      asChild
      onClick={() => {
        // Let the browser navigate, but briefly show pending state
        startTransition(() => { });
      }}
      disabled={isPending}
    >
      <Link href={`/store/${slug}`}>{isPending ? "Opening…" : "View"}</Link>
    </Button>
  );
}

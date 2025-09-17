import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { extractSlugFromHost, normalizeHost } from "@/lib/domain";

export default async function StorefrontPage() {
  const hdrs = await headers();
  const host = normalizeHost(hdrs.get("host") || "");

  // Resolve store by subdomain or custom domain
  const slugFromHost = extractSlugFromHost(host);
  let store = null as null | { id: string; slug: string };
  if (slugFromHost) {
    store = await prisma.store.findUnique({ where: { slug: slugFromHost }, select: { id: true, slug: true } });
  } else {
    store = await prisma.store.findFirst({ where: { customDomain: host }, select: { id: true, slug: true } });
  }

  if (!store) return notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Storefront: {store.slug}</h1>
      <p className="text-muted-foreground">Host: {host}</p>
      <p className="mt-2">Render your storefront here. You can route nested paths under /storefront/* as needed.</p>
    </div>
  );
}

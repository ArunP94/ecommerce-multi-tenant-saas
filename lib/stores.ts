import { prisma } from "@/lib/prisma";

export async function findStoreByHost(host: string) {
  // host is already normalized (lowercase, no port)
  // First try custom domain, then subdomain slug
  let store = await prisma.store.findFirst({ where: { customDomain: host }, select: { id: true, slug: true, customDomain: true } });
  if (store) return store;
  // Fallback: maybe the host is exactly the slug.base; caller can pass the slug directly instead
  store = await prisma.store.findUnique({ where: { slug: host }, select: { id: true, slug: true, customDomain: true } });
  return store;
}

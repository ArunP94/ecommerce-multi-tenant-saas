export function getBaseDomain(): string {
  const fromEnv = process.env.PLATFORM_BASE_DOMAIN || process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN;
  if (!fromEnv) return "localhost";
  return fromEnv.replace(/^https?:\/\//, "").replace(/:\d+$/, "");
}

export function normalizeHost(host: string): string {
  return host.replace(/:\d+$/, "").toLowerCase();
}

export function isSubdomainOfBase(host: string): boolean {
  const base = getBaseDomain();
  const h = normalizeHost(host);
  return h.endsWith(`.${base}`) && h !== base;
}

export function extractSlugFromHost(host: string): string | null {
  const base = getBaseDomain();
  const h = normalizeHost(host);
  if (!h.endsWith(`.${base}`)) return null;
  const withoutBase = h.slice(0, -(base.length + 1));
  // Take only the first label as the slug (e.g., shop.platform.com -> shop)
  const [slug] = withoutBase.split(".");
  return slug || null;
}

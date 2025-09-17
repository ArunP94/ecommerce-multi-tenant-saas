import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { extractSlugFromHost, getBaseDomain, normalizeHost } from "@/lib/domain";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Host-based tenant routing (subdomain or custom domain)
  // Skip admin and auth/api routes
  const isAdminOrSystem = pathname.startsWith("/admin") || pathname.startsWith("/api/") || pathname.startsWith("/signin");
  if (!isAdminOrSystem) {
    const host = normalizeHost(req.headers.get("host") || "");
    const base = getBaseDomain();

    // If request is to a tenant domain (subdomain of base or custom domain not equal to base),
    // rewrite to /storefront preserving the path. The storefront page will resolve the store.
    const isBase = host === base || host === "localhost";
    const isTenantSubdomain = extractSlugFromHost(host) !== null;
    const isCustomDomain = !isBase && !isTenantSubdomain; // anything else

    if (isTenantSubdomain || isCustomDomain) {
      const url = req.nextUrl.clone();
      url.pathname = `/storefront${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // 2) Protect admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/super-admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL("/signin", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    const role = token?.role;
    if (pathname.startsWith("/api/super-admin") && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // /admin is allowed for SUPER_ADMIN, STORE_OWNER, STAFF
    if (!["SUPER_ADMIN", "STORE_OWNER", "STAFF"].includes(role ?? "")) {
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};

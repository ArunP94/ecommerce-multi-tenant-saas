import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import { extractSlugFromHost, getBaseDomain, normalizeHost } from "@/lib/domain";

export default withAuth(
  async function middleware(req: NextRequest) {
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
  if (pathname.startsWith("/api/super-admin")) {
    const token = req.nextauth?.token;
    const role = token?.role as string;
    if (pathname.startsWith("/api/super-admin") && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes
        if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/super-admin")) {
          return true;
        }
        
        // Require authentication for admin routes
        if (!token) {
          return false;
        }
        
        const role = token.role as string;
        
        // Admin routes require specific roles
        if (pathname.startsWith("/admin")) {
          return ["SUPER_ADMIN", "STORE_OWNER", "STAFF"].includes(role ?? "");
        }
        
        return true;
      },
    },
    pages: {
      signIn: "/signin",
    },
  }
);

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};

import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { extractSlugFromHost, normalizeHost } from "@/lib/domain";
import PreviewLinkManager from "@/components/storefront/preview-utils.client";
import { Menu, Search, Heart, User, ShoppingBag } from "lucide-react";

export default async function StorefrontPage({ searchParams }: { searchParams: Promise<{ preview?: string; }>; }) {
  const hdrs = await headers();
  const host = normalizeHost(hdrs.get("host") || "");
  const sp = await searchParams;
  const isPreviewParam = (sp?.preview ?? "") === "1" || (sp?.preview ?? "").toLowerCase?.() === "true";
  const cookieStore = await cookies();
  const isPreviewCookie = cookieStore.get("sf_preview")?.value === "1";
  const isPreview = isPreviewParam || isPreviewCookie;

  // Resolve store by subdomain or custom domain
  const slugFromHost = extractSlugFromHost(host);
  let store = null as null | { id: string; slug: string; name: string; settings: unknown };
  if (slugFromHost) {
    store = await prisma.store.findUnique({ where: { slug: slugFromHost }, select: { id: true, slug: true, name: true, settings: true } });
  } else {
    store = await prisma.store.findFirst({ where: { customDomain: host }, select: { id: true, slug: true, name: true, settings: true } });
  }

  if (!store) return notFound();
  const home = ((store.settings as Record<string, unknown> | null)?.home ?? {}) as {
    title?: string;
    subtitle?: string;
    kicker?: string;
    heroImageUrl?: string;
    ctaPrimary?: { label?: string; href?: string; };
    ctaSecondary?: { label?: string; href?: string; };
    align?: "left" | "center" | "right";
  };

  const title = home.title || store.name;
  const subtitle = home.subtitle || "";
  const kicker = home.kicker || "";
  const hero = home.heroImageUrl || "/vercel.svg"; // placeholder
  const align = home.align || "center";

  const justify = align === "left" ? "items-start text-left" : align === "right" ? "items-end text-right" : "items-center text-center";
  const place = align === "left" ? "place-items-start" : align === "right" ? "place-items-end" : "place-items-center";

  return (
    <div className="min-h-svh bg-black text-white">
      <PreviewLinkManager />
      {/* Header with LV-like layout */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="h-16 flex items-center justify-center relative px-4">
          {/* Left: menu + search */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-5 text-sm">
            <a href="#" className="inline-flex items-center gap-2 hover:opacity-80">
              <Menu className="size-5" />
              <span className="hidden sm:inline">Menu</span>
            </a>
            <a href="#" className="inline-flex items-center gap-2 hover:opacity-80">
              <Search className="size-5" />
              <span className="hidden sm:inline">Search</span>
            </a>
          </div>

          {/* Brand centered */}
          <div className="text-lg md:text-xl tracking-[0.35em] font-semibold uppercase select-none font-brand">
            {store.name}
          </div>

          {/* Right: contact + icons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
            <a href="#" className="hidden md:inline text-sm hover:opacity-80">Contact us</a>
            <a href="#" aria-label="Wishlist" className="hover:opacity-80"><Heart className="size-5" /></a>
            <a href="#" aria-label="Account" className="hover:opacity-80"><User className="size-5" /></a>
            <a href="#" aria-label="Bag" className="hover:opacity-80"><ShoppingBag className="size-5" /></a>
          </div>

          {isPreview && (
            <div className="absolute right-4 top-[calc(100%+6px)] flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-semibold shadow">
                Preview mode
              </span>
              <a href="?preview=0" className="text-xs underline underline-offset-2 hover:opacity-80">Exit preview</a>
            </div>
          )}
        </div>
      </header>

      {/* Hero background */}
      <section className="relative h-svh w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/0" />

        {/* Bottom overlay content */}
        <div className={`absolute left-0 right-0 bottom-12 px-6 md:px-10 grid ${place}`}>
          <div className={`max-w-2xl w-full flex flex-col ${justify} gap-2`}>
            {kicker && <div className="text-[11px] md:text-xs tracking-[0.35em] uppercase text-white/80 font-brand">{kicker}</div>}
            <h1 className="text-3xl md:text-6xl font-semibold drop-shadow font-brand">{title}</h1>
            {subtitle && <p className="text-sm md:text-base text-white/90 font-brand">{subtitle}</p>}
            <div className="mt-3 flex flex-wrap gap-4">
              {home.ctaPrimary?.label && home.ctaPrimary?.href && (
                <a href={home.ctaPrimary.href} className="inline-flex items-center gap-2 text-sm md:text-base underline underline-offset-4 decoration-white/70 hover:opacity-90">
                  {home.ctaPrimary.label}
                  <span aria-hidden>→</span>
                </a>
              )}
              {home.ctaSecondary?.label && home.ctaSecondary?.href && (
                <a href={home.ctaSecondary.href} className="inline-flex items-center gap-2 text-sm md:text-base underline underline-offset-4 decoration-white/40 hover:opacity-90">
                  {home.ctaSecondary.label}
                  <span aria-hidden>→</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

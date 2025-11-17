import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { extractSlugFromHost, normalizeHost } from "@/lib/domain";
import PreviewLinkManager from "@/components/storefront/preview-utils.client";
import { StorefrontHeader } from "@/components/storefront/storefront-header";

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
    <div className="min-h-svh bg-background text-foreground">
      <PreviewLinkManager />
      <StorefrontHeader storeName={store.name} isPreview={isPreview} />

      {/* Hero background */}
      <section className="relative h-svh w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent dark:from-black/50 dark:via-black/10 dark:to-black/0" />

        {/* Bottom overlay content */}
        <div className={`absolute left-0 right-0 bottom-12 px-6 md:px-10 grid ${place}`}>
          <div className={`max-w-2xl w-full flex flex-col ${justify} gap-2`}>
            {kicker && <div className="text-[11px] md:text-xs tracking-[0.35em] uppercase text-foreground/60 font-brand">{kicker}</div>}
            <h1 className="text-3xl md:text-6xl font-semibold drop-shadow font-brand text-foreground">{title}</h1>
            {subtitle && <p className="text-sm md:text-base text-foreground/80 font-brand">{subtitle}</p>}
            <div className="mt-3 flex flex-wrap gap-4">
              {home.ctaPrimary?.label && home.ctaPrimary?.href && (
                <a href={home.ctaPrimary.href} className="inline-flex items-center gap-2 text-sm md:text-base underline underline-offset-4 decoration-foreground/60 hover:opacity-90 transition-opacity">
                  {home.ctaPrimary.label}
                  <span aria-hidden>→</span>
                </a>
              )}
              {home.ctaSecondary?.label && home.ctaSecondary?.href && (
                <a href={home.ctaSecondary.href} className="inline-flex items-center gap-2 text-sm md:text-base underline underline-offset-4 decoration-foreground/30 hover:opacity-90 transition-opacity">
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

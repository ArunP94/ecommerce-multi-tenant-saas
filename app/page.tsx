import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Building2,
  Network,
  Globe,
  ShieldCheck,
  Package,
  CreditCard,
} from "lucide-react";

export default async function Home() {
  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="inline-block size-2 rounded-full bg-primary" />
            Multi‑Tenant SaaS
          </Link>
          <nav className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="#features">Features</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="#pricing">Pricing</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin">Dashboard</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="px-6">
        {/* Hero */}
        <section className="py-20 md:py-28 text-center">
          <div className="mx-auto max-w-2xl">
            <Badge className="mb-4" variant="secondary">New</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              White‑label E‑Commerce for every brand
            </h1>
            <p className="mt-4 text-muted-foreground text-base md:text-lg">
              Launch multi‑tenant storefronts with custom domains, role‑based admin,
              and flexible catalogs. Built with Next.js 15, Prisma, and MongoDB.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/admin">Go to dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">Explore features</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-8 md:py-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="size-5" /> Multi‑tenant core
                </CardTitle>
                <CardDescription>
                  Single database, tenant‑scoped models and indexes for scale.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="size-5" /> Custom domains
                </CardTitle>
                <CardDescription>
                  Map subdomains or root domains per store with middleware routing.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5" /> RBAC security
                </CardTitle>
                <CardDescription>
                  Super Admin, Store Owner, and Customer roles with scoped access.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="size-5" /> Catalog & variants
                </CardTitle>
                <CardDescription>
                  Categories, products, variant options, stock, and rich media.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-5" /> White‑label branding
                </CardTitle>
                <CardDescription>
                  Logos, palette, typography, and layout blocks per storefront.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-5" /> Checkout‑ready
                </CardTitle>
                <CardDescription>
                  Stripe‑based checkout and webhooks when you’re ready to sell.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Simple pricing placeholder */}
        <section id="pricing" className="py-12 md:py-16">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Transparent pricing</CardTitle>
              <CardDescription>
                Start free while you build. Add billing when you launch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/signin">Create your store</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#">Contact sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t">
        <div className="px-6 h-14 flex items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Multi‑Tenant SaaS.</p>
          <div className="flex items-center gap-4">
            <Link href="#features" className="hover:underline">Features</Link>
            <Link href="#pricing" className="hover:underline">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
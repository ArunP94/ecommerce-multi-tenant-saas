import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const ctaSchema = z.object({ label: z.string().min(1), href: z.string().url() }).partial();
const homeSchema = z
  .object({
    title: z.string().optional(), // optional override; defaults to store.name
    subtitle: z.string().optional(),
    kicker: z.string().optional(), // small label above the title (e.g., WOMEN)
    heroImageUrl: z.string().url().optional(),
    ctaPrimary: ctaSchema.optional(),
    ctaSecondary: ctaSchema.optional(),
    // layout knobs kept very light for now
    align: z.enum(["left", "center", "right"]).optional(),
  })
  .partial();

const settingsSchema = z.object({
  currency: z.string().optional(),
  multiCurrency: z.boolean().optional(),
  conversionRates: z.record(z.string(), z.number()).optional(),
  categories: z.array(z.string()).optional(),
  home: homeSchema.optional(),
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ storeId: string; }>; }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { storeId } = await context.params;
  if (role !== "SUPER_ADMIN" && userStoreId !== storeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true } });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ settings: store.settings });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string; }>; }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  const userStoreId = session.user.storeId ?? null;

  const { storeId } = await context.params;
  if (role !== "SUPER_ADMIN" && userStoreId !== storeId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = settingsSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true } });
  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const current = (store.settings as Record<string, unknown>) || {};

  const mergedHome = parsed.data.home
    ? { ...(current.home ?? {}), ...parsed.data.home }
    : current.home;

  const next = {
    ...current,
    ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {}),
    ...(parsed.data.multiCurrency !== undefined ? { multiCurrency: parsed.data.multiCurrency } : {}),
    ...(parsed.data.conversionRates !== undefined ? { conversionRates: parsed.data.conversionRates } : {}),
    ...(parsed.data.categories !== undefined ? { categories: parsed.data.categories } : {}),
    ...(parsed.data.home !== undefined ? { home: mergedHome } : {}),
  };

  const updated = await prisma.store.update({ where: { id: storeId }, data: { settings: next as Prisma.InputJsonValue } });
  return NextResponse.json({ settings: updated.settings });
}

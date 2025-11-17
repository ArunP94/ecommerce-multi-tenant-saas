import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { ApiResponse } from "@/lib/api/response-factory";
import { requireStoreAccess, handleAuthError } from "@/lib/api/auth-middleware";

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
  try {
    const { storeId } = await context.params;
    await requireStoreAccess(storeId);

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true } });
    if (!store) return ApiResponse.notFound();
    return ApiResponse.success({ settings: store.settings }, 200);
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ storeId: string; }>; }
) {
  try {
    const { storeId } = await context.params;
    await requireStoreAccess(storeId);

    const json = await req.json().catch(() => ({}));
    const parsed = settingsSchema.safeParse(json);
    if (!parsed.success) return ApiResponse.validationError(parsed.error);

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { settings: true } });
    if (!store) return ApiResponse.notFound();
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
    return ApiResponse.success({ settings: updated.settings }, 200);
  } catch (error) {
    return handleAuthError(error);
  }
}

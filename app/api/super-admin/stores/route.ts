import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, handleAuthError } from "@/lib/api/auth-middleware";
import { ApiResponse } from "@/lib/api/response-factory";
import { createStoreSchema } from "@/lib/validation/api-schemas";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    
    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, unknown> = {};
    
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    }
    
    if (body.customDomain === '') {
      delete body.customDomain;
    }
    
    const parsed = createStoreSchema.safeParse(body);
    if (!parsed.success) {
      return ApiResponse.validationError(parsed.error);
    }
    const { name, customDomain, ownerEmail } = parsed.data;
    
    let slug = generateSlug(name);
    
    let slugSuffix = 0;
    let finalSlug = slug;
    while (await prisma.store.findUnique({ where: { slug: finalSlug } })) {
      slugSuffix++;
      finalSlug = `${slug}-${slugSuffix}`;
    }
    slug = finalSlug;

    const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (!owner) {
      return ApiResponse.notFound("Owner not found");
    }
    const store = await prisma.store.create({
      data: {
        name,
        slug,
        customDomain: customDomain || null,
        ownerId: owner.id,
        settings: {},
      },
    });
    if (!owner.storeId) {
      await prisma.user.update({ where: { id: owner.id }, data: { storeId: store.id, role: "STORE_OWNER" } });
    }
    return ApiResponse.created({ store });
  } catch (error) {
    return handleAuthError(error);
  }
}

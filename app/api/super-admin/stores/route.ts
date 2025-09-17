import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createStoreSchema = z.object({
  name: z.string().min(2),
  customDomain: z.string().url().optional().or(z.string().length(0)),
  ownerEmail: z.string().email(),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // Parse form data
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
  
  // Filter out empty strings for optional fields
  if (body.customDomain === '') {
    delete body.customDomain;
  }
  
  const parsed = createStoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }
  const { name, customDomain, ownerEmail } = parsed.data;
  
  // Generate slug from name
  let slug = generateSlug(name);
  
  // Check if slug already exists and append a number if it does
  let slugSuffix = 0;
  let finalSlug = slug;
  while (await prisma.store.findUnique({ where: { slug: finalSlug } })) {
    slugSuffix++;
    finalSlug = `${slug}-${slugSuffix}`;
  }
  slug = finalSlug;

  // Ensure owner exists
  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
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
  // Attach storeId to owner if not set
  if (!owner.storeId) {
    await prisma.user.update({ where: { id: owner.id }, data: { storeId: store.id, role: "STORE_OWNER" } });
  }
  return NextResponse.json({ store });
}

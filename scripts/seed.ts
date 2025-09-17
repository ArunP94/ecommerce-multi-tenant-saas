import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD env.");
    process.exit(1);
  }

  // Upsert Super Admin
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const ADMIN_NAME = process.env.ADMIN_NAME || ADMIN_EMAIL.split("@")[0];
  const superAdmin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: ADMIN_NAME, hashedPassword: adminHash, role: "SUPER_ADMIN" },
    create: { email: ADMIN_EMAIL, name: ADMIN_NAME, hashedPassword: adminHash, role: "SUPER_ADMIN" },
  });

  // Optional Store Owner
  const OWNER_EMAIL = process.env.OWNER_EMAIL;
  const OWNER_PASSWORD = process.env.OWNER_PASSWORD;
  let ownerId = superAdmin.id;
  if (OWNER_EMAIL && OWNER_PASSWORD) {
    const ownerHash = await bcrypt.hash(OWNER_PASSWORD, 10);
    const OWNER_NAME = process.env.OWNER_NAME || OWNER_EMAIL.split("@")[0];
    const owner = await prisma.user.upsert({
      where: { email: OWNER_EMAIL },
      update: { name: OWNER_NAME, hashedPassword: ownerHash, role: "STORE_OWNER" },
      create: { email: OWNER_EMAIL, name: OWNER_NAME, hashedPassword: ownerHash, role: "STORE_OWNER" },
    });
    ownerId = owner.id;
  }

  // Create demo store if not exists
  const demoSlug = process.env.DEMO_STORE_SLUG || "demo";
  const demoName = process.env.DEMO_STORE_NAME || "Demo Store";

  const existingStore = await prisma.store.findUnique({ where: { slug: demoSlug } });
  const store = existingStore
    ? existingStore
    : await prisma.store.create({
      data: {
        name: demoName,
        slug: demoSlug,
        ownerId,
        settings: {},
      },
    });

  // If the owner is not the super admin (i.e., OWNER_* provided), attach storeId
  if (OWNER_EMAIL && OWNER_PASSWORD) {
    await prisma.user.update({ where: { id: ownerId }, data: { storeId: store.id, role: "STORE_OWNER" } });
  }

  console.log("Seed complete:", { adminEmail: ADMIN_EMAIL, store: { id: store.id, slug: store.slug } });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
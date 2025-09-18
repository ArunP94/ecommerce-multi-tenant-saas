import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

export async function requireStoreAccess(storeIdParam: string | string[] | undefined) {
  const session = await auth();
  if (!session) redirect("/signin");

  const storeId = Array.isArray(storeIdParam) ? storeIdParam[0] : storeIdParam;
  if (!storeId) notFound();

  const role = session.user.role;
  if (role === "SUPER_ADMIN") {
    const exists = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true } });
    if (!exists) notFound();
    return { session, storeId } as const;
  }

  if (session.user.storeId !== storeId) {
    redirect("/admin/stores");
  }
  return { session, storeId } as const;
}

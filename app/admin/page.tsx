import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/signin");
  const role = session.user.role;

  if (role === "SUPER_ADMIN") {
    const last = (await cookies()).get("current_store_id")?.value ?? null;
    if (last) {
      const exists = await prisma.store.findUnique({ where: { id: last }, select: { id: true } });
      if (exists) return redirect(`/admin/${last}`);
    }
    const first = await prisma.store.findFirst({ select: { id: true }, orderBy: { name: "asc" } });
    if (first) return redirect(`/admin/${first.id}`);
    return redirect("/admin/stores");
  }

  if (session.user.storeId) return redirect(`/admin/${session.user.storeId}`);
  return redirect("/admin/stores");
}

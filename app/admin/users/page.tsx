import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteUserForm } from "@/components/admin/forms/invite-user-form";

export default async function UsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Only super admins can invite and manage users.</p>
      </div>
    );
  }

  const [stores, users] = await Promise.all([
    prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, email: true, role: true, storeId: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const storeMap = new Map(stores.map((s) => [s.id, s.name] as const));

  return (
    <div className="px-4 pb-8 lg:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Invite and manage users.</p>
      </div>

      <Card className="@container">
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
          <CardDescription>Send an invitation to join a store as owner or staff.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteUserForm stores={stores} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Users</CardTitle>
          <CardDescription>Recently created or invited users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium">{u.email}</div>
                  <div className="text-xs text-muted-foreground capitalize">{u.role.toLowerCase().replace("_", " ")}</div>
                </div>
                <div className="text-sm text-muted-foreground">{u.storeId ? (storeMap.get(u.storeId) ?? "-") : "-"}</div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">No users yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

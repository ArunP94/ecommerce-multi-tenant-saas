import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteUserForm } from "@/components/domain/forms/invite-user-form";
import UsersTable from "@/components/domain/admin/users/users-table";
import { PageHeader, PageSection } from "@/components/primitives";

export default async function UsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return (
      <PageSection>
        <PageHeader
          title="Users"
          description="Only super admins can invite and manage users."
        />
      </PageSection>
    );
  }

  const [stores, users] = await Promise.all([
    prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, email: true, role: true, storeId: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const storeMap = new Map(stores.map((s) => [s.id, s.name] as const));

  return (
    <PageSection spacing="lg">
      <PageHeader
        title="Users"
        description="Invite and manage users."
      />

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
          <UsersTable
            data={users.map((u) => ({
              id: u.id,
              email: u.email,
              role: u.role,
              storeName: u.storeId ? storeMap.get(u.storeId) : null,
            }))}
          />
        </CardContent>
      </Card>
    </PageSection>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteUserForm } from "@/components/domain/forms/invite-user-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
          <div className="overflow-x-auto rounded-md border">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="px-2 py-2 text-left font-medium">Email</TableHead>
                  <TableHead className="px-2 py-2 text-left font-medium">Role</TableHead>
                  <TableHead className="px-2 py-2 text-left font-medium">Store</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-b last:border-0">
                    <TableCell className="px-2 py-2">{u.email}</TableCell>
                    <TableCell className="px-2 py-2 capitalize">{u.role.toLowerCase().replace("_", " ")}</TableCell>
                    <TableCell className="px-2 py-2">{u.storeId ? (storeMap.get(u.storeId) ?? "-") : "-"}</TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="px-2 py-2 text-sm text-muted-foreground">No users yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageSection>
  );
}

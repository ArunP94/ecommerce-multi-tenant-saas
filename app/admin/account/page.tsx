import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import AccountAvatar from "@/components/account/account-avatar";
import ClientAccountForm from "@/components/account/client-account-form";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="px-4 pb-8 lg:px-6">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">General Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile details and avatar.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="@container">
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>PNG or JPG up to 4MB</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountAvatar initialImage={user?.image ?? null} />
            </CardContent>
          </Card>

          <Card className="@container">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientAccountForm initialName={user?.name ?? ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

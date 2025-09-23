import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import ClientAvatarUploader from "./uploader-client";
import ClientAccountForm from "./uploader-client.form";
import ClientAvatarPreview from "./avatar-preview.client";

export default async function AccountPage() {
  const session = await auth();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="px-4 pb-8 lg:px-6">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">General Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile details and avatar.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="@container">
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>PNG or JPG up to 4MB</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ClientAvatarPreview initialUrl={user?.image ?? null} />
                <div className="flex-1">
                  <ClientAvatarUploader />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="@container">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Convert to client form via a small client wrapper */}
              <ClientAccountForm initialName={user?.name ?? ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

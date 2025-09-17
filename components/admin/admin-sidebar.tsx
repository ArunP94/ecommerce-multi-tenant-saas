
import * as React from "react";
import { ChevronRight } from "lucide-react";

import { NavMain } from "@/components/admin/nav-main";
import { NavSecondary } from "@/components/admin/nav-secondary";
import { NavUser } from "@/components/admin/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as Lucide from "lucide-react";
import { cookies } from "next/headers";

export async function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = await getServerSession(authOptions);
  const role = session?.user.role ?? "CUSTOMER";
  // Fetch fresh profile data to reflect updates immediately
  const latestUser = session?.user.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, image: true } })
    : null;
  const name = latestUser?.name || session?.user?.name || "User";
  const avatarUrl = latestUser?.image ?? session?.user.image ?? undefined;

  const baseItems: { title: string; url: string; icon?: keyof typeof Lucide; }[] = [
    { title: "Dashboard", url: "/admin/[storeId]", icon: "LayoutDashboard" },
  ];
  const superAdminItems: { title: string; url: string; icon?: keyof typeof Lucide; }[] = [
    { title: "Stores", url: "/admin/stores", icon: "Folder" },
    { title: "Users", url: "/admin/users", icon: "Users" },
  ];
  const staffItems: { title: string; url: string; icon?: keyof typeof Lucide; }[] = [
    { title: "Products", url: "/admin/[storeId]/products", icon: "ListChecks" },
    { title: "Orders", url: "/admin/[storeId]/orders", icon: "FileText" },
  ];

  const navMain = [
    ...baseItems,
    ...(role === "SUPER_ADMIN" ? superAdminItems : []),
    ...(role === "STORE_OWNER" || role === "STAFF" ? staffItems : []),
  ];

  const companyLabel = role === "SUPER_ADMIN" ? "Platform Admin" : "My Store";

  // Compute a default/current storeId for navigation templates
  let currentStoreId: string | undefined = undefined;
  if (role === "SUPER_ADMIN") {
    const cookieStore = (await cookies()).get("current_store_id")?.value ?? null;
    if (cookieStore) {
      const exists = await prisma.store.findUnique({ where: { id: cookieStore }, select: { id: true } });
      if (exists) currentStoreId = cookieStore;
    }
    if (!currentStoreId) {
      const first = await prisma.store.findFirst({ select: { id: true }, orderBy: { name: "asc" } });
      currentStoreId = first?.id ?? undefined;
    }
  } else if (session?.user.storeId) {
    currentStoreId = session.user.storeId ?? undefined;
  }

  const navSecondary = [
    { title: "Account", url: "/admin/account", icon: "Settings" },
    { title: "Help", url: "#", icon: "HelpCircle" },
    { title: "Search", url: "#", icon: "Search" },
  ] satisfies { title: string; url: string; icon: keyof typeof Lucide; }[];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <ChevronRight className="!size-5" />
                <span className="text-base font-semibold">{companyLabel}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} currentStoreId={currentStoreId} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name, role, avatarUrl }} />
      </SidebarFooter>
    </Sidebar>
  );
}

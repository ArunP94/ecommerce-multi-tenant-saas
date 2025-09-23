"use client";

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
import * as Lucide from "lucide-react";

export function AdminSidebar({
  name,
  avatarUrl,
  role,
  currentStoreId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  name: string;
  avatarUrl?: string | null;
  role: string;
  currentStoreId?: string | null;
}) {
  const [displayName, setDisplayName] = React.useState(name);
  const [avatar, setAvatar] = React.useState<string | undefined>(avatarUrl ?? undefined);

  // Keep local state in sync with incoming props
  React.useEffect(() => setDisplayName(name), [name]);
  React.useEffect(() => setAvatar(avatarUrl ?? undefined), [avatarUrl]);

  // Listen for global user updates to update instantly without a refresh
  React.useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<{ name?: string; image?: string | null }>;
      if (e.detail?.name !== undefined) setDisplayName(e.detail.name);
      if (e.detail?.image !== undefined) setAvatar(e.detail.image ?? undefined);
    };
    window.addEventListener("user:updated", handler as EventListener);
    return () => window.removeEventListener("user:updated", handler as EventListener);
  }, []);

  const baseItems: { title: string; url: string; icon?: keyof typeof Lucide }[] = [
    { title: "Dashboard", url: "/admin/[storeId]", icon: "LayoutDashboard" },
  ];
  const superAdminItems: { title: string; url: string; icon?: keyof typeof Lucide }[] = [
    { title: "Stores", url: "/admin/stores", icon: "Folder" },
    { title: "Users", url: "/admin/users", icon: "Users" },
  ];
  const staffItems: { title: string; url: string; icon?: keyof typeof Lucide }[] = [
    { title: "Products", url: "/admin/[storeId]/products", icon: "ListChecks" },
    { title: "Orders", url: "/admin/[storeId]/orders", icon: "FileText" },
  ];

  const navMain = [
    ...baseItems,
    ...(role === "SUPER_ADMIN" ? superAdminItems : []),
    ...(role === "STORE_OWNER" || role === "STAFF" ? staffItems : []),
  ];

  const companyLabel = role === "SUPER_ADMIN" ? "Platform Admin" : "My Store";

  const navSecondary = [
    { title: "Account", url: "/admin/account", icon: "Settings" },
    { title: "Help", url: "#", icon: "HelpCircle" },
    { title: "Search", url: "#", icon: "Search" },
  ] satisfies { title: string; url: string; icon: keyof typeof Lucide }[];

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
        <NavMain items={navMain} currentStoreId={currentStoreId ?? undefined} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: displayName, role, avatarUrl: avatar }} />
      </SidebarFooter>
    </Sidebar>
  );
}

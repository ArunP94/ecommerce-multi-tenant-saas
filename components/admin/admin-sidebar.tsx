"use client";

import * as React from "react";
import * as Lucide from "lucide-react";
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
import { useUser } from "@/context/user-context";


export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const role = user?.role ?? "CUSTOMER";

  const baseItems: { title: string; url: string; icon: keyof typeof Lucide; }[] = [
    { title: "Dashboard", url: "/admin/[storeId]", icon: "LayoutDashboard" },
  ];

  const superAdminItems: { title: string; url: string; icon: keyof typeof Lucide; }[] = [
    { title: "Stores", url: "/admin/stores", icon: "Folder" },
    { title: "Users", url: "/admin/users", icon: "Users" },
  ];

  const staffItems: { title: string; url: string; icon: keyof typeof Lucide; }[] = [
    { title: "Products", url: "/admin/[storeId]/products", icon: "ListChecks" },
    { title: "Orders", url: "/admin/[storeId]/orders", icon: "FileText" },
  ];

  const navMain = [
    ...baseItems,
    ...(role === "SUPER_ADMIN" ? superAdminItems : []),
    ...(["SUPER_ADMIN", "STORE_OWNER", "STAFF"].includes(role) ? staffItems : []),
  ];

  const navSecondary: { title: string; url: string; icon: keyof typeof Lucide; }[] = [
    { title: "Account", url: "/admin/account", icon: "Settings" },
    { title: "Help", url: "#", icon: "HelpCircle" },
    { title: "Search", url: "#", icon: "Search" },
  ];

  const companyLabel = role === "SUPER_ADMIN" ? "Platform Admin" : "My Store";

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
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

"use client"

import type { ComponentType, SVGProps } from "react"
import * as Lucide from "lucide-react"
import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

// Use string icon names to keep server-to-client props serializable
export function NavMain({
  items,
  currentStoreId: currentStoreIdProp,
}: {
  items: {
    title: string
    url: string // may include [storeId]
    icon?: keyof typeof Lucide | string
  }[]
  currentStoreId?: string
}) {
  const pathname = usePathname()
  // Best-effort parse current storeId from path: /admin/:storeId/...
  const parts = pathname.split("/").filter(Boolean)
  const adminIdx = parts.indexOf("admin")
  const segAfterAdmin = adminIdx >= 0 ? parts[adminIdx + 1] : undefined
  const staticTop = new Set(["stores", "users", "account"]) // non store-scoped roots
  const inferredStoreId = segAfterAdmin && !staticTop.has(segAfterAdmin) ? segAfterAdmin : undefined
  const currentStoreId = currentStoreIdProp ?? inferredStoreId

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const IconComp = item.icon
              ? (Lucide[item.icon as keyof typeof Lucide] as ComponentType<SVGProps<SVGSVGElement>>)
              : null

            let href = item.url
            const needsStore = href.includes("[storeId]")
            if (needsStore) {
              href = currentStoreId ? href.replace("[storeId]", currentStoreId) : "/admin"
            }

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild aria-disabled={needsStore && !currentStoreId}>
                  <Link href={href} aria-disabled={needsStore && !currentStoreId}>
                    {IconComp ? <IconComp /> : null}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

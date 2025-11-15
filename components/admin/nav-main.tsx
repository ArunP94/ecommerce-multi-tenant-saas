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

  const resolvedItems = items.map((item) => {
    let href = item.url
    const needsStore = href.includes("[storeId]")
    if (needsStore) {
      href = currentStoreId ? href.replace("[storeId]", currentStoreId) : "/admin"
    }
    return { ...item, href }
  })

  const activeItem = resolvedItems.reduce<{item: typeof resolvedItems[0], matchLength: number} | null>((best, item) => {
    if (pathname === item.href) {
      return { item, matchLength: Infinity }
    }
    const hrefSegments = item.href.split("/").filter(Boolean)
    const pathnameSegments = pathname.split("/").filter(Boolean)
    if (hrefSegments.every((seg, i) => seg === pathnameSegments[i]) && pathnameSegments.length > hrefSegments.length) {
      if (!best || hrefSegments.length > best.matchLength) {
        return { item, matchLength: hrefSegments.length }
      }
    }
    return best
  }, null)

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {resolvedItems.map((item) => {
            const IconComp = item.icon
              ? (Lucide[item.icon as keyof typeof Lucide] as ComponentType<SVGProps<SVGSVGElement>>)
              : null

            const needsStore = item.url.includes("[storeId]")
            const isActive = activeItem?.item === item

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  tooltip={item.title} 
                  asChild 
                  aria-disabled={needsStore && !currentStoreId}
                  className={isActive ? "border-l-2 border-primary bg-primary/5" : ""}
                >
                  <Link href={item.href} aria-disabled={needsStore && !currentStoreId}>
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

import React from "react"
import { cn } from "@/lib/utils"

export interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({
  children,
  className = "",
}: ResponsiveTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-md border", className)}>
      {children}
    </div>
  )
}

export interface ResponsiveTableRowProps {
  label?: string
  children: React.ReactNode
  className?: string
}

export function ResponsiveTableRow({
  label,
  children,
  className = "",
}: ResponsiveTableRowProps) {
  return (
    <div
      className={cn(
        "block border-b py-4 px-4 last:border-0 md:table-row md:border-b md:py-0 md:px-2",
        className
      )}
    >
      {label && (
        <span className="inline-block w-32 font-semibold text-sm text-muted-foreground md:hidden">
          {label}
        </span>
      )}
      <div className="inline-block align-middle md:table-cell md:px-2 md:py-2">
        {children}
      </div>
    </div>
  )
}

export interface ResponsiveTableCardProps {
  data: Array<{ label: string; value: React.ReactNode }>
  actions?: React.ReactNode
  className?: string
}

export function ResponsiveTableCard({
  data,
  actions,
  className = "",
}: ResponsiveTableCardProps) {
  return (
    <div
      className={cn(
        "block border rounded-md p-4 mb-4 md:hidden space-y-3",
        className
      )}
    >
      {data.map((item, idx) => (
        <div key={idx} className="flex justify-between items-start gap-2">
          <span className="font-medium text-sm text-muted-foreground">
            {item.label}
          </span>
          <span className="text-sm text-right">{item.value}</span>
        </div>
      ))}
      {actions && <div className="flex gap-2 pt-2 border-t">{actions}</div>}
    </div>
  )
}

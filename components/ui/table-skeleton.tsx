import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface TableSkeletonProps {
  rows?: number
  columns?: number
  headerColumns?: string[]
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  headerColumns = [],
}: TableSkeletonProps) {
  return (
    <div className="rounded-md border">
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            {headerColumns.length > 0 ? (
              headerColumns.map((col, i) => (
                <TableHead key={i} className="px-2 py-2">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))
            ) : (
              Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i} className="px-2 py-2">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx} className="border-b last:border-0">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx} className="px-2 py-2">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="rounded-md border overflow-hidden">
        <div className="bg-muted/50 px-4 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className="px-4 py-3 flex gap-4 border-t">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton
                key={`cell-${rowIdx}-${colIdx}`}
                className="h-4 flex-1"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

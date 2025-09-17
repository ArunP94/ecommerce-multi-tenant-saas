import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-3">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="h-4 w-64" />
    </div>
  )
}

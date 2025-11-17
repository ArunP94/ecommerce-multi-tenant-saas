import { Skeleton } from "@/components/ui/skeleton";

export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>

      {Array.from({ length: Math.max(0, fields - 1) }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}

      <div className="flex gap-2 justify-end">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

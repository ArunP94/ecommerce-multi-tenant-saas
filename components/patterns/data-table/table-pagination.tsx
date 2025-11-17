import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  buildPageUrl: (page: number) => string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  buildPageUrl,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages} ({totalItems} items)
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" disabled={currentPage <= 1}>
          <Link href={buildPageUrl(Math.max(1, currentPage - 1))}>Previous</Link>
        </Button>
        <Button asChild size="sm" variant="outline" disabled={currentPage >= totalPages}>
          <Link href={buildPageUrl(Math.min(totalPages, currentPage + 1))}>Next</Link>
        </Button>
      </div>
    </div>
  );
}

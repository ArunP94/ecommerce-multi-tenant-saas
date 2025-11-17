import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from "@/lib/utils";

interface StatusBadgeProps {
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} ${className ?? ""}`}
    >
      {config.label}
    </Badge>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface StockStatusBadgeProps {
  inventory: number;
  trackInventory: boolean;
  backorder: boolean;
  lowStockThreshold?: number;
}

export function StockStatusBadge({
  inventory,
  trackInventory,
  backorder,
  lowStockThreshold = 5,
}: StockStatusBadgeProps) {
  if (!trackInventory) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle className="size-3" />
        Not tracked
      </Badge>
    );
  }

  if (inventory === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" />
        Out of stock
        {backorder && <span className="ml-1 text-[10px]">(Backorder)</span>}
      </Badge>
    );
  }

  if (inventory <= lowStockThreshold) {
    return (
      <Badge className="gap-1 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
        <AlertCircle className="size-3" />
        Low stock
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
      <CheckCircle className="size-3" />
      In stock
    </Badge>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { FABMenu } from "@/components/ui/fab-menu";

interface InventoryPageClientProps {
  storeId: string;
}

export function InventoryPageClient({ storeId }: InventoryPageClientProps) {
  const router = useRouter();

  const fabActions = [
    {
      id: "create",
      label: "Add inventory",
      icon: <Plus className="h-5 w-5" />,
      onClick: () => router.push(`/admin/${storeId}/products/new`),
      variant: "default" as const,
    },
    {
      id: "export",
      label: "Export inventory",
      icon: <Download className="h-5 w-5" />,
      onClick: () => router.push(`/admin/${storeId}/inventory/export`),
      variant: "secondary" as const,
    },
  ];

  return <FABMenu actions={fabActions} position="bottom-right" mainLabel="Inventory actions" />;
}

"use client";

import { useRouter } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { FABMenu } from "@/components/ui/fab-menu";

interface OrdersPageClientProps {
  storeId: string;
}

export function OrdersPageClient({ storeId }: OrdersPageClientProps) {
  const router = useRouter();

  const fabActions = [
    {
      id: "create",
      label: "Create order",
      icon: <Plus className="h-5 w-5" />,
      onClick: () => router.push(`/admin/${storeId}/orders/new`),
      variant: "default" as const,
    },
    {
      id: "export",
      label: "Export orders",
      icon: <Download className="h-5 w-5" />,
      onClick: () => router.push(`/admin/${storeId}/orders/export`),
      variant: "secondary" as const,
    },
  ];

  return <FABMenu actions={fabActions} position="bottom-right" mainLabel="Order actions" />;
}

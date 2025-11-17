"use client";

import { useRouter } from "next/navigation";
import { Plus, Copy } from "lucide-react";
import { FABMenu } from "@/components/ui/fab-menu";

interface ProductsPageClientProps {
  storeId: string;
}

export function ProductsPageClient({ storeId }: ProductsPageClientProps) {
  const router = useRouter();

  const fabActions = [
    {
      id: "create",
      label: "Create product",
      icon: <Plus className="h-5 w-5" />,
      onClick: () => router.push(`/admin/${storeId}/products/new`),
      variant: "default" as const,
    },
    {
      id: "duplicate",
      label: "Duplicate product",
      icon: <Copy className="h-5 w-5" />,
      onClick: () => router.push(`/admin/${storeId}/products?action=duplicate`),
      variant: "secondary" as const,
    },
  ];

  return <FABMenu actions={fabActions} position="bottom-right" mainLabel="Product actions" />;
}

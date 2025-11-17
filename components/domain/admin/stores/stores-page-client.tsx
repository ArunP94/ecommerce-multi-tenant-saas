"use client";

import { Plus, BarChart3 } from "lucide-react";
import { FABMenu } from "@/components/ui/fab-menu";

export function StoresPageClient() {
  const fabActions = [
    {
      id: "scroll-to-form",
      label: "Create store",
      icon: <Plus className="h-5 w-5" />,
      onClick: () => {
        const form = document.querySelector('input[placeholder*="owner"]');
        if (form) {
          form.scrollIntoView({ behavior: "smooth", block: "center" });
          (form as HTMLInputElement).focus();
        }
      },
      variant: "default" as const,
    },
    {
      id: "stats",
      label: "Store stats",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => {
        const statsSection = document.querySelector('[data-section="stats"]');
        if (statsSection) {
          statsSection.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      },
      variant: "secondary" as const,
    },
  ];

  return <FABMenu actions={fabActions} position="bottom-right" mainLabel="Store actions" />;
}

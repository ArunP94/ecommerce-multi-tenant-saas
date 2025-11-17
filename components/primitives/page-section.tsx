import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg";
}

const spacingMap = {
  sm: "space-y-3",
  md: "space-y-4",
  lg: "space-y-6",
};

export function PageSection({ children, className, spacing = "md" }: PageSectionProps) {
  return (
    <div className={cn("p-6", spacingMap[spacing], className)}>
      {children}
    </div>
  );
}

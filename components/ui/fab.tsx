import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "secondary" | "destructive";
  position?: "bottom-right" | "bottom-left";
  showOnDesktop?: boolean;
}

const FAB = forwardRef<HTMLButtonElement, FABProps>(
  ({ icon, label, variant = "default", position = "bottom-right", showOnDesktop = false, className, ...props }, ref) => {
    const variantClasses = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
    };

    const positionClasses = {
      "bottom-right": "bottom-6 right-6",
      "bottom-left": "bottom-6 left-6",
    };

    return (
      <Button
        ref={ref}
        type="button"
        size="icon"
        className={cn(
          "fixed h-14 w-14 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all z-40",
          positionClasses[position],
          showOnDesktop ? "block" : "md:hidden",
          variantClasses[variant],
          className
        )}
        title={label}
        aria-label={label}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

FAB.displayName = "FAB";

export { FAB };

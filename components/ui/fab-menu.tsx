"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FABMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "secondary" | "destructive";
}

export interface FABMenuProps {
  actions: FABMenuAction[];
  position?: "bottom-right" | "bottom-left";
  mainLabel?: string;
}

export function FABMenu({ actions, position = "bottom-right", mainLabel = "Menu" }: FABMenuProps) {
  const [open, setOpen] = useState(false);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  };

  const isBottomRight = position === "bottom-right";

  const getActionStyle = (index: number) => {
    const spacing = 4.5;
    const offset = `calc(5.5rem + ${index * spacing}rem)`;
    return {
      bottom: offset,
      [position === "bottom-right" ? "right" : "left"]: "1.5rem",
    };
  };

  const getTooltipClass = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobile) {
      return "hidden";
    }

    return cn(
      "absolute whitespace-nowrap text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md shadow-lg pointer-events-none",
      isBottomRight
        ? "-translate-x-full -translate-y-1/2 right-full top-1/2 mr-2"
        : "-translate-y-1/2 left-full top-1/2 ml-2"
    );
  };

  return (
    <>
      {/* Main FAB Button */}
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed h-14 w-14 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all z-40",
          positionClasses[position],
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
        )}
        size="icon"
        aria-label={mainLabel}
        title={mainLabel}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>

      {/* Action Buttons Container */}
      {actions.map((action, index) => (
        <div
          key={action.id}
          className={cn(
            "fixed z-40 transition-all duration-200 ease-out",
            open
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-75 pointer-events-none"
          )}
          style={{
            ...getActionStyle(index),
            transitionDelay: open ? `${index * 50}ms` : "0ms",
          }}
        >
          <div className="relative flex items-center">
            {/* Tooltip */}
            <div className={getTooltipClass()}>
              {action.label}
            </div>

            {/* Action Button */}
            <Button
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              variant={
                action.variant === "secondary"
                  ? "secondary"
                  : action.variant === "destructive"
                    ? "destructive"
                    : "default"
              }
              size="icon"
              className="h-12 w-12 rounded-full shadow-md hover:shadow-lg transition-all"
              title={action.label}
              aria-label={action.label}
            >
              {action.icon}
            </Button>
          </div>
        </div>
      ))}

      {/* Backdrop/Overlay when menu is open */}
      {open && (
        <div
          className="fixed inset-0 z-30 cursor-pointer"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}
    </>
  );
}

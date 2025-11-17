"use client";

import { Menu, Search, Heart, User, ShoppingBag } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

interface StorefrontHeaderProps {
  storeName: string;
  isPreview: boolean;
}

export function StorefrontHeader({ storeName, isPreview }: StorefrontHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="h-16 flex items-center justify-center relative px-4">
        {/* Left: menu + search */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-5 text-sm">
          <a href="#" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Menu className="size-5" />
            <span className="hidden sm:inline">Menu</span>
          </a>
          <a href="#" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Search className="size-5" />
            <span className="hidden sm:inline">Search</span>
          </a>
        </div>

        {/* Brand centered */}
        <div className="text-lg md:text-xl tracking-[0.35em] font-semibold uppercase select-none font-brand">
          {storeName}
        </div>

        {/* Right: contact + icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <a href="#" className="hidden md:inline text-sm hover:opacity-80 transition-opacity">Contact us</a>
          <ThemeSwitcher />
          <a href="#" aria-label="Wishlist" className="hover:opacity-80 transition-opacity"><Heart className="size-5" /></a>
          <a href="#" aria-label="Account" className="hover:opacity-80 transition-opacity"><User className="size-5" /></a>
          <a href="#" aria-label="Bag" className="hover:opacity-80 transition-opacity"><ShoppingBag className="size-5" /></a>
        </div>

        {isPreview && (
          <div className="absolute right-4 top-[calc(100%+6px)] flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-yellow-400 text-black px-3 py-1 text-xs font-semibold shadow">
              Preview mode
            </span>
            <a href="?preview=0" className="text-xs underline underline-offset-2 hover:opacity-80 transition-opacity">Exit preview</a>
          </div>
        )}
      </div>
    </header>
  );
}

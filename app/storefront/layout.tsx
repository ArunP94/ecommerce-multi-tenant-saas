import type { ReactNode } from "react";
import { Jost } from "next/font/google";

// Free, geometric sans similar to Futura; scoped to storefront subtree only
const brand = Jost({
  variable: "--font-brand",
  display: "swap",
  subsets: ["latin"],
});

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return <div className={brand.variable}>{children}</div>;
}

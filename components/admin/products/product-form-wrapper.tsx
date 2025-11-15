"use client";

import dynamic from "next/dynamic";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ProductFormComponent = dynamic(() => import("./product-form"), {
  loading: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid gap-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  ),
  ssr: true,
});

export type ProductFormProps = React.ComponentProps<typeof ProductFormComponent>;

export function ProductFormWrapper(props: ProductFormProps) {
  return <ProductFormComponent {...props} />;
}

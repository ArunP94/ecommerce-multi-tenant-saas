"use client";

import dynamic from "next/dynamic";
import React from "react";
import { ProductFormSkeleton } from "@/components/ui/product-form-skeleton";

const ProductFormComponent = dynamic(() => import("./product-form"), {
  loading: () => <ProductFormSkeleton />,
  ssr: true,
});

export type ProductFormProps = React.ComponentProps<typeof ProductFormComponent>;

export function ProductFormWrapper(props: ProductFormProps) {
  return <ProductFormComponent {...props} />;
}

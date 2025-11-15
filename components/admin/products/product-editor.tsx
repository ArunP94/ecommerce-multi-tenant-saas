"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ProductFormWrapper } from "@/components/admin/products/product-form-wrapper";
import type { ProductFormValues } from "@/components/admin/products/product-form";
import { toast } from "sonner";

// A lightweight editor wrapper that reuses ProductForm shape and submits to the full replace API.
export default function ProductEditor({ storeId, product }: { storeId: string; product: unknown }) {
  const router = useRouter();

  // Transform API product to ProductFormValues
  const initial: ProductFormValues = React.useMemo(() => {
const metadata = ((product as { metadata?: unknown } | null)?.metadata ?? {}) as {
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  currency?: string;
  options?: unknown;
  sale?: { price?: number; start?: string | Date; end?: string | Date };
};
    const status = metadata?.status ?? "DRAFT";
    const currency = metadata?.currency ?? "GBP";
const options = Array.isArray(metadata?.options) ? (metadata.options as Array<{ name: string; type: "color" | "size" | "custom"; values: Array<{ value: string; hex?: string }> }>) : [];

const images = ((product as { images?: { id?: string; url: string; altText?: string | null; metadata?: unknown }[] } | null)?.images || []).map((img, idx: number) => ({
      id: img.id || String(idx),
      url: img.url,
      altText: img.altText || undefined,
isPrimary: Boolean((img.metadata as Record<string, unknown> | undefined)?.["isPrimary"]) || idx === 0,
    }));

const variants = ((product as { variants?: { id: string; sku: string; price: number; inventory: number; attributes?: unknown; images?: { url: string; altText?: string | null; metadata?: unknown }[] }[] } | null)?.variants || []).map((v) => {
const sale = (v.attributes && typeof (v.attributes as Record<string, unknown>)["sale"] === "object" ? (v.attributes as Record<string, unknown>)["sale"] : undefined) as { price?: number; start?: string | Date; end?: string | Date } | undefined;
      return {
        key: `${v.id}`,
        attributes: Object.fromEntries(Object.entries(v.attributes || {}).filter(([k]) => k !== "sale")) as Record<string, string>,
        sku: v.sku,
        price: v.price,
        inventory: v.inventory ?? 0,
images: (v.images || []).map((img, idx: number) => ({ url: img.url, altText: img.altText || undefined, isPrimary: Boolean((img.metadata as Record<string, unknown> | undefined)?.["isPrimary"]) || idx === 0 })),
        salePrice: sale?.price ?? undefined,
        saleStart: sale?.start ? new Date(sale.start).toISOString().slice(0,16) : undefined,
        saleEnd: sale?.end ? new Date(sale.end).toISOString().slice(0,16) : undefined,
trackInventory: (() => { const attrs = (v.attributes ?? null) as Record<string, unknown> | null; return attrs && typeof attrs["trackInventory"] === "boolean" ? (attrs["trackInventory"] as boolean) : true; })(),
        backorder: (() => { const attrs = (v.attributes ?? null) as Record<string, unknown> | null; return attrs && typeof attrs["backorder"] === "boolean" ? (attrs["backorder"] as boolean) : false; })(),
      };
    });

    return {
      title: (product as { title: string }).title,
      sku: (product as { sku?: string | null }).sku || undefined,
      description: (product as { description?: string | null }).description || undefined,
      categories: (product as { categories?: string[] }).categories || [],
      status,
      hasVariants: Boolean((product as { hasVariants: boolean }).hasVariants),
      price: (product as { hasVariants: boolean; price?: number | null }).hasVariants ? undefined : ((product as { price?: number | null }).price ?? undefined),
      currency,
      salePrice: metadata?.sale?.price ?? undefined,
      saleStart: metadata?.sale?.start ? new Date(metadata.sale.start).toISOString().slice(0,16) : undefined,
      saleEnd: metadata?.sale?.end ? new Date(metadata.sale.end).toISOString().slice(0,16) : undefined,
      images,
      options: options.length ? options : [],
      variants,
    } as ProductFormValues;
  }, [product]);

  async function handleSave(values: ProductFormValues, publish = false) {
    try {
      const payload = {
        title: values.title,
        description: values.description?.trim() || undefined,
        sku: values.sku?.trim() || undefined,
        hasVariants: values.hasVariants,
        categories: values.categories,
        status: publish ? "ACTIVE" : values.status,
        price: values.hasVariants ? undefined : values.price,
        currency: values.currency,
        salePrice: values.salePrice ?? undefined,
        saleStart: values.saleStart || undefined,
        saleEnd: values.saleEnd || undefined,
        images: values.images.map((img, idx) => ({ url: img.url, altText: img.altText, isPrimary: img.isPrimary ?? idx === 0, sort: idx })),
        options: values.options.map((o) => ({ name: o.name.trim(), type: o.type, values: o.values.map((v) => ({ value: v.value, hex: v.hex })) })),
        variants: values.hasVariants
          ? values.variants.map((v) => ({
              sku: v.sku.trim(),
              price: v.price,
              inventory: v.inventory,
              attributes: { ...(v.attributes || {}), trackInventory: v.trackInventory, backorder: v.backorder },
              images: (v.images ?? []).map((img, idx) => ({ url: img.url, altText: img.altText, isPrimary: img.isPrimary ?? idx === 0, sort: idx })),
              salePrice: v.salePrice ?? undefined,
              saleStart: v.saleStart || undefined,
              saleEnd: v.saleEnd || undefined,
            }))
          : [],
      };

const res = await fetch(`/api/stores/${storeId}/products/${(product as { id: string }).id}/full`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to save");
      toast.success("Product updated");
      router.push(`/admin/${storeId}/products`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  return (
    <div className="space-y-4">
      <ProductFormWrapper
        storeId={storeId}
        defaultCurrency={initial.currency}
        storeSettings={{ currency: initial.currency }}
        initialValues={initial}
        onSubmitOverride={handleSave}
      />
    </div>
  );
}

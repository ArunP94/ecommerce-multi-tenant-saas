"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ProductFormValues } from "@/lib/validation/form-schemas";
import { generateId, cartesian, makeComboKey, normalizeOptions } from "@/lib/validation/product-helpers";

interface UseProductFormOptions {
  storeId: string;
  onSubmitOverride?: (values: ProductFormValues, publish: boolean) => Promise<void>;
}

export function useProductForm(
  form: UseFormReturn<ProductFormValues>,
  { storeId, onSubmitOverride }: UseProductFormOptions
) {
  const router = useRouter();
  const images = form.watch("images");
  const hasVariants = form.watch("hasVariants");
  const options = form.watch("options");
  const variants = form.watch("variants");

  const attributeColumns = useMemo(() => {
    const names = Array.from(
      new Set(variants.flatMap((v) => Object.keys(v.attributes || {})))
    );
    return names;
  }, [variants]);

  useEffect(() => {
    const opts = form.getValues("options");
    if (!opts || opts.length === 0) return;
    const { normalized, changed } = normalizeOptions(
      opts as Array<{ id?: string; name: string; type: string; values?: Array<{ id?: string; value: string; hex?: string }> }>
    );
    if (changed) {
      form.setValue("options", normalized as ProductFormValues["options"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasVariants) {
      generateVariants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasVariants]);

  function addImages(urls: string[]) {
    const next = [...images];
    for (const url of urls) {
      const id = generateId();
      next.push({ id, url, isPrimary: next.length === 0 });
    }
    if (!next.some((i) => i.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    form.setValue("images", next, { shouldValidate: true });
  }

  function removeImage(id: string) {
    let next = images.filter((i) => i.id !== id);
    if (next.length > 0 && !next.some((i) => i.isPrimary)) {
      next = next.map((i, idx) => ({ ...i, isPrimary: idx === 0 }));
    }
    form.setValue("images", next, { shouldValidate: true });
  }

  function setPrimaryImage(id: string) {
    const next = images.map((i) => ({ ...i, isPrimary: i.id === id }));
    form.setValue("images", next, { shouldValidate: true });
  }

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = form.getValues("categories") || [];
    const next = Array.from(new Set([...current, trimmed]));
    form.setValue("categories", next);
  }

  function removeCategory(cat: string) {
    form.setValue("categories", form.getValues("categories").filter((c) => c !== cat));
  }

  function addOption() {
    const id = generateId();
    const next = [...options, { id, name: "Option", type: "custom" as const, values: [] }];
    form.setValue("options", next);
  }

  function removeOption(id: string) {
    const next = options.filter((o) => o.id !== id);
    form.setValue("options", next);
  }

  function updateOptionName(id: string, name: string) {
    const next = options.map((o) => (o.id === id ? { ...o, name } : o));
    form.setValue("options", next);
  }

  function updateOptionType(id: string, type: "color" | "size" | "custom") {
    const next = options.map((o) => (o.id === id ? { ...o, type } : o));
    form.setValue("options", next);
  }

  function addOptionValues(id: string, raw: string) {
    const cleaned = raw.replace(/\s+/g, ",");
    const parts = cleaned
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = options.map((o) =>
      o.id === id
        ? {
            ...o,
            values: [
              ...o.values,
              ...parts.map((v) => ({ id: generateId(), value: v })),
            ],
          }
        : o
    );
    form.setValue("options", next);
  }

  function removeOptionValue(optionId: string, valueId: string) {
    const next = options.map((o) =>
      o.id === optionId
        ? { ...o, values: o.values.filter((v) => v.id !== valueId) }
        : o
    );
    form.setValue("options", next);
  }

  function generateVariants() {
    const named = options.filter((o) => o.name.trim() && o.values.length > 0);
    if (named.length === 0) {
      form.setValue("variants", []);
      return;
    }
    const arrays = named.map((o) =>
      o.values.map((v) => ({ option: o.name.trim(), value: v.value }))
    );
    const combos = cartesian(arrays);
    const rows = combos.map((combo) => {
      const attrs: Record<string, string> = {};
      for (const part of combo) attrs[part.option] = part.value;
      const key = makeComboKey(attrs);
      const existing = form.getValues("variants").find((r) => r.key === key);
      return (
        existing ?? {
          key,
          attributes: attrs,
          sku: "",
          price: form.getValues("price") ?? 0,
          inventory: 0,
          images: [],
          trackInventory: true,
          backorder: false,
        }
      );
    });
    form.setValue("variants", rows as ProductFormValues["variants"], {
      shouldValidate: true,
    });
  }

  function addVariantImages(vIndex: number, urls: string[]) {
    const current = form.getValues("variants");
    const row = current[vIndex];
    const nextImages = [...(row.images ?? [])];
    for (const url of urls) {
      nextImages.push({ url, isPrimary: nextImages.length === 0 });
    }
    const updatedRow: ProductFormValues["variants"][number] = {
      ...row,
      images: nextImages,
    };
    current[vIndex] = updatedRow;
    form.setValue("variants", [...current]);
  }

  function clearVariantImages(vIndex: number) {
    const current = form.getValues("variants");
    const row = current[vIndex];
    const updatedRow: ProductFormValues["variants"][number] = {
      ...row,
      images: [],
    };
    current[vIndex] = updatedRow;
    form.setValue("variants", [...current]);
  }

  async function onSubmit(values: ProductFormValues, publish = false) {
    try {
      const anyImages =
        values.images.length > 0 ||
        values.variants.some((v) => (v.images?.length ?? 0) > 0);
      if (!anyImages) {
        toast.error("Please add at least one image");
        return;
      }

      if (!values.hasVariants && (values.price === undefined || values.price === null)) {
        toast.error("Price is required when there are no variants");
        return;
      }

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
        images: values.images.map((img, idx) => ({
          url: img.url,
          altText: img.altText,
          isPrimary: img.isPrimary ?? idx === 0,
          sort: idx,
        })),
        options: values.options.map((o) => ({
          name: o.name.trim(),
          type: o.type,
          values: o.values.map((v) => ({ value: v.value, hex: v.hex })),
        })),
        variants: values.hasVariants
          ? values.variants.map((v) => ({
              sku: v.sku.trim(),
              price: v.price,
              inventory: v.inventory,
              attributes: {
                ...(v.attributes || {}),
                trackInventory: v.trackInventory,
                backorder: v.backorder,
              },
              images: (v.images ?? []).map((img, idx) => ({
                url: img.url,
                altText: img.altText,
                isPrimary: img.isPrimary ?? idx === 0,
                sort: idx,
              })),
              salePrice: v.salePrice ?? undefined,
              saleStart: v.saleStart || undefined,
              saleEnd: v.saleEnd || undefined,
            }))
          : [],
      };

      if (onSubmitOverride) {
        await onSubmitOverride(values, publish);
        return;
      }

      const res = await fetch(`/api/stores/${storeId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to create product (${res.status})`);
      }
      toast.success("Product created");
      router.push(`/admin/${storeId}/products`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create product");
    }
  }

  return {
    images,
    hasVariants,
    options,
    variants,
    attributeColumns,
    addImages,
    removeImage,
    setPrimaryImage,
    addCategory,
    removeCategory,
    addOption,
    removeOption,
    updateOptionName,
    updateOptionType,
    addOptionValues,
    removeOptionValue,
    generateVariants,
    addVariantImages,
    clearVariantImages,
    onSubmit,
  };
}

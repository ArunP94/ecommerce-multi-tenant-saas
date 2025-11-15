"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type FieldPath, type Resolver } from "react-hook-form";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical, Image as ImageIcon, Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import VariantImagesDialog from "@/components/admin/products/variant-images-dialog";

// Types
const ImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  altText: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const VariantRowSchema = z.object({
  key: z.string(), // combination key
  attributes: z.record(z.string(), z.string()),
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().nonnegative(),
  inventory: z.coerce.number().int().min(0).default(0),
  images: z.array(ImageSchema.omit({ id: true })).optional().default([]),
  salePrice: z.coerce.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),
  trackInventory: z.boolean().default(true),
  backorder: z.boolean().default(false),
});

const OptionValueSchema = z.object({ id: z.string(), value: z.string().min(1), hex: z.string().optional() });
const OptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["color", "size", "custom"]).default("custom"),
  values: z.array(OptionValueSchema).min(1),
});

const ProductFormSchema = z.object({
  title: z.string().min(2),
  sku: z.string().optional(),
  description: z.string().optional(),
  categories: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  hasVariants: z.boolean().default(false),
  // Non-variant pricing
  price: z.coerce.number().nonnegative().optional(),
  currency: z.string().default("GBP"),
  salePrice: z.coerce.number().nonnegative().optional(),
  saleStart: z.string().optional(),
  saleEnd: z.string().optional(),

  images: z.array(ImageSchema).default([]),
  options: z.array(OptionSchema).default([]),
  variants: z.array(VariantRowSchema).default([]),
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce<T[][]>((acc, curr) => {
    if (acc.length === 0) return curr.map((v) => [v]);
    const next: T[][] = [];
    for (const a of acc) {
      for (const c of curr) {
        next.push([...a, c]);
      }
    }
    return next;
  }, []);
}

function makeComboKey(attrs: Record<string, string>): string {
  return Object.keys(attrs)
    .sort()
    .map((k) => `${k}:${attrs[k]}`)
    .join("|");
}

// Sortable image item
const SortableImageItem = React.memo(function SortableImageItem({ image, onRemove, onPrimary }: { image: { id: string; url: string; isPrimary?: boolean }; onRemove: () => void; onPrimary: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="group relative overflow-hidden rounded-md border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt="product" className="h-28 w-28 object-cover" />
      <div className="absolute inset-0 flex items-start justify-between p-1 opacity-0 group-hover:opacity-100 transition">
        <Button type="button" variant="ghost" size="icon" className="bg-white/80" {...attributes} {...listeners} aria-label="Drag">
          <GripVertical className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="bg-white/80" onClick={onRemove} aria-label="Remove">
          <X className="size-4" />
        </Button>
      </div>
      <div className="absolute bottom-1 left-1 flex items-center gap-1">
        <Button type="button" onClick={onPrimary} variant="ghost" className={`text-[10px] px-1 py-0.5 h-auto ${image.isPrimary ? "bg-primary text-primary-foreground" : "bg-white/80"}`}>
          {image.isPrimary ? "Primary" : "Make primary"}
        </Button>
      </div>
    </div>
  );
});

function ProductFormContent({ storeId, defaultCurrency = "GBP", storeSettings, initialValues, onSubmitOverride, }: { storeId: string; defaultCurrency?: string; storeSettings?: { currency?: string; multiCurrency?: boolean; conversionRates?: Record<string, number>; categories?: string[] }; initialValues?: Partial<ProductFormValues>; onSubmitOverride?: (values: ProductFormValues, publish: boolean) => Promise<void>; }) {
  const router = useRouter();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      title: "",
      sku: "",
      description: "",
      categories: [],
      status: "DRAFT",
      hasVariants: false,
      price: undefined,
      currency: initialValues?.currency ?? defaultCurrency,
      salePrice: undefined,
      saleStart: undefined,
      saleEnd: undefined,
      images: initialValues?.images ?? [],
      options: initialValues?.options ?? [],
      variants: initialValues?.variants ?? [],
      ...(initialValues ?? {}),
    } as Partial<ProductFormValues>,
    mode: "onChange",
  });

  const [categoryInput, setCategoryInput] = useState("");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categoryHighlight, setCategoryHighlight] = useState(0);
  const allCategories = useMemo(() => Array.from(new Set(storeSettings?.categories ?? [])), [storeSettings]);
  const filteredCategories = useMemo(() => {
    const term = categoryFilter.toLowerCase();
    return allCategories.filter((c) => c.toLowerCase().includes(term));
  }, [allCategories, categoryFilter]);

  function addCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = form.getValues("categories") || [];
    const next = Array.from(new Set([...current, trimmed]));
    form.setValue("categories", next);
  }

  function onCategoryFilterKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const term = categoryFilter.trim();
    const hasExact = filteredCategories.some((c) => c.toLowerCase() === term.toLowerCase());
    const canCreate = term.length > 0 && !hasExact;
    const total = filteredCategories.length + (canCreate ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (total > 0) setCategoryHighlight((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (total > 0) setCategoryHighlight((i) => (i - 1 + total) % total);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (total === 0) return;
      if (categoryHighlight < filteredCategories.length) {
        addCategory(filteredCategories[categoryHighlight]);
      } else if (canCreate) {
        addCategory(term);
      }
      setCategoryMenuOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCategoryMenuOpen(false);
    }
  }

  // Image dragging
  const sensors = useSensors(useSensor(PointerSensor));
  const images = form.watch("images");
  const hasVariants = form.watch("hasVariants");
  const options = form.watch("options");
  const variants = form.watch("variants");
  const [openVariantImagesIndex, setOpenVariantImagesIndex] = React.useState<number | null>(null);

  // Ensure options and values have stable IDs when coming from initialValues
  useEffect(() => {
    const opts = form.getValues("options") as unknown as Array<{ id?: string; name: string; type: "color"|"size"|"custom"; values?: Array<{ id?: string; value: string; hex?: string }> }>;
    if (!opts || opts.length === 0) return;
    let changed = false;
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const normalized = opts.map((o, oi) => {
      const id = o.id && o.id.length ? o.id : `opt-${oi}-${slug(o.name || "option")}-${Math.random().toString(36).slice(2,6)}`;
      if (!o.id) changed = true;
      const values = (o.values ?? []).map((v, vi) => {
        const vid = v.id && v.id.length ? v.id : `optv-${oi}-${vi}-${slug(v.value || "value")}-${Math.random().toString(36).slice(2,6)}`;
        if (!v.id) changed = true;
        return { id: vid, value: v.value, hex: v.hex };
        });
      return { id, name: o.name, type: o.type, values };
    });
    if (changed) {
      form.setValue("options", normalized as unknown as ProductFormValues["options"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    const ordered = arrayMove(images, oldIndex, newIndex);
    form.setValue(
      "images",
      ordered.map((img) => ({ ...img }))
    );
  }

  function addImages(urls: string[]) {
    const next = [...images];
    for (const url of urls) {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      next.push({ id, url, isPrimary: next.length === 0 ? true : false });
    }
    // Ensure exactly one primary
    if (!next.some((i) => i.isPrimary)) next[0] = { ...next[0], isPrimary: true };
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

  // Categories helpers
  function addCategoryFromInput() {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
    const existing = new Set(form.getValues("categories"));
    const merged = [...existing, ...parts].filter(Boolean) as string[];
    form.setValue("categories", Array.from(new Set(merged)));
    setCategoryInput("");
  }
  function removeCategory(cat: string) {
    form.setValue("categories", form.getValues("categories").filter((c) => c !== cat));
  }

  // Options and variants
  function addOption() {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
              ...parts.map((v) => ({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}` , value: v })),
            ],
          }
        : o
    );
    form.setValue("options", next);
  }
  function removeOptionValue(optionId: string, valueId: string) {
    const next = options.map((o) => (o.id === optionId ? { ...o, values: o.values.filter((v) => v.id !== valueId) } : o));
    form.setValue("options", next);
  }

  function generateVariants() {
    const named = options.filter((o) => o.name.trim() && o.values.length > 0);
    if (named.length === 0) {
      form.setValue("variants", []);
      return;
    }
    const arrays = named.map((o) => o.values.map((v) => ({ option: o.name.trim(), value: v.value })));
    const combos = cartesian(arrays);
    const rows = combos.map((combo) => {
      const attrs: Record<string, string> = {};
      for (const part of combo) attrs[part.option] = part.value;
      const key = makeComboKey(attrs);
      // keep existing row values if present
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
    form.setValue("variants", rows, { shouldValidate: true });
  }

  // Recompute variants when options change if hasVariants
  useEffect(() => {
    if (hasVariants) generateVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options), hasVariants]);

  async function onSubmit(values: ProductFormValues, publish = false) {
    try {
      // Required: at least one image (product or variant)
      const anyImages = values.images.length > 0 || values.variants.some((v) => (v.images?.length ?? 0) > 0);
      if (!anyImages) {
        toast.error("Please add at least one image");
        return;
      }

      // If no variants, require price
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
              attributes: { ...(v.attributes || {}), trackInventory: v.trackInventory, backorder: v.backorder },
              images: (v.images ?? []).map((img, idx) => ({ url: img.url, altText: img.altText, isPrimary: img.isPrimary ?? idx === 0, sort: idx })),
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

  const attributeColumns = useMemo(() => {
    const names = Array.from(
      new Set(
        variants.flatMap((v) => Object.keys(v.attributes || {}))
      )
    );
    return names;
  }, [variants]);

  function addVariantImages(vIndex: number, urls: string[]) {
    const current = form.getValues("variants");
    const row = current[vIndex];
    const nextImages = [...(row.images ?? [])];
    for (const url of urls) {
      nextImages.push({ url, altText: undefined, isPrimary: nextImages.length === 0 });
    }
    const updatedRow: ProductFormValues["variants"][number] = { ...row, images: nextImages };
    current[vIndex] = updatedRow;
    form.setValue("variants", [...current]);
  }

  function clearVariantImages(vIndex: number) {
    const current = form.getValues("variants");
    const row = current[vIndex];
    const updatedRow: ProductFormValues["variants"][number] = { ...row, images: [] };
    current[vIndex] = updatedRow;
    form.setValue("variants", [...current]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((vals) => onSubmit(vals, false))} className="space-y-6">
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. T-shirt" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU / Product code</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional — must be unique if provided" {...field} />
                        </FormControl>
                        <FormDescription className="sr-only">Must be unique if provided.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea className="w-full min-h-28 rounded-md border px-3 py-2 text-sm" placeholder="Describe the product" {...field} />
                      </FormControl>
                      <FormDescription>Rich text editor can be added later.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Categories</FormLabel>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Input
                      placeholder="Type and press Enter or comma"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addCategoryFromInput();
                        }
                      }}
                      className="w-64"
                    />
                    <DropdownMenu open={categoryMenuOpen} onOpenChange={(o) => { setCategoryMenuOpen(o); if (o) { setCategoryFilter(""); setCategoryHighlight(0); } }}>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm">Browse…</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-64 p-2">
                        <div className="space-y-2">
                          <Input
                            autoFocus
                            placeholder="Search categories…"
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); setCategoryHighlight(0); }}
                            onKeyDown={onCategoryFilterKeyDown}
                          />
                          <div className="max-h-60 overflow-auto rounded border">
                            {(() => {
                              const term = categoryFilter.trim();
                              const items = filteredCategories;
                              const canCreate = term.length > 0 && !allCategories.some((c) => c.toLowerCase() === term.toLowerCase());
                              return (
                                <div>
                                  {items.length === 0 && !canCreate ? (
                                    <div className="px-2 py-2 text-sm text-muted-foreground">No results</div>
                                  ) : null}
                                  {items.map((c, idx) => (
                                    <Button
                                      key={c}
                                      type="button"
                                      variant="ghost"
                                      className={`w-full justify-start ${idx === categoryHighlight ? "bg-muted" : ""}`}
                                      onMouseEnter={() => setCategoryHighlight(idx)}
                                      onClick={() => { addCategory(c); setCategoryMenuOpen(false); }}
                                    >
                                      {c}
                                    </Button>
                                  ))}
                                  {canCreate ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      className={`w-full justify-start ${categoryHighlight === items.length ? "bg-muted" : ""}`}
                                      onMouseEnter={() => setCategoryHighlight(items.length)}
                                      onClick={() => { addCategory(term); setCategoryMenuOpen(false); }}
                                    >
                                      Create “{term}”
                                    </Button>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button type="button" onClick={addCategoryFromInput}>Add</Button>
                    <Button type="button" variant="outline" asChild>
                      <a href={`/admin/${storeId}/categories`}>Manage</a>
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.from(new Set(form.watch("categories") || [])).map((cat) => (
                      <span key={cat} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                        {cat}
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(cat)} aria-label={`Remove ${cat}`}>
                          <X className="size-3" />
                        </Button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasVariants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variants</FormLabel>
                        <div className="flex items-center gap-2">
                          <input id="hasVariants" type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                          <label htmlFor="hasVariants" className="text-sm">This product has variants (e.g. size, color)</label>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-4">
                <div className="flex flex-col gap-2">
                  <UploadButton<OurFileRouter, "productImage">
                    endpoint="productImage"
                    onClientUploadComplete={(files: { url?: string; serverData?: { url?: string }; file?: { url?: string } }[]) => {
                      const urls = (files || []).map((f) => f?.url ?? f?.serverData?.url ?? f?.file?.url).filter(Boolean) as string[];
                      if (urls.length > 0) addImages(urls);
                    }}
                    onUploadError={(e) => { toast.error(e.message || "Upload failed"); }}
                    appearance={{ container: "w-fit", button: "inline-flex items-center gap-2" as unknown as string }}
                    content={{ button: ({ ready }) => (<span className="inline-flex items-center gap-2"><ImageIcon className="size-4" /> {ready ? "Upload images" : "Preparing…"}</span>) }}
                  />
<p className="text-xs text-muted-foreground">{hasVariants ? "Set a Primary image used when a variant has no image. Drag to reorder." : "Drag to reorder. Click \"Make primary\" to set default image."}</p>
                </div>

                {images.length > 0 ? (
                  <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                    <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {images.map((img) => (
                          <SortableImageItem
                            key={img.id}
                            image={img}
                            onRemove={() => removeImage(img.id)}
                            onPrimary={() => setPrimaryImage(img.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-sm text-muted-foreground">No images uploaded yet.</div>
                )}
              </TabsContent>

              <TabsContent value="variants" className="space-y-4 w-full">
                {!hasVariants ? (
<div className="text-sm text-muted-foreground">Enable &quot;This product has variants&quot; to configure options and combinations.</div>
                ) : (
                  <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Options</h3>
                        <p className="text-xs text-muted-foreground">Define option names and values (e.g., Color: Red, Blue)</p>
                      </div>
                      <Button type="button" onClick={addOption} variant="outline" size="sm"><Plus className="size-4 mr-1" /> Add option</Button>
                    </div>
                    <div className="space-y-3">
                      {options.map((opt, idx) => (
                        <div key={opt.id} className="rounded-md border p-3">
                          <div className="flex items-center gap-2">
                            <Input value={opt.name} placeholder={`Option ${idx + 1} name`} onChange={(e) => updateOptionName(opt.id, e.target.value)} />
<Select value={opt.type} onValueChange={(v: "color" | "size" | "custom") => updateOptionType(opt.id, v)}>
                              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="color">Color</SelectItem>
                                <SelectItem value="size">Size</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button type="button" variant="ghost" onClick={() => removeOption(opt.id)} aria-label="Remove option">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Input placeholder={opt.type === 'size' ? "e.g., S, M, L" : opt.type === 'color' ? "e.g., Red, Blue" : "Add values (comma, space or Enter)"} onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "," || e.key === " ") {
                                e.preventDefault();
                                const target = e.target as HTMLInputElement;
                                addOptionValues(opt.id, target.value);
                                target.value = "";
                              }
                            }} />
                            <span className="text-xs text-muted-foreground">Press Enter to add</span>
                          </div>
                          {opt.values.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {opt.values.map((v) => (
                                <span key={v.id} className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
                                  {v.value}
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeOptionValue(opt.id, v.id)}>
                                    <X className="size-3" />
                                  </Button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Variants</h3>
                      {variants.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Define option values to auto-generate variants.</div>
                      ) : (
                        <div className="w-full overflow-x-auto rounded-md border">
                          <Table className="w-full text-sm">
                            <TableHeader>
                              <TableRow className="border-b bg-muted/50">
                                {attributeColumns.map((name) => (
                                  <TableHead key={name} className="px-2 py-2 text-left font-medium">{name}</TableHead>
                                ))}
                                <TableHead className="px-2 py-2 text-left font-medium">SKU</TableHead>
                                <TableHead className="px-2 py-2 text-left font-medium">Price ({form.watch("currency")})</TableHead>
                                <TableHead className="px-2 py-2 text-left font-medium">Qty</TableHead>
                                <TableHead className="px-2 py-2 text-left font-medium">Images</TableHead>
                                <TableHead className="px-2 py-2 text-left font-medium">Track</TableHead>
                                <TableHead className="px-2 py-2 text-left font-medium">Backorder</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {variants.map((row, idx) => (
                                <TableRow key={row.key} className="border-b last:border-0">
                                  {attributeColumns.map((name) => (
                                    <TableCell key={name} className="px-2 py-2">{row.attributes?.[name]}</TableCell>
                                  ))}
                                  <TableCell className="px-2 py-2 min-w-44">
                                    <Controller
                                      control={form.control}
                                      name={`variants.${idx}.sku` as unknown as FieldPath<ProductFormValues>}
                                      render={({ field }) => (
                                        <Input placeholder="SKU" value={(field.value as string | undefined) ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className="px-2 py-2 min-w-36">
                                    <Controller
                                      control={form.control}
                                      name={`variants.${idx}.price` as unknown as FieldPath<ProductFormValues>}
                                      render={({ field }) => (
                                        <Input type="number" step="0.01" min="0" value={field.value === undefined || field.value === null ? "" : (field.value as number | string)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className="px-2 py-2 min-w-24">
                                    <Controller
                                      control={form.control}
                                      name={`variants.${idx}.inventory` as unknown as FieldPath<ProductFormValues>}
                                      render={({ field }) => (
                                        <Input type="number" step="1" min="0" value={field.value === undefined || field.value === null ? "" : (field.value as number | string)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} disabled={!Boolean(form.watch(`variants.${idx}.trackInventory` as unknown as FieldPath<ProductFormValues>))} />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell className="px-2 py-2 min-w-44">
                                    <div className="flex items-center gap-2">
                                      <UploadButton<OurFileRouter, "productImage">
                                        endpoint="productImage"
                                        onClientUploadComplete={(files: { url?: string; serverData?: { url?: string }; file?: { url?: string } }[]) => {
                                          const urls = (files || []).map((f) => f?.url ?? f?.serverData?.url ?? f?.file?.url).filter(Boolean) as string[];
                                          if (urls.length > 0) addVariantImages(idx, urls);
                                        }}
                                        onUploadError={(e) => { toast.error(e.message || "Upload failed"); }}
                                        appearance={{ container: "w-fit", button: "inline-flex items-center gap-1 px-2 py-1 text-xs border rounded" as unknown as string }}
                                        content={{ button: ({ ready }) => (<span className="inline-flex items-center gap-1"><ImageIcon className="size-3" /> {ready ? "Add" : "…"}</span>) }}
                                      />
                                      {(() => {
                                        const imgs = (form.watch(`variants.${idx}.images` as unknown as FieldPath<ProductFormValues>) as unknown as ProductFormValues["variants"][number]["images"]) || [];
                                        return imgs.length ? (
                                          <div className="flex items-center gap-1">
                                            {imgs.slice(0, 2).map((im, i) => (
                                              <div key={`${i}-${im.url}`} className="relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={im.url} alt="thumb" className="h-6 w-6 rounded object-cover border" />
                                                {im.isPrimary ? (
                                                  <span className="absolute -top-1 -right-1 rounded bg-primary text-primary-foreground text-[9px] leading-none px-0.5">P</span>
                                                ) : null}
                                              </div>
                                            ))}
                                            {imgs.length > 2 ? (
                                              <span className="text-[10px] text-muted-foreground">+{imgs.length - 2}</span>
                                            ) : null}
                                          </div>
                                        ) : null;
                                      })()}
                                      <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setOpenVariantImagesIndex(idx)}>Manage</Button>
                                      {((form.watch(`variants.${idx}.images` as unknown as FieldPath<ProductFormValues>) as unknown as ProductFormValues["variants"][number]["images"]))?.length ? (
                                        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => clearVariantImages(idx)}>Clear</Button>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-2 py-2 min-w-24">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(form.watch(`variants.${idx}.trackInventory` as unknown as FieldPath<ProductFormValues>))}
                                      onChange={(e) => form.setValue(`variants.${idx}.trackInventory` as unknown as FieldPath<ProductFormValues>, e.target.checked)}
                                    />
                                  </TableCell>
                                  <TableCell className="px-2 py-2 min-w-24">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(form.watch(`variants.${idx}.backorder` as unknown as FieldPath<ProductFormValues>))}
                                      onChange={(e) => form.setValue(`variants.${idx}.backorder` as unknown as FieldPath<ProductFormValues>, e.target.checked)}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Default is GBP. Additional currencies can be enabled later.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ({form.watch("currency")})</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          {hasVariants ? "Base price for variants. Each variant can override." : "Standard price for this product."}
                        </FormDescription>
                        {storeSettings?.multiCurrency && storeSettings?.conversionRates && field.value ? (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {Object.entries(storeSettings.conversionRates).map(([ccy, rate]) => (
                              <div key={ccy}>
                                {ccy}: {(Number(field.value) * Number(rate || 0)).toFixed(2)}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale price (optional)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saleStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale start</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="saleEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale end</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {typeof openVariantImagesIndex === "number" && openVariantImagesIndex >= 0 ? (
              <VariantImagesDialog
                open={openVariantImagesIndex !== null}
                onOpenChange={(o) => setOpenVariantImagesIndex(o ? openVariantImagesIndex : null)}
images={form.getValues("variants")[openVariantImagesIndex!]?.images ?? []}
onChange={(next) => {
                  const current = form.getValues("variants");
                  const row = current[openVariantImagesIndex!];
                  const updatedRow: ProductFormValues["variants"][number] = { ...row, images: next };
                  current[openVariantImagesIndex!] = updatedRow;
                  form.setValue("variants", [...current]);
                }}
              />
            ) : null}

            <div className="flex items-center gap-2">
              <Button type="submit" variant="secondary" onClick={form.handleSubmit((vals) => onSubmit(vals, false))}>Save draft</Button>
              <Button type="button" onClick={form.handleSubmit((vals) => onSubmit(vals, true))}>Publish</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const ProductForm = React.memo(ProductFormContent);
ProductForm.displayName = "ProductForm";

export default ProductForm;

"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type FieldPath, type Resolver } from "react-hook-form";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { StyledUploadButton } from "@/components/ui/styled-upload-button";
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
import VariantImagesDialog from "@/components/domain/admin/products/variant-images-dialog";
import { productFormSchema, type ProductFormValues } from "@/lib/validation/form-schemas";
import { useProductForm } from "@/hooks/use-product-form";

// Sortable image item
const SortableImageItem = React.memo(function SortableImageItem({ image, onRemove, onPrimary }: { image: { id: string; url: string; isPrimary?: boolean }; onRemove: () => void; onPrimary: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="group relative overflow-hidden rounded-md border">
      <Image
        src={image.url}
        alt="product"
        width={112}
        height={112}
        className="h-28 w-28 object-cover"
        sizes="(max-width: 640px) 80px, 112px"
      />
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
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
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
    mode: "onBlur",
  });

  const productFormMethods = useProductForm(form, { storeId, onSubmitOverride });
  const { images, hasVariants, options, variants, attributeColumns, addCategory } = productFormMethods;

  const [categoryInput, setCategoryInput] = useState("");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categoryHighlight, setCategoryHighlight] = useState(0);
  const allCategories = React.useMemo(() => Array.from(new Set(storeSettings?.categories ?? [])), [storeSettings]);
  const filteredCategories = React.useMemo(() => {
    const term = categoryFilter.toLowerCase();
    return allCategories.filter((c) => c.toLowerCase().includes(term));
  }, [allCategories, categoryFilter]);

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
        productFormMethods.addCategory(filteredCategories[categoryHighlight]);
      } else if (canCreate) {
        productFormMethods.addCategory(term);
      }
      setCategoryMenuOpen(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setCategoryMenuOpen(false);
    }
  }

  const sensors = useSensors(useSensor(PointerSensor));
  const [openVariantImagesIndex, setOpenVariantImagesIndex] = React.useState<number | null>(null);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = productFormMethods.images.findIndex((i) => i.id === active.id);
    const newIndex = productFormMethods.images.findIndex((i) => i.id === over.id);
    const ordered = arrayMove(productFormMethods.images, oldIndex, newIndex);
    form.setValue(
      "images",
      ordered.map((img) => ({ ...img }))
    );
  }

  function addCategoryFromInput() {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
    const existing = new Set(form.getValues("categories"));
    const merged = [...existing, ...parts].filter(Boolean) as string[];
    form.setValue("categories", Array.from(new Set(merged)));
    setCategoryInput("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((vals) => productFormMethods.onSubmit(vals, false))} className="space-y-6">
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => productFormMethods.removeCategory(cat)} aria-label={`Remove ${cat}`}>
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
                  <StyledUploadButton
                    endpoint="productImage"
                    onComplete={(files) => {
                      const urls = files.map(f => f.url).filter(Boolean);
                      if (urls.length > 0) {
                        productFormMethods.addImages(urls);
                        toast.success("Images uploaded");
                      }
                    }}
                    onError={(e) => toast.error(e.message || "Upload failed")}
                    variant="default"
                    size="default"
                  >
                    <ImageIcon className="size-4" />
                    Upload images
                  </StyledUploadButton>
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
                            onRemove={() => productFormMethods.removeImage(img.id)}
                            onPrimary={() => productFormMethods.setPrimaryImage(img.id)}
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
                      <Button type="button" onClick={productFormMethods.addOption} variant="outline" size="sm"><Plus className="size-4 mr-1" /> Add option</Button>
                    </div>
                    <div className="space-y-3">
                      {options.map((opt, idx) => (
                        <div key={opt.id} className="rounded-md border p-3">
                          <div className="flex items-center gap-2">
                            <Input value={opt.name} placeholder={`Option ${idx + 1} name`} onChange={(e) => productFormMethods.updateOptionName(opt.id, e.target.value)} />
<Select value={opt.type} onValueChange={(v: "color" | "size" | "custom") => productFormMethods.updateOptionType(opt.id, v)}>
                              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="color">Color</SelectItem>
                                <SelectItem value="size">Size</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button type="button" variant="ghost" onClick={() => productFormMethods.removeOption(opt.id)} aria-label="Remove option">
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Input placeholder={opt.type === 'size' ? "e.g., S, M, L" : opt.type === 'color' ? "e.g., Red, Blue" : "Add values (comma, space or Enter)"} onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "," || e.key === " ") {
                                e.preventDefault();
                                const target = e.target as HTMLInputElement;
                                productFormMethods.addOptionValues(opt.id, target.value);
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
                                  <Button type="button" variant="ghost" size="icon" onClick={() => productFormMethods.removeOptionValue(opt.id, v.id)}>
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
                                      <StyledUploadButton
                                        endpoint="productImage"
                                        onComplete={(files) => {
                                          const urls = files.map(f => f.url).filter(Boolean);
                                          if (urls.length > 0) {
                                            productFormMethods.addVariantImages(idx, urls);
                                            toast.success("Variant images added");
                                          }
                                        }}
                                        onError={(e) => toast.error(e.message || "Upload failed")}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                      >
                                        <ImageIcon className="size-3" />
                                        Add
                                      </StyledUploadButton>
                                      {(() => {
                                        const imgs = (form.watch(`variants.${idx}.images` as unknown as FieldPath<ProductFormValues>) as unknown as ProductFormValues["variants"][number]["images"]) || [];
                                        return imgs.length ? (
                                          <div className="flex items-center gap-1">
                                            {imgs.slice(0, 2).map((im, i) => (
                                              <div key={`${i}-${im.url}`} className="relative">
                                                <Image
                                                  src={im.url}
                                                  alt="thumb"
                                                  width={24}
                                                  height={24}
                                                  className="h-6 w-6 rounded object-cover border"
                                                  sizes="24px"
                                                />
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
                                        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => productFormMethods.clearVariantImages(idx)}>Clear</Button>
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
              <Button type="submit" variant="secondary" onClick={form.handleSubmit((vals) => productFormMethods.onSubmit(vals, false))}>Save draft</Button>
              <Button type="button" onClick={form.handleSubmit((vals) => productFormMethods.onSubmit(vals, true))}>Publish</Button>
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
export type { ProductFormValues };

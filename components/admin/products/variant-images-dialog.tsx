"use client";

import * as React from "react";
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Image as ImageIcon } from "lucide-react";

export type VariantImage = { id?: string; url: string; altText?: string; isPrimary?: boolean };

function SortableThumb({ item, onRemove, onPrimary, onAltChange }: {
  item: VariantImage & { _id: string };
  onRemove: () => void;
  onPrimary: () => void;
  onAltChange: (alt: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item._id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="group rounded-md border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.altText || "variant"} className="h-24 w-full object-cover rounded" />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" className="bg-muted rounded p-1" {...attributes} {...listeners} aria-label="Drag">
          <GripVertical className="size-4" />
        </button>
        <button type="button" className={`rounded px-2 py-1 text-xs ${item.isPrimary ? "bg-primary text-primary-foreground" : "bg-muted"}`} onClick={onPrimary}>
          {item.isPrimary ? "Primary" : "Make primary"}
        </button>
        <button type="button" className="ml-auto text-xs underline" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="mt-2">
        <Input placeholder="Alt text" value={item.altText ?? ""} onChange={(e) => onAltChange(e.target.value)} />
      </div>
    </div>
  );
}

export default function VariantImagesDialog({ open, onOpenChange, images, onChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: VariantImage[];
  onChange: (next: VariantImage[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [items, setItems] = React.useState<(VariantImage & { _id: string })[]>([]);

  React.useEffect(() => {
    const withIds = (images || []).map((img, idx) => ({ _id: img.id || `${idx}-${Math.random().toString(36).slice(2,8)}`, ...img }));
    // ensure single primary
    const anyPrimary = withIds.some((i) => i.isPrimary);
    if (!anyPrimary && withIds.length > 0) withIds[0].isPrimary = true;
    setItems(withIds);
  }, [open, images]);

  function setPrimary(_id: string) {
    setItems((prev) => prev.map((i) => ({ ...i, isPrimary: i._id === _id })));
  }

  function remove(_id: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i._id !== _id);
      if (next.length > 0 && !next.some((i) => i.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i._id === active.id);
      const newIndex = prev.findIndex((i) => i._id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function addUrls(urls: string[]) {
    setItems((prev) => {
      const next = [...prev];
      for (const url of urls) next.push({ _id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, url, isPrimary: next.length === 0 });
      if (!next.some((i) => i.isPrimary) && next.length > 0) next[0].isPrimary = true;
      return next;
    });
  }

  function onSave() {
    const mapped = items.map((it) => ({ url: it.url, altText: it.altText, isPrimary: it.isPrimary, id: it.id }));
    onChange(mapped);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage variant images</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UploadButton<OurFileRouter, "productImage">
              endpoint="productImage"
              onClientUploadComplete={(files: { url?: string; serverData?: { url?: string }; file?: { url?: string } }[]) => {
                const urls = (files || []).map((f) => f?.url ?? f?.serverData?.url ?? f?.file?.url).filter(Boolean) as string[];
                if (urls.length > 0) addUrls(urls);
              }}
              appearance={{ container: "w-fit", button: "inline-flex items-center gap-2" as unknown as string }}
              content={{ button: ({ ready }) => (<span className="inline-flex items-center gap-2"><ImageIcon className="size-4" /> {ready ? "Upload" : "…"}</span>) }}
            />
            <span className="text-xs text-muted-foreground">Drag to reorder. Choose one Primary.</span>
          </div>

          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No images. Upload to add.</div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((i) => i._id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {items.map((it) => (
                    <SortableThumb
                      key={it._id}
                      item={it}
                      onRemove={() => remove(it._id)}
                      onPrimary={() => setPrimary(it._id)}
                      onAltChange={(alt) => setItems((prev) => prev.map((p) => p._id === it._id ? { ...p, altText: alt } : p))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

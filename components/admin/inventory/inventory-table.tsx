"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type VariantRowIn = { id: string; sku: string; price: number; inventory: number; attributes: unknown; product: { title: string } }[];

export default function InventoryTable({ storeId, initialVariants }: { storeId: string; initialVariants: VariantRowIn }) {
  const [rows, setRows] = React.useState(() => initialVariants.map(v => {
    const attrs = (v.attributes ?? null) as Record<string, unknown> | null;
    const trackInventory = attrs && typeof attrs["trackInventory"] === "boolean" ? (attrs["trackInventory"] as boolean) : true;
    const backorder = attrs && typeof attrs["backorder"] === "boolean" ? (attrs["backorder"] as boolean) : false;
    return {
      id: v.id,
      productTitle: v.product?.title ?? "",
      sku: v.sku,
      price: v.price,
      inventory: v.inventory,
      trackInventory,
      backorder,
    };
  }));
  const [busy, setBusy] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const [groupByProduct, setGroupByProduct] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => r.productTitle.toLowerCase().includes(s) || r.sku.toLowerCase().includes(s));
  }, [rows, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = React.useMemo(() => {
    if (groupByProduct) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, groupByProduct]);

  const groups = React.useMemo(() => {
    if (!groupByProduct) return null as null | Record<string, typeof rows>;
    const map: Record<string, typeof rows> = {} as Record<string, typeof rows>;
    for (const r of filtered) {
      (map[r.productTitle] ||= []).push(r);
    }
    return map;
  }, [filtered, groupByProduct]);

  async function saveRow(id: string) {
    const row = rows.find(r => r.id === id);
    if (!row) return;
    try {
      setBusy(id);
      const res = await fetch(`/api/stores/${storeId}/variants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: row.sku,
          price: Number(row.price),
          inventory: Number(row.inventory),
          trackInventory: row.trackInventory,
          backorder: row.backorder,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to save");
      toast.success("Saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input placeholder="Search product or SKU" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="w-64" />
          <Button variant="outline" size="sm" onClick={() => setGroupByProduct((v) => !v)}>
            {groupByProduct ? "Ungroup" : "Group by product"}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">{filtered.length} items {groupByProduct ? null : <>• Page {page} / {totalPages}</>}</div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="px-2 py-2 text-left font-medium">Product</TableHead>
            <TableHead className="px-2 py-2 text-left font-medium">SKU</TableHead>
            <TableHead className="px-2 py-2 text-left font-medium">Price</TableHead>
            <TableHead className="px-2 py-2 text-left font-medium">Qty</TableHead>
            <TableHead className="px-2 py-2 text-left font-medium">Track</TableHead>
            <TableHead className="px-2 py-2 text-left font-medium">Backorder</TableHead>
            <TableHead className="px-2 py-2 text-left font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupByProduct && groups
            ? Object.entries(groups).map(([productTitle, list]) => (
                <>
                  <TableRow key={`h-${productTitle}`} className="bg-muted/40">
                    <TableCell className="px-2 py-2 font-medium" colSpan={7}>
                      <Button variant="ghost" size="sm"
                        className="justify-start w-full"
                        onClick={() => setOpenGroups((prev) => ({ ...prev, [productTitle]: !prev[productTitle] }))}
                        type="button"
                      >
                        {openGroups[productTitle] === false ? "▶" : "▼"} {productTitle}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {(openGroups[productTitle] === false ? [] : list).map((r) => (
                    <TableRow key={r.id} className="border-b last:border-0">
                      <TableCell className="px-2 py-2 min-w-56">{r.productTitle}</TableCell>
                      <TableCell className="px-2 py-2 min-w-40">
                        <Input value={r.sku} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, sku: e.target.value } : p))} />
                      </TableCell>
                      <TableCell className="px-2 py-2 min-w-28">
                        <Input type="number" step="0.01" min="0" value={r.price} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, price: Number(e.target.value) } : p))} />
                      </TableCell>
                      <TableCell className="px-2 py-2 min-w-24">
                        <Input type="number" step="1" min="0" value={r.inventory} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, inventory: Number(e.target.value) } : p))} disabled={!r.trackInventory} />
                      </TableCell>
                      <TableCell className="px-2 py-2"><input type="checkbox" checked={r.trackInventory} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, trackInventory: e.target.checked } : p))} /></TableCell>
                      <TableCell className="px-2 py-2"><input type="checkbox" checked={r.backorder} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, backorder: e.target.checked } : p))} /></TableCell>
                      <TableCell className="px-2 py-2">
                        <Button size="sm" onClick={() => saveRow(r.id)} disabled={busy === r.id}>{busy === r.id ? "Saving…" : "Save"}</Button>
                      </TableCell>
                    </TableRow>
                  ))
                  }
                </>
              ))
            : paged.map((r) => (
                <TableRow key={r.id} className="border-b last:border-0">
                  <TableCell className="px-2 py-2 min-w-56">{r.productTitle}</TableCell>
                  <TableCell className="px-2 py-2 min-w-40">
                    <Input value={r.sku} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, sku: e.target.value } : p))} />
                  </TableCell>
                  <TableCell className="px-2 py-2 min-w-28">
                    <Input type="number" step="0.01" min="0" value={r.price} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, price: Number(e.target.value) } : p))} />
                  </TableCell>
                  <TableCell className="px-2 py-2 min-w-24">
                    <Input type="number" step="1" min="0" value={r.inventory} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, inventory: Number(e.target.value) } : p))} disabled={!r.trackInventory} />
                  </TableCell>
                  <TableCell className="px-2 py-2"><input type="checkbox" checked={r.trackInventory} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, trackInventory: e.target.checked } : p))} /></TableCell>
                  <TableCell className="px-2 py-2"><input type="checkbox" checked={r.backorder} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, backorder: e.target.checked } : p))} /></TableCell>
                  <TableCell className="px-2 py-2">
                    <Button size="sm" onClick={() => saveRow(r.id)} disabled={busy === r.id}>{busy === r.id ? "Saving…" : "Save"}</Button>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
      </div>
      {!groupByProduct && (
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

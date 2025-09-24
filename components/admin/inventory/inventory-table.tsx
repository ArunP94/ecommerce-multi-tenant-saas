"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm border rounded-md">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-2 py-2 text-left font-medium">Product</th>
            <th className="px-2 py-2 text-left font-medium">SKU</th>
            <th className="px-2 py-2 text-left font-medium">Price</th>
            <th className="px-2 py-2 text-left font-medium">Qty</th>
            <th className="px-2 py-2 text-left font-medium">Track</th>
            <th className="px-2 py-2 text-left font-medium">Backorder</th>
            <th className="px-2 py-2 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="px-2 py-2 min-w-56">{r.productTitle}</td>
              <td className="px-2 py-2 min-w-40">
                <Input value={r.sku} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, sku: e.target.value } : p))} />
              </td>
              <td className="px-2 py-2 min-w-28">
                <Input type="number" step="0.01" min="0" value={r.price} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, price: Number(e.target.value) } : p))} />
              </td>
              <td className="px-2 py-2 min-w-24">
                <Input type="number" step="1" min="0" value={r.inventory} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, inventory: Number(e.target.value) } : p))} disabled={!r.trackInventory} />
              </td>
              <td className="px-2 py-2"><input type="checkbox" checked={r.trackInventory} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, trackInventory: e.target.checked } : p))} /></td>
              <td className="px-2 py-2"><input type="checkbox" checked={r.backorder} onChange={(e) => setRows((prev) => prev.map(p => p.id === r.id ? { ...p, backorder: e.target.checked } : p))} /></td>
              <td className="px-2 py-2">
                <Button size="sm" onClick={() => saveRow(r.id)} disabled={busy === r.id}>{busy === r.id ? "Saving…" : "Save"}</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

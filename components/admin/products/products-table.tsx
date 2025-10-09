"use client";

import * as React from "react";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnFiltersState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export type ProductRow = {
  id: string;
  title: string;
  sku?: string | null;
  hasVariants: boolean;
  status?: string | null;
  updatedAt: string;
};

export default function ProductsTable({ storeId, data }: { storeId: string; data: ProductRow[] }) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>(undefined);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const router = useRouter();

  const onDelete = React.useCallback(async (id: string) => {
    try {
      setBusy(id);
      const res = await fetch(`/api/stores/${storeId}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to delete");
      toast.success("Product deleted");
      setConfirmId(null);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusy(null);
    }
  }, [router, storeId]);

  const columns = React.useMemo<ColumnDef<ProductRow>[]>(() => [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => row.original.title,
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => row.original.sku || "—",
    },
    {
      accessorKey: "hasVariants",
      header: "Type",
      cell: ({ row }) => (row.original.hasVariants ? "Variants" : "Single"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => row.original.status || "DRAFT",
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/${storeId}/products/${row.original.id}/edit`}>Edit</Link>
          </Button>
          <Dialog open={confirmId === row.original.id} onOpenChange={(o) => setConfirmId(o ? row.original.id : null)}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" onClick={() => setConfirmId(row.original.id)}>
                <Trash2 className="size-4 mr-1" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete product?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete &quot;{row.original.title}&quot; and its variants and images.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => onDelete(row.original.id)} disabled={busy === row.original.id}>
                  {busy === row.original.id ? "Deleting…" : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ),
    },
  ], [storeId, confirmId, busy, onDelete]);

  const columnFilters = React.useMemo<ColumnFiltersState>(() => (statusFilter ? [{ id: "status", value: statusFilter }] : []), [statusFilter]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const v = String(row.getValue(columnId) ?? "").toLowerCase();
      return v.includes(String(filterValue ?? "").toLowerCase());
    },
    filterFns: {},
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Filter title or SKU" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-64" />
        <Select value={statusFilter ?? "ALL"} onValueChange={(v) => setStatusFilter(v === "ALL" ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="w-full text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="px-2 py-2 cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}{" "}
                    {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-b last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-2 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnFiltersState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

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
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/${storeId}/products/${row.original.id}/edit`}>Edit</Link>
        </Button>
      ),
    },
  ], [storeId]);

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

      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded-md">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/50">
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-2 py-2 text-left font-medium cursor-pointer" onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}{" "}
                    {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ViewStoreLink } from "../view-store-link";
import { DeleteStoreButton } from "../delete-store-button";

export type StoreRow = {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
};

function StoresTableContent({ data }: { data: StoreRow[] }) {
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<StoreRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => `/${row.original.slug}`,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <ViewStoreLink slug={row.original.slug} customDomain={row.original.customDomain} />
            <DeleteStoreButton storeId={row.original.id} storeName={row.original.name} />
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
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
        <Input
          placeholder="Filter by name or slug"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="w-full text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/50">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`px-2 py-2 cursor-pointer ${header.column.id === "actions" ? "text-right" : ""}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
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

      {data.length === 0 && (
        <div className="text-sm text-muted-foreground">No stores yet.</div>
      )}
    </div>
  );
}

const StoresTable = React.memo(StoresTableContent);
StoresTable.displayName = "StoresTable";

export default StoresTable;

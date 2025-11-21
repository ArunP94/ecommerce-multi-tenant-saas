"use client";

import * as React from "react";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnFiltersState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export type UserRow = {
  id: string;
  email: string;
  role: string;
  storeName?: string | null;
};

function UsersTableContent({ data }: { data: UserRow[] }) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string | undefined>(undefined);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const router = useRouter();

  const onDelete = React.useCallback(
    async (id: string) => {
      try {
        setBusy(id);
        const res = await fetch(`/api/super-admin/users/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to delete");
        toast.success("User deleted");
        setConfirmId(null);
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      } finally {
        setBusy(null);
      }
    },
    [router]
  );

  const columns = React.useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.original.role;
          const variants: Record<string, "destructive" | "default" | "secondary"> = {
            SUPER_ADMIN: "destructive",
            OWNER: "default",
            STAFF: "secondary",
          };
          return (
            <Badge variant={variants[role] ?? "default"}>
              {role.replace("_", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "storeName",
        header: "Store",
        cell: ({ row }) => row.original.storeName || "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Dialog open={confirmId === row.original.id} onOpenChange={(o) => setConfirmId(o ? row.original.id : null)}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive" className="h-9 px-3" onClick={() => setConfirmId(row.original.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete user?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The user &quot;{row.original.email}&quot; will be permanently deleted.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmId(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(row.original.id)}
                    disabled={busy === row.original.id}
                  >
                    {busy === row.original.id ? "Deleting…" : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ),
      },
    ],
    [confirmId, busy, onDelete]
  );

  const columnFilters = React.useMemo<ColumnFiltersState>(
    () => (roleFilter ? [{ id: "role", value: roleFilter }] : []),
    [roleFilter]
  );

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
        <Input
          placeholder="Filter by email or store"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-64"
        />
        <Select value={roleFilter ?? "ALL"} onValueChange={(v) => setRoleFilter(v === "ALL" ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
          </SelectContent>
        </Select>
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
    </div>
  );
}

const UsersTable = React.memo(UsersTableContent);
UsersTable.displayName = "UsersTable";

export default UsersTable;

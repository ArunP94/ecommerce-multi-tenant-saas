"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface CategoriesTableProps {
  storeId: string;
  categories: string[];
}

export default function CategoriesTable({ storeId, categories }: CategoriesTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const router = useRouter();

  const filtered = React.useMemo(() => {
    const term = searchTerm.toLowerCase();
    return categories.filter((c) => c.toLowerCase().includes(term));
  }, [categories, searchTerm]);

  const onDelete = React.useCallback(
    async (name: string) => {
      try {
        setBusy(name);
        const res = await fetch(`/api/stores/${storeId}/categories/${encodeURIComponent(name)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to delete");
        toast.success("Category deleted");
        setConfirmDelete(null);
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to delete");
      } finally {
        setBusy(null);
      }
    },
    [storeId, router]
  );

  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">No categories yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Filter categories"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-2 py-2 text-left font-medium">Category</TableHead>
              <TableHead className="px-2 py-2 text-right font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c} className="border-b last:border-0">
                <TableCell className="px-2 py-2">{c}</TableCell>
                <TableCell className="px-2 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <Dialog open={confirmDelete === c} onOpenChange={(o) => setConfirmDelete(o ? c : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="h-9 px-3" onClick={() => setConfirmDelete(c)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete category?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. The category &quot;{c}&quot; will be permanently deleted.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => onDelete(c)}
                            disabled={busy === c}
                          >
                            {busy === c ? "Deleting…" : "Delete"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

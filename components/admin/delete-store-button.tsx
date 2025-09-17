"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type Props = {
  storeId: string;
  storeName: string;
};

export function DeleteStoreButton({ storeId, storeName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirmSchema = z.object({
    confirm: z.string().min(1, { message: "Please enter the store name" }).refine(
      (v) => v.trim() === storeName.trim(),
      { message: "Name did not match" }
    ),
  });
  const form = useForm<z.infer<typeof confirmSchema>>({
    resolver: zodResolver(confirmSchema),
    mode: "onChange",
    defaultValues: { confirm: "" },
  });

  const onConfirm = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/super-admin/stores/${storeId}`, { method: "DELETE" });
        if (!res.ok) {
          let msg = "Failed to delete store";
          try {
            const data = await res.json();
            if (data?.error) msg = data.error;
          } catch { }
          toast.error(msg);
          return;
        }
        toast.success("Store deleted");
        setOpen(false);
        form.reset();
        router.refresh();
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete store (network error)");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete store</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please type the store name exactly to confirm.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onConfirm)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`confirm-${storeId}`}>Store name</Label>
              <Input
                id={`confirm-${storeId}`}
                placeholder={storeName}
                autoFocus
                {...form.register("confirm")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={isPending || !form.formState.isValid}>
                {isPending ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

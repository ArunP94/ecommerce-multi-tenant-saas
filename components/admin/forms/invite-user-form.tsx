"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
  role: z.enum(["STORE_OWNER", "STAFF"]),
  storeId: z.string().min(1, { message: "Select a store" }),
});

export function InviteUserForm({ stores }: { stores: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { email: "", role: "STAFF", storeId: stores[0]?.id ?? "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/super-admin/users/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          let msg = "Failed to send invite";
          try { const data = await res.json(); if (data?.error) msg = typeof data.error === "string" ? data.error : "Validation error"; } catch {}
          toast.error(msg);
          return;
        }
        form.reset({ email: "", role: "STAFF", storeId: stores[0]?.id ?? "" });
        toast.success("Invitation sent");
      } catch {
        toast.error("Network error");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="user@example.com" {...form.register("email")} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <select id="role" className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...form.register("role")}>
            <option value="STAFF">Staff</option>
            <option value="STORE_OWNER">Store Owner</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="store">Store</Label>
          <select id="store" className="h-10 w-full rounded-md border bg-background px-3 text-sm" {...form.register("storeId")}>
            <option value="">Select…</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={isPending || !form.formState.isValid}>{isPending ? "Sending…" : "Send invite"}</Button>
        </div>
      </form>
    </Form>
  );
}

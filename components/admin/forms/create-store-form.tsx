"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  ownerEmail: z.string().email({ message: "Owner email is required" }),
  customDomain: z.string().optional(),
});

export function CreateStoreForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      ownerEmail: "",
      customDomain: "",
    },
  });

  function normalizeHostlike(input: string): string {
    let v = input.trim().toLowerCase();
    if (!v) return "";
    // Allow inputs like example.com, http(s)://example.com, example.com:3000/path
    try {
      if (v.includes("://")) {
        const url = new URL(v);
        v = url.hostname; // strips port and path
      } else {
        v = v.replace(/^\/+/, ""); // strip leading slashes
        v = v.split("/")[0]; // strip path
        v = v.split(":")[0]; // strip port
      }
    } catch {
      // If URL parsing fails, fallback to simple cleanup
      v = v.split("/")[0].split(":")[0];
    }
    return v;
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const params = new URLSearchParams();
      params.set("name", values.name.trim());
      params.set("ownerEmail", values.ownerEmail.trim());
      if (values.customDomain && values.customDomain.trim()) {
        const normalized = normalizeHostlike(values.customDomain);
        if (!normalized) {
          toast.error("Custom domain is invalid");
          return;
        }
        params.set("customDomain", normalized);
      }
      const res = await fetch("/api/super-admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      if (!res.ok) {
        let msg = "Failed to create store";
        try {
          const data = await res.json();
          if (data?.error) msg = typeof data.error === "string" ? data.error : "Validation error";
        } catch { }
        toast.error(msg);
        return;
      }
      form.reset();
      toast.success("Store created");
      router.refresh();
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ownerEmail">Owner Email</Label>
          <Input id="ownerEmail" type="email" {...form.register("ownerEmail")} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customDomain">Custom Domain (optional)</Label>
          <Input
            id="customDomain"
            type="url"
            placeholder="www.example.com"
            {...form.register("customDomain")}
          />
          <p className="text-xs text-muted-foreground">Enter only the host, e.g., <span className="font-medium">www.example.com</span> or <span className="font-medium">shop.localhost</span> (no http/https, path, or port).</p>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={isPending || !form.formState.isValid}>{isPending ? "Creating…" : "Create"}</Button>
        </div>
      </form>
    </Form>
  );
}

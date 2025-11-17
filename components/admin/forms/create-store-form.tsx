"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/forms/fields";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "@/hooks/use-form-state";
import { createStoreSchema, type CreateStoreFormValues } from "@/lib/validation/form-schemas";

export function CreateStoreForm() {
  const router = useRouter();
  const form = useForm<CreateStoreFormValues>({
    resolver: zodResolver(createStoreSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      ownerEmail: "",
      customDomain: "",
    },
  });

  const { isPending, startTransition } = useFormState(form, {
    successMessage: "Store created",
    errorMessage: "Failed to create store",
    onSuccess: () => form.reset(),
  });

  function normalizeHostlike(input: string): string {
    let v = input.trim().toLowerCase();
    if (!v) return "";
    try {
      if (v.includes("://")) {
        const url = new URL(v);
        v = url.hostname;
      } else {
        v = v.replace(/^\/+/, "");
        v = v.split("/")[0];
        v = v.split(":")[0];
      }
    } catch {
      v = v.split("/")[0].split(":")[0];
    }
    return v;
  }

  const onSubmit = async (values: CreateStoreFormValues) => {
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
      } catch {}
      throw new Error(msg);
    }
    router.refresh();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (values) => startTransition(() => onSubmit(values)))} className="grid gap-3 md:grid-cols-2">
        <FormInput
          name="name"
          label="Name"
          placeholder="Store name"
          className="md:col-span-2"
          required
        />
        <FormInput
          name="ownerEmail"
          label="Owner Email"
          type="email"
          placeholder="owner@example.com"
          className="md:col-span-2"
          required
        />
        <FormInput
          name="customDomain"
          label="Custom Domain (optional)"
          type="url"
          placeholder="www.example.com"
          description="Enter only the host, e.g., www.example.com or shop.localhost (no http/https, path, or port)."
          className="md:col-span-2"
        />
        <div className="md:col-span-2">
          <Button type="submit" disabled={isPending || !form.formState.isValid}>
            {isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

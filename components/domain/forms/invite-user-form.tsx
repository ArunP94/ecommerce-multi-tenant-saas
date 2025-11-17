"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput, FormSelect } from "@/components/domain/forms/fields";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "@/hooks/use-form-state";
import { inviteUserSchema, type InviteUserFormValues } from "@/lib/validation/form-schemas";

interface InviteUserFormProps {
  stores: { id: string; name: string }[];
}

export function InviteUserForm({ stores }: InviteUserFormProps) {
  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    mode: "onChange",
    defaultValues: { email: "", role: "STAFF", storeId: stores[0]?.id ?? "" },
  });

  const { isPending, startTransition } = useFormState(form, {
    successMessage: "Invitation sent",
    errorMessage: "Failed to send invite",
    onSuccess: () => form.reset({ email: "", role: "STAFF", storeId: stores[0]?.id ?? "" }),
  });

  const onSubmit = async (values: InviteUserFormValues) => {
    const res = await fetch("/api/super-admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      let msg = "Failed to send invite";
      try {
        const data = await res.json();
        if (data?.error) msg = typeof data.error === "string" ? data.error : "Validation error";
      } catch {}
      throw new Error(msg);
    }
  };

  const roleOptions = [
    { value: "STAFF", label: "Staff" },
    { value: "STORE_OWNER", label: "Store Owner" },
  ];

  const storeOptions = stores.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (values) => startTransition(() => onSubmit(values)))} className="grid gap-3 md:grid-cols-2">
        <FormInput
          name="email"
          label="Email"
          type="email"
          placeholder="user@example.com"
          className="md:col-span-2"
          required
        />
        <FormSelect
          name="role"
          label="Role"
          options={roleOptions}
        />
        <FormSelect
          name="storeId"
          label="Store"
          options={storeOptions}
          placeholder="Select a store"
        />
        <div className="md:col-span-2">
          <Button type="submit" disabled={isPending || !form.formState.isValid}>
            {isPending ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

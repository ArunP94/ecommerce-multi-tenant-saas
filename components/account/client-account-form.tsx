"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useTransition } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/context/user-context";

const schema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
});

export default function ClientAccountForm({ initialName }: { initialName: string; }) {
  const [isPending, startTransition] = useTransition();
  const { updateUser } = useUser();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: initialName },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const params = new URLSearchParams();
      params.set("name", values.name.trim());

      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      if (!res.ok) {
        toast.error("Failed to update profile");
        return;
      }

      toast.success("Profile updated");
      updateUser({ name: values.name.trim() }); // update context immediately
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your name" {...form.register("name")} />
        </div>
        <CardFooter className="p-0">
          <Button
            type="submit"
            className="min-w-24"
            disabled={isPending || !form.formState.isValid}
          >
            {isPending ? "Updating…" : "Update"}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}

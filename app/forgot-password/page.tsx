"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();

  const schema = z.object({ email: z.string().email({ message: "Enter a valid email" }) });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email }),
        });
        if (res.ok) {
          toast.success("If an account exists, a reset email has been sent.");
        } else {
          toast.error("Failed to send reset email");
        }
      } catch {
        toast.error("Network error");
      }
    });
  }

  return (
    <div className="min-h-svh grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            <Button type="submit" className="w-full" disabled={isPending || !form.formState.isValid}>Send reset link</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

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
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();

  const schema = z.object({
    email: z.string().email({ message: "Enter a valid email" }),
  });

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
      <div className="w-full max-w-3xl">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 md:p-10">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email and we’ll send you a reset link.
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...form.register("email")}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={isPending || !form.formState.isValid}
                >
                  {isPending ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link href="/signin" className="hover:underline">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

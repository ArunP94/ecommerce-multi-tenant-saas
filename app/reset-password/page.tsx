"use client";

import { useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [isPending, startTransition] = useTransition();

  const schema = z.object({
    password: z.string().min(8, { message: "Use at least 8 characters" }),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { password: "" },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: values.password }),
        });
        if (res.ok) {
          toast.success("Password updated");
          setTimeout(() => router.push("/signin"), 1200);
        } else {
          toast.error("Failed to update password");
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
              <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your new password below.
              </p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...form.register("password")}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={isPending || !form.formState.isValid}
                >
                  {isPending ? "Updating..." : "Update password"}
                </Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Changed your mind?{" "}
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

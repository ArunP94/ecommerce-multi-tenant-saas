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

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [isPending, startTransition] = useTransition();

  const schema = z.object({ password: z.string().min(8, { message: "Use at least 8 characters" }) });
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
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            <Button type="submit" className="w-full" disabled={isPending || !form.formState.isValid}>Update password</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

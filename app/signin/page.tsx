"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Link from "next/link";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export default function SignInPage() {
  const params = useSearchParams();
  const router = useRouter();
  const callbackUrl = params.get("callbackUrl") ?? "/admin";
  const [isPending, startTransition] = useTransition();

  const schema = z.object({
    email: z.string().email({ message: "Enter a valid email" }),
    password: z.string().min(1, { message: "Password is required" }),
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid credentials");
      } else {
        toast.success("Signed in");
        router.push(callbackUrl);
      }
    });
  }

  return (
    <div className="min-h-svh grid place-items-center p-6">
      <div className="w-full max-w-3xl">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 md:p-10">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground mt-1">Use your email and password.</p>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="you@example.com" type="email" {...form.register("email")} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">Forgot password?</Link>
                  </div>
                  <Input id="password" type="password" {...form.register("password")} />
                </div>
                <Button type="submit" disabled={isPending || !form.formState.isValid} className="w-full h-10">{isPending ? "Signing in..." : "Sign in"}</Button>
              </form>
            </Form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account? <Link href="#" className="hover:underline">Contact sales</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

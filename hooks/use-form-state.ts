"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface UseFormStateOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

interface UseFormStateReturn {
  isPending: boolean;
  startTransition: (callback: () => Promise<void>) => void;
}

export function useFormState(
  _form: unknown,
  options: UseFormStateOptions = {}
): UseFormStateReturn {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const {
    successMessage = "Success",
    errorMessage = "Something went wrong",
    onSuccess,
    onError,
    redirectTo,
  } = options;

  const handleTransition = (callback: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await callback();
        if (onSuccess) onSuccess();
        toast.success(successMessage);
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      } catch (error) {
        const msg = error instanceof Error ? error.message : errorMessage;
        if (onError) onError(msg);
        toast.error(msg);
      }
    });
  };

  return {
    isPending,
    startTransition: handleTransition,
  };
}

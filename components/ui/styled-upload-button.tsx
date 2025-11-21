"use client";

import * as React from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Loader2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
type ButtonSize = VariantProps<typeof buttonVariants>["size"];

interface UploadedFile {
  url: string;
}

interface StyledUploadButtonProps {
  endpoint: keyof OurFileRouter;
  onComplete?: (files: UploadedFile[]) => void;
  onError?: (error: Error) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

export function StyledUploadButton({
  endpoint,
  onComplete,
  onError,
  variant = "default",
  size = "default",
  className,
  children,
}: StyledUploadButtonProps) {
  const handleUploadComplete = (files: UploadedFile[]): void => {
    const urls = (files || [])
      .filter((file): file is UploadedFile => file?.url !== undefined)
      .map((file) => ({ url: file.url }));
    if (urls.length > 0) {
      onComplete?.(urls);
    }
  };

  const handleUploadError = (error: Error | { message?: string }): void => {
    const err = error instanceof Error ? error : new Error(String(error?.message || "Upload failed"));
    onError?.(err);
  };

  const getButtonStyles = (): string => {
    const baseStyles = buttonVariants({ variant, size });
    return className ? `${baseStyles} ${className}` : baseStyles;
  };

  const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const isLocalApi = typeof url === "string" && (url.startsWith("/api/uploadthing") || url.includes("localhost"));
    
    return fetch(input, {
      ...init,
      credentials: isLocalApi ? "include" : (init?.credentials ?? "omit"),
    });
  };

  return (
    <UploadButton<OurFileRouter, keyof OurFileRouter>
      endpoint={endpoint as keyof OurFileRouter}
      onClientUploadComplete={handleUploadComplete as (files: unknown[]) => void}
      onUploadError={handleUploadError as (error: Error) => void}
      fetch={customFetch}
      appearance={{
        container: "w-fit",
        button: getButtonStyles(),
        allowedContent: "hidden",
      }}
      content={{
        button: ({ isUploading }) => (
          isUploading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Uploading…
            </>
          ) : (
            children
          )
        ),
      }}
    />
  );
}

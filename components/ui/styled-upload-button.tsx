"use client";

import * as React from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StyledUploadButtonProps<T extends keyof OurFileRouter> {
  endpoint: T;
  onComplete?: (files: { url: string }[]) => void;
  onError?: (error: Error) => void;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children: React.ReactNode;
}

export function StyledUploadButton<T extends keyof OurFileRouter>({
  endpoint,
  onComplete,
  onError,
  variant = "default",
  size = "default",
  className,
  children,
}: StyledUploadButtonProps<T>) {
  return (
    <UploadButton<OurFileRouter, T>
      endpoint={endpoint}
      onClientUploadComplete={(files) => {
        const urls = files
          .map((f) => {
            const url = f?.url ?? f?.serverData?.url ?? f?.file?.url;
            return url ? { url } : null;
          })
          .filter((f): f is { url: string } => f !== null);
        if (urls.length > 0) {
          onComplete?.(urls);
        }
      }}
      onUploadError={(error) => {
        onError?.(error);
      }}
      appearance={{
        container: "w-fit",
        button: "", // Let wrapper handle all styling
        allowedContent: "hidden",
      }}
      content={{
        button: ({ ready, isUploading }) => (
          <Button
            type="button"
            variant={variant}
            size={size}
            disabled={!ready || isUploading}
            className={className}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              children
            )}
          </Button>
        ),
      }}
    />
  );
}

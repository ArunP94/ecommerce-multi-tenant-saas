"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function ClientAvatarUploader() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onRemove() {
    try {
      setBusy(true);
      setStatus("Removing…");
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      window.dispatchEvent(new CustomEvent("user:updated", { detail: { image: null } }));
      setStatus("Removed photo");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <UploadButton<OurFileRouter, "avatar">
        endpoint="avatar"
        onClientUploadComplete={(files: { url?: string; serverData?: { url?: string }; file?: { url?: string } }[]) => {
          try {
            const f = Array.isArray(files) && files.length > 0 ? files[0] : undefined;
            const url = f?.url ?? f?.serverData?.url ?? f?.file?.url;
            if (url) {
              window.dispatchEvent(new CustomEvent("user:updated", { detail: { image: url } }));
              setStatus("Uploaded successfully");
            } else {
              setStatus("Uploaded, but no URL returned");
            }
          } catch {
            setStatus("Upload finished, but failed to read response");
          }
        }}
        onUploadError={(e) => {
          const message = e.message || "Upload failed";
          setStatus(message);
          window.dispatchEvent(new CustomEvent("avatar:upload:error", { detail: { message } }));
        }}
        appearance={{
          container: "w-full",
          button: `${buttonVariants({ variant: "default", size: "default" })} w-full` as unknown as string,
        }}
        content={{
          button: ({ ready }) => (
            <span className="inline-flex items-center justify-center gap-2">
              <ImageUp className="size-4" />
              {ready ? "Upload photo" : "Preparing…"}
            </span>
          ),
        }}
      />

      <Button variant="destructive" className="w-full" onClick={onRemove} disabled={busy}>
        <Trash2 className="mr-2 size-4" /> Remove photo
      </Button>

      <p className="text-xs text-muted-foreground">PNG or JPG up to 4MB</p>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
      <p className="text-xs text-muted-foreground">This updates immediately after upload.</p>
    </div>
  );
}

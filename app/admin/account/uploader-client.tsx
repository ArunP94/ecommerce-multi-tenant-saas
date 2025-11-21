"use client";

import { useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StyledUploadButton } from "@/components/ui/styled-upload-button";

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
      <StyledUploadButton
        endpoint="avatar"
        onComplete={(files) => {
          const url = files?.[0]?.url;
          if (url) {
            window.dispatchEvent(new CustomEvent("user:updated", { detail: { image: url } }));
            setStatus("Uploaded successfully");
          } else {
            setStatus("Uploaded, but no URL returned");
          }
        }}
        onError={(e) => {
          const message = e.message || "Upload failed";
          setStatus(message);
          window.dispatchEvent(new CustomEvent("avatar:upload:error", { detail: { message } }));
        }}
        className="w-full"
      >
        <span className="inline-flex items-center justify-center gap-2">
          <ImageUp className="size-4" />
          Upload photo
        </span>
      </StyledUploadButton>

      <Button variant="destructive" className="w-full" onClick={onRemove} disabled={busy}>
        <Trash2 className="mr-2 size-4" /> Remove photo
      </Button>

      <p className="text-xs text-muted-foreground">PNG or JPG up to 4MB</p>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
      <p className="text-xs text-muted-foreground">This updates immediately after upload.</p>
    </div>
  );
}

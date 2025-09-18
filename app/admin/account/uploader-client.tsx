"use client";

import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useState } from "react";

export default function ClientAvatarUploader() {
  const [status, setStatus] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <UploadDropzone<OurFileRouter, "avatar">
        endpoint="avatar"
        onClientUploadComplete={() => setStatus("Uploaded!")}
        onUploadError={(e) => setStatus(e.message)}
        appearance={{ container: "rounded-md border border-dashed p-4" }}
        content={{
          uploadIcon: () => null,
        }}
      />
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}

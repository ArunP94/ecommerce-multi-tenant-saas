"use client";

import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ClientAvatarUploader({
  onPreview,
}: {
  onPreview?: (url: string) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const containerClass = `rounded-md border border-dashed p-4 ${isUploading ? "opacity-60 pointer-events-none" : ""
    }`;

  return (
    <div className="flex flex-col gap-2">
      <UploadDropzone<OurFileRouter, "avatar">
        endpoint="avatar"
        // Fires when user drops/selects a file
        onDrop={(acceptedFiles) => {
          if (acceptedFiles?.[0]) {
            const url = URL.createObjectURL(acceptedFiles[0]);
            onPreview?.(url); // tell parent to show preview in the square
          }
        }}
        onUploadBegin={() => {
          setIsUploading(true);
          setStatus("Uploading…");
        }}
        onClientUploadComplete={() => {
          setIsUploading(false);
          setStatus("Uploaded!");
          toast.success("Avatar uploaded");
          // Refresh server component data so new user.image shows
          router.refresh();
        }}
        onUploadError={(e) => {
          setIsUploading(false);
          setStatus(e.message);
          toast.error(e.message || "Upload failed");
          console.error("UploadThing error:", e);
        }}
        appearance={{ container: containerClass }}
        content={{
          uploadIcon: () => null,
        }}
      />

      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}

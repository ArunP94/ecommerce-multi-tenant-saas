"use client";

import { useEffect, useState } from "react";

export default function ClientAvatarPreview({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => setUrl(initialUrl), [initialUrl]);

  useEffect(() => {
    const onUpdated = (event: Event) => {
      const e = event as CustomEvent<{ image?: string | null }>;
      if (e.detail?.image !== undefined) setUrl(e.detail.image ?? null);
      setUploading(false);
      setError(null);
      setProgress(null);
    };
    const onStart = () => {
      setUploading(true);
      setError(null);
      setProgress(null);
    };
    const onProgress = (event: Event) => {
      const e = event as CustomEvent<{ progress?: number }>
      if (typeof e.detail?.progress === "number") setProgress(e.detail.progress);
    };
    const onError = (event: Event) => {
      const e = event as CustomEvent<{ message?: string }>;
      setUploading(false);
      setError(e.detail?.message || "Upload failed");
    };

    window.addEventListener("user:updated", onUpdated as EventListener);
    window.addEventListener("avatar:upload:start", onStart as EventListener);
    window.addEventListener("avatar:upload:progress", onProgress as EventListener);
    window.addEventListener("avatar:upload:error", onError as EventListener);

    return () => {
      window.removeEventListener("user:updated", onUpdated as EventListener);
      window.removeEventListener("avatar:upload:start", onStart as EventListener);
      window.removeEventListener("avatar:upload:progress", onProgress as EventListener);
      window.removeEventListener("avatar:upload:error", onError as EventListener);
    };
  }, []);

  return (
    <div className="relative size-16 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="avatar" className="absolute inset-0 size-full object-cover" />
      ) : null}

      {uploading && (
        <div className="absolute inset-0 grid place-items-center bg-black/50 text-white text-[10px]">
          <div className="flex items-center gap-1">
            <span className="inline-block size-3 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
            <span>{progress ? `Uploading… ${Math.round(progress)}%` : "Uploading…"}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-red-500/70 text-white text-[10px]">
          <span className="px-1 text-center">{error}</span>
        </div>
      )}
    </div>
  );
}

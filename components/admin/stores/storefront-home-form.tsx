"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export type HomeSettings = {
  title?: string; // optional override for store.name
  subtitle?: string;
  kicker?: string; // small label above the title (e.g., WOMEN)
  heroImageUrl?: string;
  ctaPrimary?: { label?: string; href?: string };
  ctaSecondary?: { label?: string; href?: string };
  align?: "left" | "center" | "right";
};

export default function StorefrontHomeForm({ storeId, initial, storeName }: { storeId: string; initial: HomeSettings; storeName: string }) {
  const [title, setTitle] = React.useState(initial.title ?? "");
  const [subtitle, setSubtitle] = React.useState(initial.subtitle ?? "");
  const [kicker, setKicker] = React.useState(initial.kicker ?? "");
  const [heroUrl, setHeroUrl] = React.useState(initial.heroImageUrl ?? "");
  const [ctaPrimaryLabel, setCtaPrimaryLabel] = React.useState(initial.ctaPrimary?.label ?? "");
  const [ctaPrimaryHref, setCtaPrimaryHref] = React.useState(initial.ctaPrimary?.href ?? "");
  const [ctaSecondaryLabel, setCtaSecondaryLabel] = React.useState(initial.ctaSecondary?.label ?? "");
  const [ctaSecondaryHref, setCtaSecondaryHref] = React.useState(initial.ctaSecondary?.href ?? "");
  const [align, setAlign] = React.useState<HomeSettings["align"]>(initial.align ?? "center");
  const [saving, setSaving] = React.useState(false);

  async function onSave() {
    try {
      setSaving(true);
      const res = await fetch(`/api/stores/${storeId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          home: {
            title: title.trim() || undefined,
            subtitle: subtitle.trim() || undefined,
            heroImageUrl: heroUrl || undefined,
            kicker: kicker.trim() || undefined,
            ctaPrimary: { label: ctaPrimaryLabel.trim() || undefined, href: ctaPrimaryHref.trim() || undefined },
            ctaSecondary: { label: ctaSecondaryLabel.trim() || undefined, href: ctaSecondaryHref.trim() || undefined },
            align,
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to save");
      toast.success("Storefront home saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Headline (optional, defaults to store name)</Label>
              <Input id="title" placeholder={storeName} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" placeholder="Discover the collection" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kicker">Section label (kicker)</Label>
              <Input id="kicker" placeholder="WOMEN" value={kicker} onChange={(e) => setKicker(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Primary CTA</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Label" value={ctaPrimaryLabel} onChange={(e) => setCtaPrimaryLabel(e.target.value)} />
                <Input placeholder="https://…" value={ctaPrimaryHref} onChange={(e) => setCtaPrimaryHref(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary CTA</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Label" value={ctaSecondaryLabel} onChange={(e) => setCtaSecondaryLabel(e.target.value)} />
                <Input placeholder="https://…" value={ctaSecondaryHref} onChange={(e) => setCtaSecondaryHref(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Headline alignment</Label>
              <div className="flex items-center gap-2 text-sm">
                {(["left", "center", "right"] as const).map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-1">
                    <input type="radio" name="align" value={opt} checked={align === opt} onChange={() => setAlign(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="space-y-2">
              <Label>Hero image</Label>
              <div className="aspect-[16/9] w-full overflow-hidden rounded-md border bg-muted">
                {heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroUrl} alt="Hero" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">No image selected</div>
                )}
              </div>
              <UploadButton<OurFileRouter, "storeHero">
                endpoint="storeHero"
                onClientUploadComplete={(files) => {
                  try {
                    const f = Array.isArray(files) && files.length > 0 ? files[0] : undefined;
                    const url = (f as any)?.url ?? (f as any)?.serverData?.url ?? (f as any)?.file?.url;
                    if (url) {
                      setHeroUrl(url);
                      toast.success("Hero image uploaded");
                    } else {
                      toast.error("Upload finished, but no URL returned");
                    }
                  } catch {
                    toast.error("Upload finished, but failed to read response");
                  }
                }}
                onUploadError={(e) => { toast.error(e.message || "Upload failed"); }}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        {heroUrl && (
          <Button type="button" variant="outline" onClick={() => setHeroUrl("")}>Remove image</Button>
        )}
      </CardFooter>
    </Card>
  );
}
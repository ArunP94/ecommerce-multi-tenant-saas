"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Settings = {
  currency?: string;
  multiCurrency?: boolean;
  conversionRates?: Record<string, number>;
};

export default function StoreSettingsForm({ storeId, initial }: { storeId: string; initial: Settings }) {
  const [currency, setCurrency] = React.useState(initial.currency ?? "GBP");
  const [multi, setMulti] = React.useState(Boolean(initial.multiCurrency));
  const [rates, setRates] = React.useState<Record<string, number>>(initial.conversionRates ?? {});
  const [newCcy, setNewCcy] = React.useState("");
  const [newRate, setNewRate] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  function addRate() {
    const code = newCcy.trim().toUpperCase();
    const rate = Number(newRate);
    if (!code || !isFinite(rate) || rate <= 0) {
      toast.error("Enter valid currency code and rate");
      return;
    }
    setRates((prev) => ({ ...prev, [code]: rate }));
    setNewCcy("");
    setNewRate("");
  }

  function removeRate(code: string) {
    const next = { ...rates };
    delete next[code];
    setRates(next);
  }

  async function onSave() {
    try {
      setSaving(true);
      const res = await fetch(`/api/stores/${storeId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, multiCurrency: multi, conversionRates: rates }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to save");
      toast.success("Settings saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium">Default currency</div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <input id="multi" type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
          <label htmlFor="multi" className="text-sm">Enable multi-currency (conversion preview)</label>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium">Conversion rates (per 1 {currency})</div>
        <div className="mt-2 space-y-2">
          {Object.keys(rates).length === 0 ? (
            <div className="text-xs text-muted-foreground">No rates added</div>
          ) : (
            <div className="flex flex-col gap-2">
              {Object.entries(rates).map(([ccy, rate]) => (
                <div key={ccy} className="flex items-center gap-2">
                  <div className="w-24 text-sm font-mono">{ccy}</div>
                  <Input className="w-40" type="number" step="0.0001" min="0" value={rate} onChange={(e) => setRates((prev) => ({ ...prev, [ccy]: Number(e.target.value) }))} />
                  <Button variant="ghost" size="sm" onClick={() => removeRate(ccy)}>Remove</Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input className="w-24" placeholder="Code" value={newCcy} onChange={(e) => setNewCcy(e.target.value)} />
          <Input className="w-40" placeholder="Rate" type="number" step="0.0001" min="0" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
          <Button variant="outline" size="sm" onClick={addRate}>Add</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
      </div>
    </div>
  );
}

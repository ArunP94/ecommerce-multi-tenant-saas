"use client";

import { useState, useTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoreIcon } from "lucide-react";

type StoreOption = { id: string; name: string; };

export function StoreSelector({
  stores,
  currentStoreId,
  readOnly,
}: {
  stores: StoreOption[];
  currentStoreId: string | null;
  readOnly?: boolean;
}) {
  const [value, setValue] = useState(currentStoreId ?? undefined);
  const [, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setValue(currentStoreId ?? undefined), [currentStoreId]);

  const onChange = (val: string) => {
    setValue(val);
    startTransition(async () => {
      // Replace or inject the storeId segment after /admin
      let nextPath = `/admin/${val}`;
      try {
        const segments = pathname.split("/").filter(Boolean);
        const adminIndex = segments.indexOf("admin");
        if (adminIndex !== -1) {
          const afterAdmin = segments.slice(adminIndex + 1);
          if (afterAdmin.length > 0) {
            const candidate = afterAdmin[0];
            const knownStoreIds = new Set(stores.map((s) => s.id));
            if (knownStoreIds.has(candidate)) {
              // Replace store segment
              afterAdmin[0] = val;
            } else {
              // Insert store segment
              afterAdmin.unshift(val);
            }
            nextPath = `/${[...segments.slice(0, adminIndex + 1), ...afterAdmin].join("/")}`;
          }
        }
      } catch { }
      // Persist last-opened store for SUPER_ADMIN defaulting
      try {
        await fetch("/api/me/store", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ storeId: val }),
        });
      } catch { }
      router.push(nextPath);
    });
  };

  if (readOnly) {
    return (
      <div className="text-sm text-muted-foreground">
        {stores.find((s) => s.id === value)?.name || "Store"}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm">
        <SelectValue placeholder="Select store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <StoreIcon />
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import { useEffect, useState } from "react";

export function ClientOnly({ children, skeleton }: { children: React.ReactNode; skeleton?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{skeleton ?? null}</>;
  return <>{children}</>;
}

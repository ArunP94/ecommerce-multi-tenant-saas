export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeComboKey(attrs: Record<string, string>): string {
  return Object.keys(attrs)
    .sort()
    .map((k) => `${k}:${attrs[k]}`)
    .join("|");
}

export function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce<T[][]>((acc, curr) => {
    if (acc.length === 0) return curr.map((v) => [v]);
    const next: T[][] = [];
    for (const a of acc) {
      for (const c of curr) {
        next.push([...a, c]);
      }
    }
    return next;
  }, []);
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeOptions(options: Array<{ id?: string; name: string; type: string; values?: Array<{ id?: string; value: string; hex?: string }> }>) {
  let changed = false;
  const normalized = options.map((o, oi) => {
    const id = o.id && o.id.length ? o.id : `opt-${oi}-${slugify(o.name || "option")}-${Math.random().toString(36).slice(2, 6)}`;
    if (!o.id) changed = true;
    const values = (o.values ?? []).map((v, vi) => {
      const vid = v.id && v.id.length ? v.id : `optv-${oi}-${vi}-${slugify(v.value || "value")}-${Math.random().toString(36).slice(2, 6)}`;
      if (!v.id) changed = true;
      return { id: vid, value: v.value, hex: v.hex };
    });
    return { id, name: o.name, type: o.type, values };
  });
  return { normalized, changed };
}

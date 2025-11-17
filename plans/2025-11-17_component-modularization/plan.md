# Spec Provenance

**Date**: 2025-11-17  
**Stakeholder**: Internal team  
**Context**: Existing Next.js 15 e-commerce multi-tenant SaaS with Prisma (MongoDB), NextAuth, Shadcn UI components scattered across `components/{admin,ui,forms,storefront}`. Team experiencing duplication (rebuilding components), discovery friction (hard to find reusable pieces), and consistency drift (spacing, error states, loading patterns vary across pages).

---

# Spec Header

**Name**: Component Modularization & Design System Foundation  
**Smallest Scope**: Refactor existing components into discoverable modules with barrel exports; extract 5–7 common patterns (page layouts, data tables, status badges, metric cards, confirmation dialogs); document component inventory; establish conventions for spacing, loading states, and error handling.  
**Non-Goals**: Full design system with Storybook; theming beyond existing `next-themes`; migration to headless UI library; visual redesign; introducing new component libraries.

---

# Paths to Supplementary Guidelines

- **Tech Stack**: https://raw.githubusercontent.com/memextech/templates/refs/heads/main/stack/fullstack_app.md (Next.js 15 App Router + Tailwind CSS patterns)
- **Design**: Current codebase uses dark-modern aesthetic with Shadcn UI (Radix primitives + CVA variants); maintain existing design language while systematizing patterns

---

# Decision Snapshot

| Concern | Options | Choice | Rationale |
|---------|---------|--------|-----------|
| **Discovery** | (a) Keep flat folders with better naming; (b) Add barrel exports (`index.ts`) per module; (c) Monorepo with `@repo/ui` package | **(b) Barrel exports** | Low effort, immediate DX win; enables `import { X, Y } from "@/components/patterns"` instead of deep imports; prepares for future package extraction if needed |
| **Duplication** | (a) Extract patterns on-demand; (b) Batch refactor top 10 duplicated patterns now | **(b) Batch refactor 5–7 patterns** | Front-load value; patterns already visible in codebase (page headers, tables with filters, metric cards, status badges, delete confirmations) |
| **Consistency** | (a) Document conventions in README; (b) Create composable layout primitives; (c) Linter rules for spacing/naming | **(b) Layout primitives + conventions doc** | Primitives enforce patterns (e.g., `PageHeader`, `PageSection`); conventions doc captures decisions (error toasts, loading skeletons, status colors) |
| **File structure** | (a) Keep existing 4 folders; (b) Consolidate to `components/{patterns,primitives,domain,ui}`; (c) Feature-based folders | **(b) Flatten to 4 categories** | `patterns` = composed reusables (DataTableWithFilters); `primitives` = layout building blocks (PageHeader); `domain` = business logic wrappers (ProductCard); `ui` = Shadcn atomics unchanged |
| **Testing** | (a) Unit test extracted components; (b) Integration tests at page level; (c) Visual regression (Chromatic) | **(b) Integration tests** | Playwright E2E already in place; extracted patterns will be covered by existing page tests; defer unit tests until patterns stabilize |

---

# Architecture at a Glance

## Current Structure (Before)
```
components/
├── ui/              # 30+ Shadcn components (button, input, card, table…)
├── forms/fields/    # 4 form field wrappers (FormInput, FormSelect…) ✅ Has barrel export
├── admin/           # 15+ mixed admin components (headers, tables, forms, delete buttons)
├── storefront/      # 3 storefront-specific components
└── core/            # 1 client-only utility
```
**Issues**: No barrel exports (except `forms/fields`); admin components mix concerns (tables, forms, delete logic); duplication across `products-table.tsx`, `inventory-table.tsx`, `orders-table.tsx`; page-level patterns (headers, metric cards) repeated inline.

## Target Structure (After)
```
components/
├── ui/                           # Shadcn primitives (unchanged)
├── primitives/                   # Layout & structural building blocks
│   ├── page-header.tsx           # title + description + action slot
│   ├── page-section.tsx          # consistent spacing wrapper
│   ├── metric-card.tsx           # revenue/stats card pattern
│   ├── status-badge.tsx          # unified status styling (uses lib/utils statusConfig)
│   └── index.ts                  # barrel export
├── patterns/                     # Composed reusable components
│   ├── data-table/               # Generic filterable/sortable table
│   │   ├── data-table.tsx        # Core table logic (@tanstack/react-table)
│   │   ├── table-filters.tsx     # Search + select filter row
│   │   ├── table-pagination.tsx  # Prev/next + page count
│   │   └── index.ts
│   ├── confirmation-dialog.tsx   # Delete/action confirmation wrapper
│   ├── empty-state.tsx           # "No items" placeholder pattern
│   └── index.ts
├── domain/                       # Business-specific compositions
│   ├── admin/
│   │   ├── product-table.tsx     # Uses patterns/data-table with product columns
│   │   ├── inventory-table.tsx   # Uses patterns/data-table with variant columns
│   │   ├── orders-table.tsx      # Uses patterns/data-table with order columns
│   │   ├── store-selector.tsx    # (unchanged, domain-specific)
│   │   └── index.ts
│   ├── storefront/
│   │   └── index.ts
│   └── forms/                    # Domain form components
│       ├── fields/               # (move from top-level)
│       │   ├── form-input.tsx
│       │   ├── form-select.tsx
│       │   ├── form-textarea.tsx
│       │   ├── form-checkbox.tsx
│       │   └── index.ts
│       ├── invite-user-form.tsx  # (moved from admin/forms)
│       └── index.ts
└── core/                         # Framework utilities (unchanged)
    └── client-only.tsx
```

**Key Moves**:
1. **Extract primitives**: `PageHeader`, `PageSection`, `MetricCard`, `StatusBadge` → enable consistent page scaffolding
2. **Extract patterns**: Generic `DataTable` with filter/pagination → reuse across products/inventory/orders
3. **Consolidate domain**: `components/domain/admin/` holds business-specific table configs; `components/domain/forms/` holds all form abstractions
4. **Barrel exports everywhere**: Every folder gets `index.ts` for clean imports

---

# Implementation Plan

## Phase 1: Infrastructure (Barrel Exports & Folder Structure)
**Goal**: Enable clean imports; prepare for extractions  
**Time**: 1–2 hours

1. **Create new folders**:
   ```bash
   mkdir -p components/{primitives,patterns,domain/admin,domain/forms,domain/storefront}
   ```

2. **Move form fields**:
   ```bash
   mv components/forms components/domain/forms
   ```
   Update imports in consuming files:
   ```diff
   - import { FormInput, FormSelect } from "@/components/forms/fields";
   + import { FormInput, FormSelect } from "@/components/domain/forms/fields";
   ```

3. **Create barrel exports** (examples):
   - `components/primitives/index.ts`:
     ```ts
     export { PageHeader } from "./page-header";
     export { PageSection } from "./page-section";
     export { MetricCard } from "./metric-card";
     export { StatusBadge } from "./status-badge";
     ```
   - `components/patterns/index.ts`:
     ```ts
     export * from "./data-table";
     export { ConfirmationDialog } from "./confirmation-dialog";
     export { EmptyState } from "./empty-state";
     ```
   - `components/domain/admin/index.ts`:
     ```ts
     export { ProductTable } from "./product-table";
     export { InventoryTable } from "./inventory-table";
     export { OrdersTable } from "./orders-table";
     export { StoreSelector } from "./store-selector";
     // ... other admin components
     ```

4. **Verification**: Run `bun run typecheck` and `bun run build` to catch broken imports.

---

## Phase 2: Extract Primitives (Layout Building Blocks)
**Goal**: Eliminate layout duplication; enforce consistent spacing  
**Time**: 2–3 hours

### 1. **PageHeader** (`components/primitives/page-header.tsx`)
**Pattern**: Title + description + optional action (button/link)  
**Current duplication**: 8+ pages repeat this pattern  
**Usage**:
```tsx
<PageHeader
  title="Products"
  description="Manage products for store Acme Co."
  action={
    <Button asChild>
      <Link href={`/admin/${storeId}/products/new`}>Create product</Link>
    </Button>
  }
/>
```

**Implementation**:
```tsx
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

**Refactor targets**: `app/admin/[storeId]/products/page.tsx`, `app/admin/[storeId]/inventory/page.tsx`, `app/admin/[storeId]/orders/page.tsx`, `app/admin/stores/page.tsx`, `app/admin/users/page.tsx`.

---

### 2. **PageSection** (`components/primitives/page-section.tsx`)
**Pattern**: Consistent vertical spacing wrapper  
**Current issue**: Mix of `space-y-4`, `space-y-3`, `gap-4` across pages  
**Usage**:
```tsx
<PageSection>
  <PageHeader ... />
  <SearchAndFilters ... />
  <DataTable ... />
</PageSection>
```

**Implementation**:
```tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  spacing?: "sm" | "md" | "lg";
}

const spacingMap = {
  sm: "space-y-3",
  md: "space-y-4",
  lg: "space-y-6",
};

export function PageSection({ children, className, spacing = "md" }: PageSectionProps) {
  return (
    <div className={cn("p-6", spacingMap[spacing], className)}>
      {children}
    </div>
  );
}
```

---

### 3. **MetricCard** (`components/primitives/metric-card.tsx`)
**Pattern**: Dashboard stat card (title, value, trend badge, footer description)  
**Current duplication**: `section-cards.tsx` hardcodes 4 cards; pattern will repeat in other dashboards  
**Usage**:
```tsx
<MetricCard
  title="Total Revenue"
  value="$1,250.00"
  trend={{ direction: "up", percentage: 12.5 }}
  footer="Trending up this month"
  description="Visitors for the last 6 months"
/>
```

**Implementation**:
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: { direction: "up" | "down"; percentage: number };
  footer?: string;
  description?: string;
}

export function MetricCard({ title, value, trend, footer, description }: MetricCardProps) {
  const TrendIcon = trend?.direction === "up" ? IconTrendingUp : IconTrendingDown;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant="outline">
              <TrendIcon />
              {trend.direction === "up" ? "+" : "-"}
              {trend.percentage}%
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {(footer || description) && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {footer && (
            <div className="line-clamp-1 flex gap-2 font-medium">
              {footer} <TrendIcon className="size-4" />
            </div>
          )}
          {description && (
            <div className="text-muted-foreground">{description}</div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
```

**Refactor target**: Replace `section-cards.tsx` with loop over metric data.

---

### 4. **StatusBadge** (`components/primitives/status-badge.tsx`)
**Pattern**: Unified status badge using `lib/utils` statusConfig  
**Current duplication**: Inline badge logic in `products-table.tsx`, `orders-table.tsx`  
**Usage**:
```tsx
<StatusBadge status="ACTIVE" />
<StatusBadge status="DRAFT" />
```

**Implementation**:
```tsx
import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from "@/lib/utils";

interface StatusBadgeProps {
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  return (
    <Badge
      variant="outline"
      className={`${config.bg} ${config.text} ${className ?? ""}`}
    >
      {config.label}
    </Badge>
  );
}
```

**Refactor targets**: `products-table.tsx`, `orders-table.tsx` (replace inline `Badge` + `getStatusConfig` calls).

---

## Phase 3: Extract Patterns (Composed Components)
**Goal**: Eliminate table/filter/pagination duplication  
**Time**: 3–4 hours

### 1. **DataTable Pattern** (`components/patterns/data-table/`)
**Current duplication**: `products-table.tsx`, `inventory-table.tsx`, `orders-table.tsx` all implement:
- @tanstack/react-table setup
- Global filter + status select filter
- Delete confirmation dialog
- Sortable columns

**New structure**:
```
components/patterns/data-table/
├── data-table.tsx         # Core table with @tanstack/react-table
├── table-filters.tsx      # Search input + optional select filters
├── table-pagination.tsx   # Prev/next buttons + page count
└── index.ts
```

**`data-table.tsx`** (Generic):
```tsx
"use client";

import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "../empty-state";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  columnFilters?: Record<string, unknown>;
  emptyMessage?: string;
}

export function DataTable<TData>({
  columns,
  data,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  emptyMessage = "No data available.",
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      columnFilters: columnFilters ? Object.entries(columnFilters).map(([id, value]) => ({ id, value })) : [],
    },
    onGlobalFilterChange,
  });

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table className="w-full text-sm">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted/50">
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`px-2 py-2 cursor-pointer ${
                    header.column.id === "actions" ? "text-right" : ""
                  }`}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}{" "}
                  {{ asc: "↑", desc: "↓" }[header.column.getIsSorted() as string] ?? null}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <EmptyState message={emptyMessage} />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border-b last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-2 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

**`table-filters.tsx`**:
```tsx
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  selectFilters?: Array<{
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
  }>;
}

export function TableFilters({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  selectFilters,
}: TableFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64"
      />
      {selectFilters?.map((filter, idx) => (
        <Select key={idx} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={filter.placeholder ?? "Filter"} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
```

**`table-pagination.tsx`**:
```tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  buildPageUrl: (page: number) => string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  buildPageUrl,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages} ({totalItems} items)
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="outline" disabled={currentPage <= 1}>
          <Link href={buildPageUrl(Math.max(1, currentPage - 1))}>Previous</Link>
        </Button>
        <Button asChild size="sm" variant="outline" disabled={currentPage >= totalPages}>
          <Link href={buildPageUrl(Math.min(totalPages, currentPage + 1))}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
```

---

### 2. **ConfirmationDialog** (`components/patterns/confirmation-dialog.tsx`)
**Current duplication**: Delete confirmation logic repeated in `products-table.tsx`, `delete-store-button.tsx`  
**Usage**:
```tsx
<ConfirmationDialog
  open={confirmId === row.id}
  onOpenChange={(open) => !open && setConfirmId(null)}
  title="Delete product?"
  description="This action cannot be undone."
  onConfirm={() => handleDelete(row.id)}
  confirmLabel="Delete"
  confirmVariant="destructive"
/>
```

**Implementation**:
```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string | ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  isPending?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  isPending = false,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 3. **EmptyState** (`components/patterns/empty-state.tsx`)
**Pattern**: Placeholder when lists are empty  
**Current**: Already exists in `components/ui/empty-state.tsx` (move to `patterns/`)  
**Refactor**: Move file and update imports.

---

## Phase 4: Domain-Specific Tables (Use Extracted Patterns)
**Goal**: Replace duplicated table logic with composed patterns  
**Time**: 2–3 hours

**Example: Refactor `ProductTable`** (`components/domain/admin/product-table.tsx`):
```tsx
"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, TableFilters, ConfirmationDialog } from "@/components/patterns";
import { StatusBadge } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ProductRow = {
  id: string;
  title: string;
  sku?: string | null;
  hasVariants: boolean;
  status?: string | null;
  updatedAt: string;
};

interface ProductTableProps {
  storeId: string;
  data: ProductRow[];
}

export function ProductTable({ storeId, data }: ProductTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch = 
        globalFilter === "" ||
        row.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
        (row.sku && row.sku.toLowerCase().includes(globalFilter.toLowerCase()));
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, globalFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    try {
      setBusy(id);
      const res = await fetch(`/api/stores/${storeId}/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Product deleted");
      setConfirmId(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setBusy(null);
    }
  };

  const columns: ColumnDef<ProductRow>[] = useMemo(() => [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "sku", header: "SKU", cell: ({ row }) => row.original.sku || "—" },
    {
      accessorKey: "hasVariants",
      header: "Type",
      cell: ({ row }) => (row.original.hasVariants ? "Variants" : "Single"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={(row.original.status as any) || "DRAFT"} />
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/${storeId}/products/${row.original.id}/edit`}>Edit</Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmId(row.original.id)}
            disabled={busy === row.original.id}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ], [storeId, busy]);

  return (
    <>
      <TableFilters
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        searchPlaceholder="Filter title or SKU"
        selectFilters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "ALL", label: "All" },
              { value: "DRAFT", label: "Draft" },
              { value: "ACTIVE", label: "Active" },
              { value: "ARCHIVED", label: "Archived" },
            ],
            placeholder: "All status",
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredData}
        emptyMessage="No products found."
      />

      <ConfirmationDialog
        open={confirmId !== null}
        onOpenChange={(open) => !open && setConfirmId(null)}
        title="Delete product?"
        description="This action cannot be undone."
        onConfirm={() => confirmId && handleDelete(confirmId)}
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={busy === confirmId}
      />
    </>
  );
}
```

**Repeat** for `InventoryTable`, `OrdersTable` (similar pattern, different columns).

---

## Phase 5: Documentation & Conventions
**Goal**: Help team discover components; document decisions  
**Time**: 1 hour

1. **Create `COMPONENT_INVENTORY.md`** at repo root:
   ```markdown
   # Component Inventory

   ## Primitives (Layout & Structure)
   - **PageHeader**: Title + description + action button
   - **PageSection**: Consistent spacing wrapper (sm/md/lg)
   - **MetricCard**: Dashboard stat card with trend badge
   - **StatusBadge**: Unified status styling (DRAFT/ACTIVE/ARCHIVED/...)

   ## Patterns (Composed Reusables)
   - **DataTable**: Generic table with filtering, sorting, pagination
   - **TableFilters**: Search input + select filters
   - **TablePagination**: Prev/next buttons
   - **ConfirmationDialog**: Delete/action confirmation modal
   - **EmptyState**: "No items" placeholder

   ## Domain (Business Logic)
   - **ProductTable**: Product list table (uses DataTable pattern)
   - **InventoryTable**: Variant inventory table
   - **OrdersTable**: Order list table
   - **FormInput/FormSelect/FormTextarea/FormCheckbox**: Form field wrappers

   ## Usage Examples
   See component files for props; all modules export via barrel (`index.ts`).
   ```

2. **Add conventions section to `README.md`**:
   ```markdown
   ## Component Conventions

   ### Imports
   Prefer barrel imports:
   ```tsx
   import { PageHeader, MetricCard } from "@/components/primitives";
   import { DataTable, ConfirmationDialog } from "@/components/patterns";
   import { ProductTable } from "@/components/domain/admin";
   ```

   ### Spacing
   - Use `PageSection` for page-level wrappers (default `space-y-4`)
   - Use `space-y-3` for tight groups, `space-y-6` for major sections

   ### Loading States
   - Page-level: Use existing `loading.tsx` with Skeleton components
   - Button-level: Disable + "Processing..." label (see ConfirmationDialog)

   ### Error Handling
   - User actions: `toast.error()` + preserve form state
   - API errors: Extract `.error` from response JSON; fallback to generic message

   ### Status Colors
   - Use `StatusBadge` component (sources `lib/utils` statusConfig)
   - Do not hardcode status colors inline
   ```

---

## Phase 6: Refactor Existing Pages
**Goal**: Replace inline patterns with extracted components  
**Time**: 3–4 hours

**Targets** (prioritize by traffic/duplication):
1. **`app/admin/[storeId]/products/page.tsx`**:
   - Replace header block with `<PageHeader />`
   - Replace search form + pagination with `<TableFilters />` + `<TablePagination />`
   - Replace `<ProductsTable />` with new `<ProductTable />` from domain

2. **`app/admin/[storeId]/inventory/page.tsx`**:
   - Same pattern as products page

3. **`app/admin/[storeId]/orders/page.tsx`**:
   - Same pattern

4. **`app/admin/[storeId]/page.tsx`** (Dashboard):
   - Replace `<SectionCards />` with loop over metrics data + `<MetricCard />`

5. **`app/admin/stores/page.tsx`**:
   - Replace header block with `<PageHeader />`

6. **`app/admin/users/page.tsx`**:
   - Replace header block with `<PageHeader />`

**Before/After Example** (`app/admin/[storeId]/products/page.tsx`):
```diff
  return (
-   <div className="p-6 space-y-4">
+   <PageSection>
      <ProductsPageClient storeId={storeId} />
-     <div className="flex items-center justify-between">
-       <div>
-         <h1 className="text-2xl font-semibold">Products</h1>
-         <p className="text-sm text-muted-foreground">Manage products for store {storeName}.</p>
-       </div>
-       <Button asChild>
-         <Link href={`/admin/${storeId}/products/new`}>Create product</Link>
-       </Button>
-     </div>
+     <PageHeader
+       title="Products"
+       description={`Manage products for store ${storeName}.`}
+       action={
+         <Button asChild>
+           <Link href={`/admin/${storeId}/products/new`}>Create product</Link>
+         </Button>
+       }
+     />

-     <form className="flex gap-2" method="get">
-       <Input name="q" placeholder="Search by title" defaultValue={q} />
-       <Button type="submit" variant="outline">Search</Button>
-     </form>

-     <ProductsTable storeId={storeId} data={...} />
+     <ProductTable storeId={storeId} data={...} />

-     <div className="flex items-center justify-between">
-       <div className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total} items)</div>
-       <div className="flex items-center gap-2">
-         <Button asChild size="sm" variant="outline" disabled={page <= 1}>
-           <Link href={`?${new URLSearchParams({ q, page: String(Math.max(1, page - 1)) }).toString()}`}>Previous</Link>
-         </Button>
-         <Button asChild size="sm" variant="outline" disabled={page >= totalPages}>
-           <Link href={`?${new URLSearchParams({ q, page: String(Math.min(totalPages, page + 1)) }).toString()}`}>Next</Link>
-         </Button>
-       </div>
-     </div>
+     <TablePagination
+       currentPage={page}
+       totalPages={totalPages}
+       totalItems={total}
+       buildPageUrl={(p) => `?${new URLSearchParams({ q, page: String(p) }).toString()}`}
+     />
-   </div>
+   </PageSection>
  );
```

---

# Verification & Demo Script

## Pre-Deployment Checks
1. **Type safety**:
   ```bash
   bun run typecheck
   ```
   Expect: No errors.

2. **Build**:
   ```bash
   bun run build
   ```
   Expect: Clean build, no import errors.

3. **Linting**:
   ```bash
   bun run lint
   ```
   Expect: No new warnings (existing warnings acceptable).

4. **Existing tests**:
   ```bash
   bun run test
   bun run e2e
   ```
   Expect: All tests pass (no functionality changes).

---

## Manual QA Checklist
**Test in browser** (`bun dev` → http://localhost:3000):

### Admin Pages (Login with Super Admin or Store Owner credentials)
- [ ] **Products page** (`/admin/{storeId}/products`):
  - Header displays title + description + "Create product" button
  - Search filters products by title/SKU
  - Status filter dropdown works
  - Sort columns by clicking headers
  - Delete confirmation dialog appears + deletes product
  - Pagination prev/next buttons navigate correctly

- [ ] **Inventory page** (`/admin/{storeId}/inventory`):
  - Same table behavior as products (different columns)
  - Stock quantity editable

- [ ] **Orders page** (`/admin/{storeId}/orders`):
  - Filters work (search + status select)
  - Pagination works

- [ ] **Dashboard** (`/admin/{storeId}`):
  - Metric cards display with trend badges
  - Cards responsive on mobile/tablet

- [ ] **Stores page** (`/admin/stores`):
  - PageHeader renders correctly
  - Delete store button opens confirmation dialog

- [ ] **Users page** (`/admin/users`):
  - PageHeader renders correctly
  - Invite form submits

### Regression Tests
- [ ] **Forms**: Invite user form, product editor work unchanged
- [ ] **Dark mode**: Toggle theme; verify StatusBadge colors adapt
- [ ] **Mobile**: Test on small viewport (tables scroll horizontally)

---

## Success Metrics
**Before** (current state):
- 15+ admin components with mixed concerns
- No barrel exports (except form fields)
- ~200 lines duplicated across 3 table files

**After** (target state):
- 4 organized folders (primitives, patterns, domain, ui)
- 7 extracted reusable components (PageHeader, MetricCard, DataTable, StatusBadge, ConfirmationDialog, TableFilters, TablePagination)
- Barrel exports enable `import { X, Y } from "@/components/patterns"`
- ~60% reduction in table boilerplate (3 tables → 1 shared DataTable + 3 column configs)

---

# Deploy

No deployment changes required (pure refactor; functionality unchanged).

**Post-merge**:
1. Share `COMPONENT_INVENTORY.md` with team in Slack/docs
2. Update PR template to reference component guidelines when adding new features
3. Monitor for new duplication in code reviews; suggest extracted components when patterns emerge

---

# Later Ideas (Deferred)

## Short-term (Next Sprint)
- **Form patterns**: Extract common form layouts (two-column grid, submit footer)
- **Page templates**: Composable page layout (sidebar + main + header)
- **Loading patterns**: Standardize skeleton loaders for tables/cards

## Medium-term (Next Quarter)
- **Storybook**: Visual component catalog for onboarding
- **Unit tests**: Add tests for extracted patterns (DataTable filter logic, ConfirmationDialog state)
- **Icon system**: Standardize icon imports (currently mix of Tabler + Lucide)

## Long-term (Future)
- **Component package**: Extract `@repo/ui` for potential multi-app reuse
- **Design tokens**: Migrate from Tailwind classes to CSS variables for theming
- **A11y audit**: ARIA labels, keyboard nav for DataTable, ConfirmationDialog

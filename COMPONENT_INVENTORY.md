# Component Inventory

This document catalogs all reusable components in the project, organized by purpose and abstraction level.

## Directory Structure

```
components/
├── ui/                    # Shadcn UI primitives (buttons, inputs, cards, etc.)
├── primitives/            # Layout & structural building blocks
├── patterns/              # Composed reusable components
├── domain/                # Business-specific compositions
│   ├── admin/             # Admin panel components
│   ├── forms/             # Form components and field wrappers
│   └── storefront/        # Storefront-specific components
└── core/                  # Framework utilities
```

## Primitives (Layout & Structure)

Located in: `components/primitives/`

### PageHeader
Title + description + optional action button pattern for page headers.

**Usage:**
```tsx
import { PageHeader } from "@/components/primitives";

<PageHeader
  title="Products"
  description="Manage products for your store"
  action={
    <Button asChild>
      <Link href="/products/new">Create product</Link>
    </Button>
  }
/>
```

**Props:**
- `title: string` - Page title
- `description?: string` - Optional description text
- `action?: ReactNode` - Optional action button or element

---

### PageSection
Consistent spacing wrapper for page content sections.

**Usage:**
```tsx
import { PageSection } from "@/components/primitives";

<PageSection spacing="md">
  <PageHeader ... />
  <DataTable ... />
</PageSection>
```

**Props:**
- `children: ReactNode` - Content to wrap
- `className?: string` - Additional CSS classes
- `spacing?: "sm" | "md" | "lg"` - Vertical spacing (default: "md")

---

### MetricCard
Dashboard stat card with value, trend badge, and footer description.

**Usage:**
```tsx
import { MetricCard } from "@/components/primitives";

<MetricCard
  title="Total Revenue"
  value="$1,250.00"
  trend={{ direction: "up", percentage: 12.5 }}
  footer="Trending up this month"
  description="Visitors for the last 6 months"
/>
```

**Props:**
- `title: string` - Card title
- `value: string | number` - Main metric value
- `trend?: { direction: "up" | "down"; percentage: number }` - Optional trend indicator
- `footer?: string` - Optional footer text
- `description?: string` - Optional description text

---

### StatusBadge
Unified status badge styling using the app's status configuration.

**Usage:**
```tsx
import { StatusBadge } from "@/components/primitives";

<StatusBadge status="ACTIVE" />
<StatusBadge status="DRAFT" />
```

**Props:**
- `status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED"` - Status type
- `className?: string` - Additional CSS classes

**Note:** Uses `lib/utils` `statusConfig` for consistent colors across the app.

---

## Patterns (Composed Reusables)

Located in: `components/patterns/`

### DataTable
Generic filterable and sortable table using @tanstack/react-table.

**Usage:**
```tsx
import { DataTable } from "@/components/patterns";

const columns: ColumnDef<ProductRow>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "sku", header: "SKU" },
  // ... more columns
];

<DataTable
  columns={columns}
  data={products}
  globalFilter={searchValue}
  onGlobalFilterChange={setSearchValue}
  emptyMessage="No products found."
/>
```

**Props:**
- `columns: ColumnDef<TData>[]` - Column definitions
- `data: TData[]` - Table data
- `globalFilter?: string` - Global filter value
- `onGlobalFilterChange?: (value: string) => void` - Filter change handler
- `columnFilters?: Record<string, unknown>` - Column-specific filters
- `emptyMessage?: string` - Empty state message

---

### TableFilters
Search input + optional select filters row.

**Usage:**
```tsx
import { TableFilters } from "@/components/patterns";

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
      ],
      placeholder: "All status",
    },
  ]}
/>
```

---

### TablePagination
Previous/next buttons with page count for server-side pagination.

**Usage:**
```tsx
import { TablePagination } from "@/components/patterns";

<TablePagination
  currentPage={page}
  totalPages={totalPages}
  totalItems={total}
  buildPageUrl={(p) => `?page=${p}`}
/>
```

---

### ConfirmationDialog
Reusable confirmation dialog for destructive actions.

**Usage:**
```tsx
import { ConfirmationDialog } from "@/components/patterns";

<ConfirmationDialog
  open={confirmId !== null}
  onOpenChange={(open) => !open && setConfirmId(null)}
  title="Delete product?"
  description="This action cannot be undone."
  onConfirm={() => handleDelete(confirmId)}
  confirmLabel="Delete"
  confirmVariant="destructive"
  isPending={busy}
/>
```

**Props:**
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - Open state change handler
- `title: string` - Dialog title
- `description?: string | ReactNode` - Optional description
- `onConfirm: () => void | Promise<void>` - Confirm action handler
- `onCancel?: () => void` - Optional cancel handler
- `confirmLabel?: string` - Confirm button label (default: "Confirm")
- `cancelLabel?: string` - Cancel button label (default: "Cancel")
- `confirmVariant?: "default" | "destructive"` - Button variant (default: "default")
- `isPending?: boolean` - Loading state

---

### EmptyState
Placeholder for empty lists or states.

**Usage:**
```tsx
import { EmptyState } from "@/components/patterns";

<EmptyState
  icon={<PackageIcon />}
  title="No products yet"
  description="Create your first product to get started."
  action={<Button>Create product</Button>}
/>
```

---

## Domain Components

### Admin Components
Located in: `components/domain/admin/`

Exported via barrel: `import { AdminSidebar, StoreSelector, ... } from "@/components/domain/admin"`

**Core Admin Components:**
- `AdminSidebar` - Main admin navigation sidebar
- `SiteHeader` - Admin header with store selector
- `SidebarToggleBridge` - Sidebar toggle state bridge
- `StoreSelector` - Store switcher dropdown
- `ViewStoreLink` - Link to view storefront
- `DeleteStoreButton` - Delete store with confirmation
- `ChartAreaInteractive` - Interactive area chart
- `DataTable` - Admin-specific data table wrapper
- `SectionCards` - Dashboard metric cards section
- `NavMain` - Main navigation items
- `NavSecondary` - Secondary navigation items
- `NavUser` - User profile menu

**Subdirectories:**
- `inventory/` - Inventory management components
  - `InventoryTable` - Variant stock management table
  - `InventoryPageClient` - Client-side inventory page logic
  
- `orders/` - Order management components
  - `OrdersPageClient` - Client-side orders page logic
  
- `products/` - Product management components
  - `ProductEditor` - Product edit form wrapper
  - `ProductFormWrapper` - Product form with validation
  - `ProductsTable` - Products list table
  - `ProductsPageClient` - Client-side products page logic
  - `VariantImagesDialog` - Variant image uploader dialog
  
- `stores/` - Store management components
  - `StoreSettingsForm` - Store settings form
  - `StorefrontHomeForm` - Storefront homepage configuration
  - `StoresPageClient` - Client-side stores page logic

---

### Form Components
Located in: `components/domain/forms/`

Exported via barrel: `import { FormInput, FormSelect, InviteUserForm, ... } from "@/components/domain/forms"`

**Field Wrappers:**
- `FormInput` - Text input with react-hook-form integration
- `FormSelect` - Select dropdown with react-hook-form integration
- `FormTextarea` - Textarea with react-hook-form integration
- `FormCheckbox` - Checkbox with react-hook-form integration

**Usage Example:**
```tsx
import { FormInput, FormSelect } from "@/components/domain/forms";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";

const form = useForm({ ... });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormInput
      name="email"
      label="Email"
      type="email"
      placeholder="user@example.com"
      required
    />
    <FormSelect
      name="role"
      label="Role"
      options={[
        { value: "STAFF", label: "Staff" },
        { value: "STORE_OWNER", label: "Store Owner" },
      ]}
    />
  </form>
</Form>
```

**Domain Forms:**
- `InviteUserForm` - User invitation form
- `CreateStoreForm` - Store creation form

---

### Storefront Components
Located in: `components/domain/storefront/`

Exported via barrel: `import { StorefrontHeader, PreviewLinkManager } from "@/components/domain/storefront"`

**Components:**
- `StorefrontHeader` - Storefront header with branding
- `PreviewLinkManager` - Preview mode utilities

---

## UI Components

Located in: `components/ui/`

Shadcn UI components (30+ primitives). These are the foundation components used to build higher-level primitives and patterns.

**Key Components:**
- `Button` - Button with variants
- `Input` - Text input
- `Card` - Card container
- `Table` - Table components
- `Dialog` - Modal dialog
- `Select` - Select dropdown
- `Form` - Form wrapper and field components
- `Badge` - Badge component
- `Skeleton` - Loading skeleton
- ... and more

All UI components follow Shadcn conventions with CVA variants.

---

## Import Patterns

### Recommended Import Style

```tsx
// Primitives (layout building blocks)
import { PageHeader, PageSection, MetricCard, StatusBadge } from "@/components/primitives";

// Patterns (composed reusables)
import { DataTable, TableFilters, ConfirmationDialog } from "@/components/patterns";

// Domain-specific components
import { ProductTable, InviteUserForm } from "@/components/domain/admin";
import { FormInput, FormSelect } from "@/components/domain/forms";

// UI primitives (when needed directly)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### Avoid Deep Imports

❌ **Don't:**
```tsx
import { FormInput } from "@/components/domain/forms/fields/form-input";
import { DataTable } from "@/components/patterns/data-table/data-table";
```

✅ **Do:**
```tsx
import { FormInput } from "@/components/domain/forms";
import { DataTable } from "@/components/patterns";
```

---

## Component Conventions

### Spacing
- Use `PageSection` for page-level wrappers (default `space-y-4`)
- Use `space-y-3` for tight groups
- Use `space-y-6` for major sections

### Loading States
- **Page-level:** Use `loading.tsx` files with Skeleton components
- **Button-level:** Disable button + show "Processing..." label (see ConfirmationDialog)
- **Form-level:** Use `isPending` state from hooks

### Error Handling
- **User actions:** Use `toast.error()` from sonner + preserve form state
- **API errors:** Extract `.error` from response JSON; fallback to generic message
- **Validation errors:** react-hook-form displays inline via FormMessage

### Status Colors
- Always use `StatusBadge` component (sources `lib/utils` statusConfig)
- Do not hardcode status colors inline
- Status config supports: DRAFT, ACTIVE, ARCHIVED, PENDING, PAID, FULFILLED, CANCELLED, REFUNDED

---

## Adding New Components

### When to Create a Primitive
- Pattern appears in 3+ pages with same layout structure
- Component is purely presentational (no business logic)
- Focuses on spacing, structure, or visual consistency

**Example:** PageHeader, MetricCard, StatusBadge

### When to Create a Pattern
- Composition of primitives + UI components
- Provides reusable interaction logic (filters, pagination, confirmation)
- Used across multiple features/domains

**Example:** DataTable, ConfirmationDialog, TableFilters

### When to Create a Domain Component
- Business-specific logic or data structure
- Combines patterns with domain knowledge
- Specific to admin/storefront/forms context

**Example:** ProductTable (uses DataTable pattern + product-specific columns)

---

## Testing Strategy

### Current Approach
- **Integration tests:** Playwright E2E tests at page level
- **Component coverage:** Extracted patterns covered by existing page tests
- **Unit tests:** Deferred until patterns stabilize

### Test Locations
- `__tests__/` - Component unit tests
- `tests/` - Playwright E2E tests

---

## Future Improvements

### Short-term (Next Sprint)
- Extract form layout patterns (two-column grid, submit footer)
- Create composable page templates (sidebar + main + header)
- Standardize skeleton loaders for tables/cards

### Medium-term (Next Quarter)
- Add Storybook for visual component catalog
- Unit tests for extracted patterns (DataTable filter logic, ConfirmationDialog state)
- Standardize icon imports (currently mix of Tabler + Lucide)

### Long-term (Future)
- Extract to `@repo/ui` package for potential multi-app reuse
- Migrate to CSS variables for theming (from Tailwind classes)
- A11y audit (ARIA labels, keyboard nav for DataTable, ConfirmationDialog)

---

## Questions?

For questions about component usage or to suggest new patterns, check:
1. This inventory document
2. Component source files (all have JSDoc or inline comments)
3. Existing page implementations in `app/` directory
4. Plan document: `plans/2025-11-17_component-modularization/plan.md`

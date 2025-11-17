# E-commerce Multi-tenant SaaS

Next.js 15 + Shadcn UI scaffold with Phase 1 backend wiring: Prisma (MongoDB), NextAuth (JWT), RBAC middleware, and initial API routes.

## Quick start

1. Copy envs

```bash
cp .env.example .env
```

Edit .env with your values:
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET

2. Install dependencies

```bash
bun install
# or: npm install / pnpm install / yarn install
```

3. Generate Prisma client and sync schema

```bash
bun run prisma:generate
bun run db:push
```

4. Run dev server

```bash
bun dev
```

Open http://localhost:3000

## Auth
- Credentials provider only (email/password).
- Create a user manually in DB for now (Phase 2 will add invites/register).
  - Passwords are bcrypt-hashed in the `User.hashedPassword` field.

## RBAC & Tenancy
- Middleware protects `/admin` and `/api/super-admin/*`.
- Super Admin: full access, Store Owner/Staff: admin access, Customer: none.
- Product endpoints are tenant-scoped by `storeId` path segment.

## API
- POST /api/super-admin/stores — create store, assign owner by email.
- GET/POST /api/stores/:storeId/products — list/create products (scoped).

## Next
- Phase 2: Stripe, Uploadthing, Upstash, Mailtrap, more endpoints, tests.

### Seed data
Run after setting env variables (values read from environment; no secrets are printed):

```bash
# required
ADMIN_EMAIL={{YOUR_ADMIN_EMAIL}} ADMIN_PASSWORD={{YOUR_ADMIN_PASSWORD}} bun run seed

# optional owner (if omitted, Super Admin is set as demo store owner)
OWNER_EMAIL={{YOUR_OWNER_EMAIL}} OWNER_PASSWORD={{YOUR_OWNER_PASSWORD}} bun run seed
```

### Stripe
- Create checkout session: POST /api/stripe/create-checkout-session
- Webhook: POST /api/webhooks/stripe (configure endpoint in Stripe dashboard)

### Uploads
- POST /api/uploads — save uploaded image metadata (intended to be called after client-side Uploadthing). Attach productId/variantId to link.
- Avatar uploads via Uploadthing coming next (account settings page).

### Redis (Upstash)
- lib/redis.ts exposes a Redis client and rateLimit helper.

### Email (Mailtrap)
- lib/mail.ts exports sendMail(to, subject, html). Configure Mailtrap envs:
  - MAIL_HOST
  - MAIL_PORT
  - MAIL_USER
  - MAIL_PASS

Example (Mailtrap SMTP):

```
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER={{MAILTRAP_USERNAME}}
MAIL_PASS={{MAILTRAP_PASSWORD}}
```

## Component Architecture

The codebase uses a modular component architecture for reusability and maintainability. See [COMPONENT_INVENTORY.md](./COMPONENT_INVENTORY.md) for the complete catalog.

### Component Structure

```
components/
├── ui/             # Shadcn UI primitives (buttons, inputs, cards)
├── primitives/     # Layout building blocks (PageHeader, MetricCard, StatusBadge)
├── patterns/       # Composed reusables (DataTable, ConfirmationDialog)
├── domain/         # Business-specific compositions
│   ├── admin/      # Admin panel components
│   ├── forms/      # Form components and field wrappers
│   └── storefront/ # Storefront components
└── core/           # Framework utilities
```

### Import Conventions

Prefer barrel imports for clean, discoverable code:

```tsx
// ✅ Good - use barrel exports
import { PageHeader, MetricCard } from "@/components/primitives";
import { DataTable, ConfirmationDialog } from "@/components/patterns";
import { FormInput, FormSelect } from "@/components/domain/forms";

// ❌ Avoid - deep imports
import { PageHeader } from "@/components/primitives/page-header";
import { FormInput } from "@/components/domain/forms/fields/form-input";
```

### Conventions

**Spacing:**
- Use `PageSection` for page-level wrappers (default `space-y-4`)
- Use `space-y-3` for tight groups, `space-y-6` for major sections

**Loading States:**
- Page-level: Use `loading.tsx` files with Skeleton components
- Button-level: Disable + "Processing..." label
- Form-level: Use `isPending` state from hooks

**Error Handling:**
- User actions: `toast.error()` from sonner + preserve form state
- API errors: Extract `.error` from response JSON; fallback to generic message
- Validation: react-hook-form displays inline via FormMessage

**Status Colors:**
- Always use `StatusBadge` component (sources `lib/utils` statusConfig)
- Do not hardcode status colors inline

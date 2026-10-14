# Plant Nursery — Ledger, Invoices & Inventory

A modern, full-stack internal management application for plant nurseries and retail stores. Manage inventory stock in real time, build paper-style invoices, handle atomic stock deductions upon finalization, and manage staff access with role-based permissions.

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=flat-square&logo=drizzle)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)

---

## Features

- **Role-Based Authentication & Gatekeeper**
  - Secured with `iron-session` signed, HTTP-only encrypted cookies (7-day duration).
  - Admin & Staff user roles.
  - Admin management panel to add, edit, or revoke user credentials directly inside the app.

- **Interactive Invoice Builder & Smart Combobox**
  - Paper-style live invoice interface.
  - **Smart Stock Picker**: Instant multi-field searchable combobox filtering by plant/item name, category, subcategory, unit, or price.
  - **Single Action Shortage Handling**: When an item is out of stock, the regular Add button dynamically swaps to a prominent Force Add button with high-contrast red alerts.
  - Quick-add items from active inventory or create ad-hoc custom line items.
  - Real-time subtotal, quantity, and total calculation.
  - Save as **Draft** for later edits or **Finalize** to lock the record.

- **Real-Time Inventory & Dynamic Taxonomy**
  - Comprehensive stock tracking (units, prices, quantities, categories).
  - **Dynamic Subcategories**: Create custom subcategories on the fly directly from the stock page (`+ Add Type`), persisted in the database with category isolation (plants vs non-plants).
  - **Atomic Stock Deduction**: Finalizing an invoice deducts stock in a single database transaction. If inventory is insufficient, the entire operation safely rolls back.

- **Comprehensive Invoice History**
  - Filter by status (**Draft** vs **Final**).
  - Staff view personal invoices; Admins view organization-wide invoices with creator attribution.

- **Native Print & PDF Export**
  - Optimized `@media print` CSS formats invoices cleanly for physical printers or browser "Save as PDF" without bloated third-party PDF dependencies.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/) |
| **Database & ORM** | [Supabase Postgres](https://supabase.com/) & [Drizzle ORM](https://orm.drizzle.team/) |
| **Authentication** | [iron-session](https://github.com/vvo/iron-session) (Stateless Cookie Sessions) |
| **Validation** | [Zod](https://zod.dev/) |

---

## Data Model & Architecture Decisions

```
           ┌──────────┐ 1      * ┌──────────┐
           │  users   ├──────────┤ invoices │
           └──────────┘          └────┬─────┘
                                      │ 1
                                      │
                                      │ *
┌─────────────────────┐         ┌─────┴────────────┐
│ stock_subcategories │         │  invoice_items   │
└─────────────────────┘         └─────┬────────────┘
                                      │ *
                                      │
                                      │ 0..1
                                ┌─────┴────────────┐
                                │   stock_items    │
                                └──────────────────┘
```

1. **Price Snapshot Protection**: When an item is added to an invoice, its name and unit price are copied directly into `invoice_items`. Future price adjustments in the stock inventory will never corrupt historic invoice totals.
2. **Atomic Stock Finalization**: Stock is only deducted when an invoice transitions from `draft` → `final`.
3. **Immutability of Finalized Records**: Finalized invoices are permanently locked from modifications or deletions to maintain accounting integrity.
4. **Dynamic Subcategory Taxonomies**: Stock items map to subcategories stored in `stock_subcategories` with a unique index on `(category, slug)`, supporting runtime addition without schema alteration.

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **Package Manager**: npm (included with Node)
- **Database**: PostgreSQL instance (e.g. Supabase)

---

### 1. Database Setup (Supabase)

1. Create a project on [Supabase](https://supabase.com).
2. Go to **Project Settings → Database → Connection String**.
3. Select **URI** (Transaction pooler on port `6543` for serverless deployments, or Session pooler on port `5432` for local development).

---

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Define the following variables in `.env`:

```env
# Database connection string
DATABASE_URL="postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Secret key for session encryption (at least 32 characters long)
SESSION_SECRET="your-super-secret-key-min-32-chars-long"
```

> **Tip:** You can generate a random `SESSION_SECRET` using OpenSSL:
> ```bash
> openssl rand -base64 32
> ```

---

### 3. Install Dependencies & Push Schema

Install project dependencies and apply the Drizzle schema to your database:

```bash
npm install
npm run db:push
```

---

### 4. Seed the Admin User

Create the initial administrator account (replace with your desired credentials):

```bash
npm run seed:admin -- admin "YourSecurePassword123!"
```

Once logged in as an admin, you can create additional staff and admin accounts directly from the UI profile panel.

---

### 5. Run Development Server

Start the local Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and sign in.

---

## Available NPM Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Next.js local development server (Turbopack enabled) |
| `npm run build` | Builds the production bundle |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs ESLint checks across the repository |
| `npm run db:push` | Directly syncs `schema.ts` changes to the remote Postgres database |
| `npm run db:generate` | Generates versioned SQL migration scripts in `./drizzle` |
| `npm run db:studio` | Launches Drizzle Studio GUI for visual database management |
| `npm run seed:admin` | Seeds an admin user account (`npm run seed:admin -- <user> <pass>`) |

---

## Repository Structure & 3-Layer Architecture

The project operates under a deterministic 3-layer architecture:
- **Layer 1: Directives (`directives/`)**: Living Markdown SOPs defining business goals, procedures, and edge cases.
- **Layer 2: Orchestration (`AGENTS.md`)**: Operational guidelines, anti-vibecoding standards, and decision-making logic.
- **Layer 3: Execution (`execution/` & `scripts/`)**: Deterministic tools, migration scripts, and validation runners.

```
plant-nursery/
├── directives/                # Layer 1: Standard Operating Procedures (SOPs)
│   ├── git_workflow.md        # Branch isolation, merge gates, and testing rules
│   ├── bilingual_localization.md # Kannada & English guidelines, overflow prevention
│   ├── invoice_and_billing.md # Invoicing lifecycle, atomic deductions, printable layout
│   ├── stock_and_gallery_management.md # Stock inventory, Supabase photos, gallery
│   ├── sales_analytics.md     # Sales reporting, timeline visualizations, drawer audits
│   ├── business_profile_and_invoice_settings.md # Business details, GST rates, invoice sequence
│   └── authentication_and_access_control.md # Role-based access, cookie security, 307 loop prevention

├── execution/                 # Layer 3: Deterministic execution tools
│   ├── run_typecheck.py       # Type-check runner (tsc --noEmit)
│   └── verify_project_health.py # Project architecture and gitignore health checker
├── .tmp/                      # Intermediate scratch files (gitignored)
├── .agents/skills/            # Central disposable skills (brand-leo-utils synced, gitignored)
├── scripts/                   # CLI maintenance and database migration scripts
│   ├── seed-admin.ts          # CLI script to bootstrap the primary admin account
│   ├── seed-plants-from-list.ts # Bulk inventory ingestion script from botanical list
│   ├── migrate-categories-kn.ts # Category migration script for Kannada taxonomies
│   ├── migrate-schema.ts      # Database schema migration runner
│   ├── translate-all-descriptions.ts # Description translation utility
│   ├── verify-gallery.ts      # Gallery and photo storage verification script
│   ├── test-storage.ts        # Supabase storage bucket health and upload test
│   └── test-signature-storage.ts # Signature storage upload test
├── src/
│   ├── app/
│   │   ├── api/               # REST API endpoints (auth, invoices, stock, users, gallery)
│   │   ├── invoice/           # Live interactive invoice editor page
│   │   ├── invoices/          # Invoices history list & detail viewer ([id])
│   │   ├── login/             # Login gate view
│   │   ├── stock/             # Inventory and stock management page
│   │   ├── gallery/           # Stock gallery and photo explorer
│   │   ├── globals.css        # Global CSS, print stylesheets, and custom utilities
│   │   └── layout.tsx         # Root layout with session context & shell wrapper
│   ├── components/
│   │   ├── AppShell.tsx       # Main layout wrapper
│   │   ├── InvoiceEditor.tsx  # Dynamic invoice creation/edit form component
│   │   ├── ProfilePanel.tsx   # User profile drawer & admin user management modal
│   │   ├── SalesAnalyticsModal.tsx # Sales metrics and data visualization modal
│   │   ├── StockItemDetailModal.tsx # Stock item inspection modal
│   │   ├── StockPhotoUploadModal.tsx # Photo upload and camera capture modal
│   │   └── Sidebar.tsx        # Navigation sidebar
│   ├── db/
│   │   ├── client.ts          # Postgres client & Drizzle ORM instance setup
│   │   └── schema.ts          # Drizzle database tables, enums, & relations definitions
│   └── lib/
│       ├── auth.ts            # Session cookies management & password hashing
│       ├── language-context.tsx # Kannada & English bilingual context
│       ├── plant-translations.ts # Botanical bilingual translation maps
│       └── types.ts           # Shared TypeScript interfaces & definitions
├── AGENTS.md                  # Layer 2: Agent operating rules and principles
├── drizzle.config.ts          # Drizzle Kit configuration
├── next.config.ts             # Next.js configuration
└── package.json               # Dependencies and scripts
```

---

## Deployment Guide (Vercel)

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com/new).
3. In the Vercel project settings, set the **Environment Variables**:
   - `DATABASE_URL` (Use Supabase Transaction Pooler URI on port `6543`)
   - `SESSION_SECRET`
4. Click **Deploy**.

---

## License

Private repository — All rights reserved.


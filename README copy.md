# Ledger — invoices & stock

A small internal tool for generating invoices and tracking stock, with a
login gate, draft invoices, and admin-managed user accounts.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Drizzle ORM ·
Supabase (Postgres) · iron-session (auth)

## Features

- **Login gate** — nobody sees the app without signing in. Sessions are
  signed, httpOnly cookies (7-day expiry).
- **New Invoice** — a live, paper-style invoice: add items from stock or as
  a custom line, set quantity, prices and totals update instantly. Save as
  a draft to finish later, or finalize (which locks it and deducts stock in
  one atomic transaction — a stock shortage rolls the whole save back).
- **Invoices** — history of every invoice. Staff see their own; admins see
  everyone's, with a "created by" column. Filter by draft/final.
- **Stock** — add, edit, and remove items; set price and quantity inline.
- **Profile panel** (icon at the bottom of the sidebar) — account info,
  logout, and for admins, a "Manage users" section to add or remove
  accounts (each with their own username, password, and role).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's up, go to **Project Settings → Database → Connection string**.
3. Copy the **Transaction pooler** URI (port `6543`) — this is what you'll
   use as `DATABASE_URL` for the deployed app, since it works well with
   serverless functions. Replace `[YOUR-PASSWORD]` with your DB password.
   (If you hit connection issues with the pooler while running commands
   locally, use the **Session pooler** URI, port `5432`, instead.)

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:
- `DATABASE_URL` — the connection string from step 1.
- `SESSION_SECRET` — any random string 32+ characters. Generate one with
  `openssl rand -base64 32`.

## 3. Install dependencies and create the database tables

```bash
npm install
npm run db:push
```

`db:push` reads `src/db/schema.ts` and creates the `users`, `stock_items`,
`invoices`, and `invoice_items` tables in your Supabase database directly
(no separate migration files needed for a project this size). If you'd
rather use versioned migrations, `npm run db:generate` will write SQL
files to `./drizzle` that you can review before applying.

## 4. Create your first (admin) user

```bash
npm run seed:admin -- youradminname "a-strong-password"
```

This is the only user created outside the app. From here on, that admin
can add or remove teammates from the profile panel inside the app.

## 5. Run it locally

```bash
npm run dev
```

Visit `http://localhost:3000`, log in with the admin account you just
created.

## 6. Deploy (e.g. to Vercel)

1. Push this project to a GitHub repo.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the same two environment variables (`DATABASE_URL`,
   `SESSION_SECRET`) in the Vercel project settings.
4. Deploy. Since the database already has its tables from step 3, there's
   nothing else to run — just deploy and log in.

## Project structure

```
src/
  app/
    login/            login page
    invoice/           "New Invoice" — the live invoice builder
    invoices/           history list
    invoices/[id]/       view/edit a single invoice
    stock/              stock management
    api/                route handlers (auth, invoices, stock, users)
  components/          AppShell, Sidebar, ProfilePanel, InvoiceEditor
  db/                  Drizzle schema + client
  lib/                 session/auth helpers, shared types
scripts/
  seed-admin.ts        creates the first admin user
```

## Notes on the data model

- Invoice line items store a **copy** of the item's name and price at the
  time it was added, rather than only referencing the stock item. That way,
  changing a stock item's price later doesn't retroactively change old
  invoices.
- Stock is only deducted when an invoice is **finalized**, not when it's
  saved as a draft — so you can build up a draft freely without it
  affecting stock counts, and edit it later.
- Finalized invoices are locked (no further edits) and can't be deleted;
  they can only be printed. Drafts can be edited or deleted.

## Printing

"Print invoice" uses the browser's native print dialog with print-specific
CSS (only the invoice itself is shown; sidebar and buttons are hidden). No
PDF library is involved — most browsers offer "Save as PDF" as a print
destination if you want a file instead of paper.

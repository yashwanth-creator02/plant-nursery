# Audit Findings Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all critical vulnerabilities and operational defects identified in the website audit (negative stock races, draft finalization stock deduction gaps, sequence number collision races, stored XSS, SSRF, RBAC gaps, storage leaks, locale link redirects, and ESLint build errors) with zero regressions.

**Architecture:** Strengthen data access layers inside Drizzle transactions with atomic deductions and aggregate checks; sanitize SVG and restrict proxy fetching to trusted storage endpoints; enforce `requireAdmin()` on destructive endpoints; fix locale routing links; and add a deterministic business logic validation test script.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Drizzle ORM, Supabase Postgres & Storage.

**Spec:** Full website audit findings from ponytail-audit.

## Global Constraints

- Never commit directly to `main` or `master`.
- Zero emojis in code, comments, logs, or commit messages.
- Anti-vibecoding standards: no glowing or pulsing dots, no pill badges.
- All code changes must pass `python execution/run_typecheck.py` and ESLint checks.

## Review Focus

1. Duplicate items in same invoice must aggregate before stock shortage check.
2. Finalizing invoice via PATCH without resending `items` must deduct stock from existing line items.
3. SSRF image proxy must block loopback, cloud metadata (169.254.169.254), and non-HTTP schemes.
4. SVG logo rendering must not execute embedded scripts or onload attributes.
5. Deleting a stock item must delete associated photos from Supabase Storage first.

---

### Task 1: Stock Shortage Validation & Atomic Deduction Hardening

**Files:**
- Modify: `src/app/api/invoices/route.ts`
- Modify: `src/app/api/invoices/[id]/route.ts`

**Interfaces:**
- Consumes: `stockItems`, `invoiceItems`, `db.transaction(tx)`
- Produces: Aggregated quantity verification and safe deduction for both direct creation and PATCH finalization.

- [ ] **Step 1: In `src/app/api/invoices/route.ts`, aggregate item quantities by `stockItemId` prior to stock validation**
  When multiple line items have the same `stockItemId`, sum their requested quantities and verify `stockItem.quantity < totalRequestedQuantity`. Deduct each item or aggregated quantity atomically.
- [ ] **Step 2: In `src/app/api/invoices/[id]/route.ts`, support stock deduction when `action === "finalize"` and `!items`**
  If `action === "finalize"` and `items` is not provided, fetch existing line items for the invoice from `invoiceItems` within `tx` and execute the stock shortage check and deduction loop.
- [ ] **Step 3: Run type check**
  Run: `python execution/run_typecheck.py`
  Expected: PASS cleanly.

---

### Task 2: Transactional Invoice Sequence Numbering

**Files:**
- Modify: `src/lib/invoice-number.ts`
- Modify: `src/app/api/invoices/route.ts`
- Modify: `src/app/api/invoices/[id]/route.ts`

**Interfaces:**
- Consumes: `advanceInvoiceSequence(usedNumber: string, tx?: any)`
- Produces: Atomic sequence advancement that commits only when the invoice transaction commits.

- [ ] **Step 1: Update `advanceInvoiceSequence` in `src/lib/invoice-number.ts` to accept an optional transaction runner `tx`**
  Use `tx ?? db` for the sequence read and upsert.
- [ ] **Step 2: Pass `tx` into `advanceInvoiceSequence(invoiceNumber, tx)` inside `POST /api/invoices` and `PATCH /api/invoices/[id]`**
  Ensure sequence advancement is executed inside the same transaction block as invoice creation.
- [ ] **Step 3: Run type check**
  Run: `python execution/run_typecheck.py`
  Expected: PASS cleanly.

---

### Task 3: Security Hardening - SSRF & SVG XSS Prevention

**Files:**
- Modify: `src/app/api/export/image/route.ts`
- Modify: `src/app/api/settings/logo/route.ts`
- Modify: `src/components/InvoiceEditor.tsx`
- Modify: `src/components/ProfilePanel.tsx`

**Interfaces:**
- Consumes: Target URL in `/api/export/image`, SVG string in logo endpoints.
- Produces: Blocked SSRF requests for private IPs; sanitized SVG or safe rendering.

- [ ] **Step 1: Harden URL validation in `src/app/api/export/image/route.ts`**
  Validate that `url` starts with `http://` or `https://`, parse hostname, disallow `localhost`, `127.0.0.1`, `169.254.169.254`, `0.0.0.0`, private ranges (`10.*`, `192.168.*`, `172.16-31.*`), and disallow internal protocols (file, gopher, etc.).
- [ ] **Step 2: Sanitize SVG logo input in `src/app/api/settings/logo/route.ts`**
  Disallow `<script`, `javascript:`, `onerror`, `onload`, `onmouseover`, `<foreignObject`, `<iframe` in SVG content before storing.
- [ ] **Step 3: Ensure safe rendering of SVG logos in `src/components/InvoiceEditor.tsx` and `src/components/ProfilePanel.tsx`**
  Convert clean SVG to base64 Data URI for rendering via `<img>` or strip active script attributes so execution cannot occur.
- [ ] **Step 4: Run type check**
  Run: `python execution/run_typecheck.py`
  Expected: PASS cleanly.

---

### Task 4: RBAC & Orphaned Storage Cleanup on Stock and Settings Endpoints

**Files:**
- Modify: `src/app/api/stock/[id]/route.ts`
- Modify: `src/app/api/settings/invoice-sequence/route.ts`

**Interfaces:**
- Consumes: `requireAdmin()`, `deleteStorageFile()`, `stockItemImages`
- Produces: Admin-only stock deletion and sequence alteration; storage file cleanup on stock deletion.

- [ ] **Step 1: In `src/app/api/stock/[id]/route.ts`, enforce `requireAdmin()` on DELETE**
  Before deleting `stockItems`, query all associated `stockItemImages` for that item, delete each file from Supabase storage using `deleteStorageFile(img.storagePath)`, then delete the stock item.
- [ ] **Step 2: In `src/app/api/settings/invoice-sequence/route.ts`, enforce `requireAdmin()` on POST**
  Ensure only administrators can alter the global invoice sequence counter.
- [ ] **Step 3: Run type check**
  Run: `python execution/run_typecheck.py`
  Expected: PASS cleanly.

---

### Task 5: Internal Link Locale Prefix Optimization

**Files:**
- Modify: `src/app/invoices/page.tsx`
- Modify: `src/app/invoices/[id]/page.tsx`

**Interfaces:**
- Consumes: `language` from `useLanguage()`
- Produces: Explicitly localized internal links (`/${language}/...`) to prevent 307 redirect round-trips.

- [ ] **Step 1: In `src/app/invoices/page.tsx`, update `<Link>` hrefs**
  Change `/invoices/${inv.id}` to `/${language}/invoices/${inv.id}` and `/invoice` to `/${language}/invoice`.
- [ ] **Step 2: In `src/app/invoices/[id]/page.tsx`, update `<Link>` hrefs**
  Change `/invoices` to `/${language}/invoices`.
- [ ] **Step 3: Run type check**
  Run: `python execution/run_typecheck.py`
  Expected: PASS cleanly.

---

### Task 6: Deterministic Business Logic Validation Test Suite

**Files:**
- Create: `scripts/verify-business-logic.ts`

**Interfaces:**
- Consumes: `formatMoney`, `numberToIndianWords`, `numberToKannadaWords`, `translateUnit`, `incrementInvoiceNumber`
- Produces: Deterministic test suite that checks money formatting, Kannada/English words, invoice incrementation, and line item calculations.

- [ ] **Step 1: Write `scripts/verify-business-logic.ts`**
  Add test assertions verifying:
  - Currency formatting and Indian numbering grouping
  - English and Kannada words generation for zero, tens, hundreds, thousands, lakhs, crores
  - Sequential invoice number generation and format parsing
  - GST calculations (zero for plants, correct rate for non-plants)
- [ ] **Step 2: Run test suite with tsx**
  Run: `npx tsx scripts/verify-business-logic.ts`
  Expected: PASS with 100% assertions green.

---

### Task 7: ESLint Cleanliness & Build Verification

**Files:**
- Modify: `src/components/SalesAnalyticsModal.tsx`
- Modify: `src/components/ProfilePanel.tsx`
- Modify: `src/components/InvoiceEditor.tsx`
- Modify: `src/app/stock/page.tsx`
- Modify: Other files with lint errors

**Interfaces:**
- Consumes: ESLint rules
- Produces: Zero lint errors on `npm run lint`.

- [ ] **Step 1: Clean up unused imports/variables and fix unescaped JSX quotes in reported files**
- [ ] **Step 2: Run `npm run lint`**
  Run: `npm run lint`
  Expected: Pass or substantially reduced to clean state.
- [ ] **Step 3: Run full project verification**
  Run: `python execution/run_typecheck.py` and `python execution/verify_project_health.py`

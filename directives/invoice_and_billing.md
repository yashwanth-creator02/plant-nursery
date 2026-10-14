# Directive: Invoice & Billing Lifecycle

## Goal
Manage the creation, draft editing, sequential numbering, finalization, atomic stock deduction, payment tracking, and thermal/paper printing of nursery invoices.

## When this fires
- Creating or editing bills in `src/app/invoices/` or `src/components/InvoiceEditor.tsx`.
- Handling invoice status transitions (`draft` -> `final`).
- Updating printable invoice styles (`#invoice-print`) or payment modes (cash vs online).
- Managing invoice sequence numbering or statutory GST rates.

## Inputs
- Invoice schema and line items (`src/lib/db/schema.ts`).
- Active user session via `iron-session` (`src/lib/auth.ts`).
- Line item pricing, quantities, discounts, and customer metadata.
- Business configuration from `BusinessSettings` (GSTIN, CGST/SGST rates, business header).

## Git Safety (If Modifying Code)
- Branch first (`feat/billing-<name>` or `fix/billing-<name>`).
- Test financial logic and stock deduction thoroughly before opening PR or merging.
- Explicit approval needed before merging to `main`.

## Tools / Scripts to Use
- Invoice API endpoints: `src/app/api/invoices/route.ts` and `src/app/api/invoices/[id]/route.ts`.
- Database schema push: `npm run db:push`.
- Type check: `python execution/run_typecheck.py`.

## Outputs
- Accurate, immutably finalized invoices.
- Consistent inventory levels reflecting actual nursery transactions.
- Pixel-perfect printed receipts for customers.

## Edge Cases & Error Handling
- **Atomic Stock Deduction**:
  - Finalizing an invoice MUST deduct stock inside a single, atomic database transaction.
  - If stock for any item is insufficient, the transaction must roll back cleanly and return a descriptive error.
  - Once marked `final`, an invoice cannot be reverted to `draft` to maintain inventory integrity.
- **Printable Sheet Styling (#invoice-print)**:
  - Always force light mode (`color-scheme: light !important`) with dark blue ink (`#1b365d`) on printable sheets even when the user operates the app in dark mode.
  - Unconstrain scroll containers under `@media print` so multi-item bills print completely without cutoffs.
- **Offline / Cash Drawer Separation**:
  - Explicitly record whether payments were completed via Cash or Online UPI/Card to ensure accurate cashier balance audits.
- **Ad-hoc Custom Line Items**:
  - Support ad-hoc items that do not map to catalog stock (deducting stock only when linked to a catalog item ID).

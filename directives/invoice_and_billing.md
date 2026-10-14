# Directive: Invoice & Billing Lifecycle

## Goal
Manage the creation, draft editing, finalization, atomic stock deduction, payment tracking, and thermal/paper printing of invoices.

## When this fires
- Creating or editing bills in `src/app/invoices/` or `src/components/InvoiceEditor.tsx`.
- Handling invoice status transitions (`draft` -> `final`).
- Updating printable invoice styles (`#invoice-print`) or payment modes (cash vs online).

## Inputs
- Invoice schema and line items (`src/lib/db/schema.ts`).
- Active user session via `iron-session` (`src/lib/auth.ts`).
- Line item pricing, quantities, discounts, and customer metadata.

## Core Rules & Architecture
1. **Atomic Stock Deduction**:
   - Finalizing an invoice MUST deduct stock inside a single, atomic database transaction.
   - If stock for any item is insufficient, the transaction must roll back cleanly and return a descriptive error.
   - Once marked `final`, an invoice cannot be reverted to `draft` to maintain inventory integrity.
2. **Role-Based Access**:
   - Staff users can create invoices and view invoices they created.
   - Admin users have full access across all invoices, user attribution, and financial totals.
3. **Printable Sheet (#invoice-print)**:
   - Always force light mode (`color-scheme: light !important`) with dark blue ink (`#1b365d`) on printable sheets even when the user is using the app in dark mode.
   - Unconstrain scroll containers under `@media print` so multi-item bills print completely without cutoffs.

## Tools / scripts to use
- Invoice API endpoints: `src/app/api/invoices/route.ts` and `src/app/api/invoices/[id]/route.ts`.
- Database schema push: `npm run db:push`.

## Outputs
- Accurate, immutably finalized invoices.
- Consistent inventory levels reflecting actual nursery transactions.
- Pixel-perfect printed receipts for customers.

## Edge cases
- Offline/cash payments: Flag cash transactions appropriately to enable reconciled cash-vs-online breakdowns in the Sales Analytics module.
- Ad-hoc custom line items: Support ad-hoc items that do not map to catalog stock (deducting stock only when linked to a catalog item ID).

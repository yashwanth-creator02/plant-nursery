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
- Stock item selection combobox: `src/components/SmartStockPicker.tsx`.
- Database schema push: `npm run db:push`.
- Type check: `python execution/run_typecheck.py`.

## Outputs
- Accurate, immutably finalized invoices.
- Consistent inventory levels reflecting actual nursery transactions.
- Pixel-perfect printed receipts for customers.

## Edge Cases & Error Handling
- **Smart Stock Selection & Quick Entry**:
  - The stock item picker (`SmartStockPicker.tsx`) must provide instant multi-field search (matching name, category, subcategory, unit, or price) with category tabs (`All`, `Plants`, `Non-Plants`).
  - When an item is selected, the input displays only the clean item name, price, and stock count (omitting subcategory tags in the input to avoid truncating long plant names, while keeping tags in dropdown cards).
  - Selecting an item must automatically shift focus to the quantity input.
- **Stock Shortage & Single Action Button**:
  - If a selected item is out of stock or requested quantity exceeds available stock, the normal `+ Add to bill` button must disappear completely, leaving only the prominent red `Force Add` button (`bg-red-600 text-white`).
  - Shortage warning alerts must use high-contrast red styling (`bg-red-50 border-red-300 text-red-800`).
  - Shortage and excessive quantity messages must render in Kannada when `language === "kn"`.
  - Pressing Enter in the quantity input must automatically invoke regular addition or force addition based on stock availability.
- **Bilingual Custom Line Items**:
  - Support ad-hoc items with both English Name (`customName`) and Kannada Name (`customNameKn`) alongside a 1-click on-the-fly translation button (`translateOnTheFly`).
  - `InvoiceLineItem` interface in `src/lib/types.ts` must include `nameKn?: string | null` to ensure custom Kannada names are saved in invoice state and draft localStorage.
  - Prioritize display of Kannada item names in mobile cards, desktop tables, and print receipts:
    `item.nameKn || stock.find(...)?.nameKn || translateItem(item.name)`
- **Atomic Stock Deduction**:
  - Finalizing an invoice MUST deduct stock inside a single, atomic database transaction.
  - If stock for any item is insufficient, the transaction must roll back cleanly and return a descriptive error.
  - Once marked `final`, an invoice cannot be reverted to `draft` to maintain inventory integrity.
- **Printable Sheet Styling (#invoice-print)**:
  - Always force light mode (`color-scheme: light !important`) with dark blue ink (`#1b365d`) on printable sheets even when the user operates the app in dark mode.
  - Unconstrain scroll containers under `@media print` so multi-item bills print completely without cutoffs.
- **Offline / Cash Drawer Separation**:
  - Explicitly record whether payments were completed via Cash or Online UPI/Card to ensure accurate cashier balance audits.

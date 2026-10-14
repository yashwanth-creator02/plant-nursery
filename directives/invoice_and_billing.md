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
  - Use `grid-cols-[44px_1fr_52px_90px_120px] sm:grid-cols-[48px_1fr_56px_96px_130px]` across all table rows (headers, divider guides, line items, and summary rows) to give sufficient width to the Amount column.
  - All currency/amount cells (Subtotal, Discount, CGST, SGST, Total) must have `whitespace-nowrap` to strictly prevent line breaks on decimal points (`.`) or commas.
- **Item-Level Statutory Taxation (Non-Plants vs Plants)**:
  - Live plants are 100% tax exempt (0% GST).
  - Non-plant goods (pots, fertilizers, soils, tools) have individual statutory GST rates (e.g. 0%, 5%, 12%, 18%, 28%) configured when adding or editing stock.
  - Custom ad-hoc non-plant items also permit specifying a statutory GST percentage during invoice creation.
  - When calculating invoice totals, discounts apply proportionally across line items before calculating taxes.
  - On printable receipts and bill previews, items are grouped by their distinct positive GST rate tiers into statutory CGST (rate / 2) and SGST (rate / 2) breakdown rows with their corresponding taxable values.
  - Round split CGST/SGST rates cleanly via `Math.round((gstRate / 2) * 100) / 100` to prevent JavaScript floating point precision noise (e.g. `5.550000000000001%`).
  - If all items in an invoice are plants (or 0% GST), no tax rows are rendered and an explicit `* Plants (0% GST Exempt)` notice is displayed.
  - `invoice_items` stores both `category` and `gst_rate` snapshots directly to preserve historical audit accuracy.
- **Offline / Cash Drawer Separation**:
  - Explicitly record whether payments were completed via Cash or Online UPI/Card to ensure accurate cashier balance audits.
- **Strict Invoice Immutability**:
  - Finalized and printed invoices are 100% immutable across all attributes: business header details, active nursery logo, digital signatures, line items, pricing, and tax totals.
  - At the moment of finalization (`action === "finalize"`), the backend freezes `businessName`, `address`, `mobiles`, `gstin`, `logoData`, `signature`, and `isSigned` inside `headerSnapshot`.
  - Re-printing or viewing historical finalized bills must always render the exact frozen snapshot, completely immune to subsequent admin logo changes, tax adjustments, or user signature modifications.
  - Future bills and active drafts remain dynamic, adopting the latest active settings and nursery logo.
  - In `InvoiceEditor.tsx`, finalized views strictly disable signature removal/addition and ignore live `signatureUpdated` and `nurseryLogoUpdated` window events.


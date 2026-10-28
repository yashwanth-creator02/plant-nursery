# Directive: Invoice & Billing Lifecycle

## Goal
Manage the creation, draft editing, sequential numbering, finalization, atomic stock deduction, payment tracking, and thermal/paper printing of nursery invoices.

## When this fires
- Creating or editing bills in `src/app/invoices/` or `src/components/InvoiceEditor.tsx`.
- Handling invoice status transitions (`draft` -> `final`).
- Updating printable invoice styles (`#invoice-print`) or payment modes (`cash`, `upi`, `card`, `credit`; legacy `online` remains readable).
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
  - The printable sheet follows the classic A4 portrait bill-book layout: uploaded logo at left (with a botanical sprig fallback when no logo is configured), centered serif wordmark with `NURSERY` on its own ruled line, and approval/description/address lines.
  - A centered invocation line from `businessSettings.invocation` sits above the brand header when present. Keep the existing header structure unchanged; do not add a letterhead editor to the invoice form because the Admin Panel owns business settings.
  - A four-cell category strip (Indoor & Outdoor Plants, Pots & Planters, Soil & Manure, Fertilizers & Gardening Supplies) sits below the header, followed by GSTIN/mobiles, a compact email line from `businessSettings.email`, a boxed `BILL / INVOICE` title, No./Date, and a bordered Payment Mode box with Cash/UPI/Card/Credit checkboxes.
  - The customer block separates Customer Name, Address, and Phone No. The database `customerDetails` field stores the combined `address, phone` string; the editor splits and rejoins it for entry and display.
  - The line-item table uses six columns: `Sl. No.`, `Item Name / Description`, `Qty.`, `Unit`, `Rate (₹)`, `Amount (₹)`. Use `grid-cols-[36px_minmax(0,1fr)_44px_54px_82px_96px]` across the header and all item/blank rows.
  - Render at least 10 table rows, filling unused rows with blank cells so the bill keeps the paper bill-book shape.
  - The `Unit` column is derived at render time from `item.unit` (draft/custom), the related `stockItem.unit` (finalized invoice relation), or `"Nos"`. Do not add a `unit` column to `invoice_items` unless a migration is explicitly planned; preserve the existing invoice snapshot behavior.
  - Use `--invoice-ink`, `--invoice-line`, `--invoice-fill`, and `--invoice-total` CSS variables defined on `#invoice-print`. Keep the dark blue `#1b365d` ink, light gray header fills, and a dark filled `TOTAL AMOUNT` row with white text.
  - The summary box contains Subtotal, Discount (-), per-tier CGST/SGST rows when applicable, and `TOTAL AMOUNT`. The amount-in-words box uses `numberToIndianWords` for English and `numberToKannadaWords` for Kannada.
  - The notes box renders `term1` through `term5` with a leaf icon; the signature block shows the frozen digital signature or fallback, a horizontal rule, `Authorised Signatory`, the invoice snapshot's proprietor name when present, and `Proprietor`.
  - The footer uses the script font for English only (Kannada uses serif), with leaf sprigs, the thank-you note, the `saveNatureNote` line ("SAVE NATURE AND NATURE WILL SAVE YOUR LIFE AND FUTURE."), and a screen-only version watermark. Add `break-inside-avoid` to the header, summary, notes/signature, and footer blocks so they do not split across pages.
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
- **Payment Mode Separation**:
  - Step 1 records `cash`, `upi`, `card`, or `credit` in the existing `invoices.payment_mode` text column. Legacy `online` rows remain readable and normalize to UPI in the editor.
  - Analytics must keep Cash (`cash`), Online (`online`, `upi`, `card`), and Credit (`credit`) as separate buckets. Credit is not cash and must not be folded into the cash drawer total.
  - Step 2 has one `Finalize Bill` action that uses the step-1 payment selection. The UPI QR modal is optional and does not finalize by itself.
- **Strict Invoice Immutability**:
  - Finalized and printed invoices are 100% immutable across all attributes: business header details, active nursery logo, digital signatures, line items, pricing, and tax totals.
  - At the moment of finalization (`action === "finalize"`), the backend freezes `businessName`, `subheading1`, `subheading2`, `address`, `mobiles`, `gstin`, `email`, `invocation`, `logoData`, the current user's `proprietor` name, `signature`, and `isSigned` inside `headerSnapshot`.
  - Re-printing or viewing historical finalized bills must always render the exact frozen snapshot, completely immune to subsequent admin logo changes, tax adjustments, or user signature modifications.
  - Future bills and active drafts remain dynamic, adopting the latest active settings and nursery logo.
  - In `InvoiceEditor.tsx`, finalized views strictly disable signature removal/addition and ignore live `signatureUpdated` and `nurseryLogoUpdated` window events.


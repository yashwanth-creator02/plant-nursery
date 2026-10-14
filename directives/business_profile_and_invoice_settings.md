# Directive: Business Profile & Invoice Configuration

## Goal
Manage business branding metadata, tax parameters (GSTIN, CGST/SGST rates), contact addresses, and sequential invoice numbering overrides for printable invoice receipts.

## When this fires
- Updating business name, subheadings, address, phone numbers, or GSTIN in `AdminInvoiceSettingsModal.tsx`.
- Adjusting statutory tax rates (CGST / SGST percentages).
- Overriding or resetting the sequential invoice counter in `CustomInvoiceNumberModal.tsx`.
- Viewing audit history of past business profile revisions.

## Inputs
- `BusinessSettings` object (`src/lib/types.ts`):
  - `businessName`, `subheading1`, `subheading2`, `address`, `mobiles`, `gstin`.
  - `cgstRate`, `sgstRate` (default: 2.50% each = 5% total GST).
  - `version` counter tracking historical snapshot changes.
- Sequence endpoints: `/api/settings/invoice-sequence` and `/api/settings/invoice-details`.
- Role verification: Admin privileges required.

## Git Safety (If Modifying Code)
- Always create a new feature branch (`feat/<name>` or `fix/<name>`) before changing settings schemas or modal components.
- Never commit directly to `main`. Require explicit user authorization before any `git merge --no-ff`.

## Tools / Scripts to Use
- Execution health check: `python execution/verify_project_health.py`.
- Type check: `python execution/run_typecheck.py`.
- CLI migration tools in `scripts/`.

## Outputs
- Updated business metadata in the database settings table.
- Immutable historical version records for legal tax compliance.
- Predictable, formatted invoice IDs (e.g. `INV-00124`) reflecting current sequence configuration.

## Edge Cases & Error Handling
- **Historical Invoice Immutability**: Changes to business details (address, GSTIN, tax rates) must not retroactively alter previously finalized invoices. Past invoices store snapshot data or link to their specific version.
- **Sequence Clashing**: If a user enters a custom invoice number that already exists, return a descriptive conflict error and suggest the next available increment via `incrementInvoiceNumber()`.

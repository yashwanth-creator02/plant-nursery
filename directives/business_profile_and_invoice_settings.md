# Directive: Business Profile & Invoice Configuration

## Goal
Manage business branding metadata, custom nursery logo, payment QR codes, contact addresses, and sequential invoice numbering overrides for printable invoice receipts.

## When this fires
- Updating business name, subheadings, address, phone numbers, or GSTIN in `AdminInvoiceSettingsModal.tsx`.
- Uploading or updating the custom nursery logo (vector SVG or raster image) or payment QR code.
- Overriding or resetting the sequential invoice counter in `CustomInvoiceNumberModal.tsx`.
- Viewing audit history of past business profile revisions.

## Inputs
- `BusinessSettings` object (`src/lib/types.ts`):
  - `businessName`, `subheading1`, `subheading2`, `address`, `mobiles`, `gstin`.
  - `logoData` (base64 Data URI or SVG string) and `logoTitle` metadata.
  - `paymentQrData` (base64 Data URI) for UPI payment scans on receipts.
  - `version` counter tracking historical snapshot changes.
  - Note: Global CGST/SGST controls have been removed from the Admin Panel; GST rates are configured per item at the stock level for non-plant goods (live plants remain 100% tax exempt).
- Settings endpoints: `/api/settings/invoice-details`, `/api/settings/invoice-sequence`.
- Role verification: Admin privileges required.

## Git Safety (If Modifying Code)
- Always create a new feature branch (`feat/<name>` or `fix/<name>`) before changing settings schemas or modal components.
- Never commit directly to `main`. Require explicit user authorization before any `git merge --no-ff`.

## Tools / Scripts to Use
- Execution health check: `python execution/verify_project_health.py`.
- Type check: `python execution/run_typecheck.py`.
- CLI migration tools in `scripts/`.

## Outputs
- Updated business metadata, custom logo, and payment QR in the database settings table.
- Broadcast custom DOM event `nurseryLogoUpdated` so open invoice builder windows refresh their header previews instantly.
- Immutable historical version records and snapshots for legal tax compliance.
- Predictable, formatted invoice IDs (e.g. `INV-00124`) reflecting current sequence configuration.

## Edge Cases & Error Handling
- **Logo Formats & Fallback**:
  - Accept vector SVG (recommended for highest print resolution) or raster images (PNG, JPG, WEBP under 2MB).
  - When no custom logo is uploaded, default to the embedded SVG plant leaf icon.
  - Invoices must always render cleanly in both dark/light screen modes and high-contrast `@media print`.
- **Strict Historical Invoice Immutability**:
  - Updating the business profile, address, contact numbers, tax rates, logo, or signatures must NEVER retroactively alter finalized or past printed invoices.
  - Finalized invoices freeze their exact visual header into `headerSnapshot` (business name, address, mobiles, GSTIN, `logoData`, digital signature).
  - Profile and logo modifications apply strictly to future new bills and active drafts.
- **Sequence Clashing**:
  - If a user enters a custom invoice number that already exists, return a descriptive conflict error and suggest the next available increment via `incrementInvoiceNumber()`.
- **UI Anti-Clutter & Aesthetics**:
  - Do not add redundant "Admin Only" badges or pill labels inside panels that are already restricted to administrators.
  - Avoid duplicate buttons or controls for the same operation.
  - Zero emojis, zero neon/pulsing dots, and zero unnecessary decorative badges.

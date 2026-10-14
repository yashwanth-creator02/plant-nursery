# Directive: Nursery Data Backup & Full Export

## Goal
Provide a comprehensive, deterministic backup and export mechanism that packages all nursery records—invoices, inventory stock, plant gallery photos, digital signatures, UPI payment QR codes, and active branding assets—into an organized, website-named destination folder structure for offline compliance, disaster recovery, and data portability.

## When this fires
- An administrator triggers "Backup & Full Data Export" from the Admin tab in `src/components/ProfilePanel.tsx`.
- Interacting with `src/components/ExportDataModal.tsx`.
- Invoking the backup API endpoints: `GET /api/export/data` and `GET /api/export/image`.
- Preparing offsite snapshots before significant schema migrations or data maintenance.

## Inputs
- Admin authentication session (`requireAdmin()` in `src/lib/session.ts`).
- Database records from `db`:
  - `invoices` and `invoiceItems`
  - `stockItems`, `stockCategories`, and `stockSubcategories`
  - `businessSettings` (historical versions and active configuration)
  - `users` (credentials excluded; signatures included)
- Media assets:
  - Supabase storage images for stock catalog and gallery
  - Data URI or uploaded payment QR code
  - Custom nursery SVG/PNG logo

## Git Safety (If Modifying Code)
- Always branch first (`feat/export-<name>` or `fix/export-<name>`).
- Verify export payload integrity and access control gates before opening a pull request.
- Explicit user confirmation required before merging into `main`.

## Tools / Scripts to Use
- Export manifest and packaging API: `src/app/api/export/data/route.ts`.
- Media streaming proxy endpoint: `src/app/api/export/image/route.ts`.
- Client-side export orchestrator: `src/components/ExportDataModal.tsx`.
- Type check: `npx tsc --noEmit` or `python execution/run_typecheck.py`.
- Health check: `python execution/verify_project_health.py`.

## Outputs
- A clean, downloadable ZIP package (or local folder structure) named after the business (e.g. `Sri-Vijayalakshmi-Nursery-Backup-YYYY-MM-DD.zip`).
- Nested folder architecture:
  - `invoices/`: Individual JSON files for every bill (`INV-0001.json`), plus consolidated `all-invoices.json` and tabular CSV/Excel files.
  - `images/stock/<category>/<subcategory>/`: High-resolution stock plant photos categorized by botanical taxonomy.
  - `images/signatures/`: Digital signatures for authorized nursery staff.
  - `business-details/`: Active nursery logo (`nursery-logo.<ext>`), payment QR card (`payment-qr.png`), and version history.
  - `export-manifest.json`: Checksum manifest containing item tallies, export timestamps, and schema version numbers.

## Edge Cases & Error Handling
- **Role-Based Gatekeeping**:
  - The export endpoints (`/api/export/data` and `/api/export/image`) must strictly enforce admin role authorization. Non-admin staff attempting access receive HTTP 403 Forbidden.
- **Sensitive Data Exclusion**:
  - Never include password hashes, cookie secrets, or internal authentication salts in exported user manifests or JSON files.
- **Remote Image Download Failures**:
  - When archiving plant photos from remote Supabase storage buckets, handle network timeouts gracefully. If an image fails to download, log the error in the export manifest rather than aborting the entire ZIP generation.
- **Data URI vs Binary Assets**:
  - Support both inline data URIs (e.g. `data:image/svg+xml;...`, `data:image/png;base64,...`) and external storage URLs by proxying binary streams through `/api/export/image`.
- **Filename Sanitization**:
  - Sanitize all folder and file names (removing invalid filesystem characters like `\ / : * ? " < > |`) to ensure cross-platform extraction compatibility across Windows, macOS, and Linux.

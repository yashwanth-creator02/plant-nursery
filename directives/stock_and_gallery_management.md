# Directive: Stock Inventory & Gallery Management

## Goal
Govern the management of inventory items (plants, pottery, seeds, non-plant nursery goods), catalog categorization, image asset uploads to Supabase storage, and the visual gallery explorer.

## When this fires
- Managing stock quantities, prices, or botanical details in `src/app/stock/`.
- Uploading photos, snapping pictures via camera, or managing plant photos in `src/app/gallery/` or `src/components/StockPhotoUploadModal.tsx`.
- Modifying stock item schema or image metadata.

## Inputs
- Stock database records in `stock_items`, `stock_subcategories`, and `stock_images` tables.
- Supabase storage client (`src/lib/supabase.ts`) and `plant-photos` storage bucket.
- Photo files (PNG, JPEG, WebP) uploaded via file picker, drag-and-drop, or live device camera.

## Git Safety (If Modifying Code)
- Branch first (`feat/stock-<name>` or `fix/stock-<name>`).
- Verify database migrations and storage bucket permissions before merging.
- Explicit confirmation required before merging to `main`.

## Tools / Scripts to Use
- Subcategories API: `src/app/api/stock/subcategories/route.ts`.
- Gallery verification tool: `scripts/verify-gallery.ts`.
- Bulk inventory ingestion script: `scripts/seed-plants-from-list.ts`.
- Database schema migration: `scripts/migrate-schema.ts`.
- Storage diagnostics: `scripts/test-storage.ts` & `scripts/test-signature-storage.ts`.
- Type check: `python execution/run_typecheck.py`.

## Outputs
- Accurate inventory stock counts.
- Dynamic, database-persisted subcategory taxonomy across inventory and billing.
- High-performance, responsive visual stock gallery for staff and customers.
- Full bilingual item editing capabilities post-creation in both stock table and detail modal.

## Edge Cases & Error Handling
- **Editing Stock Items Post-Creation**:
  - Stock items can be edited at any time via two mechanisms:
    1. **Inline Table Editing** (`/stock`): Quick row-level editing of English Name, Kannada Name with 1-click on-the-fly translation, Category, Subcategory, Unit, Price, and Quantity.
    2. **Comprehensive Detail Modal Editor** (`StockItemDetailModal.tsx`): Full editing including two-way translation (En ↔ Kn), dynamically loaded category/subcategory selects, stock counts, units, and bilingual item descriptions.
  - Changes persist immediately via `PATCH /api/stock/[id]` and update UI state without requiring a full page refresh.
- **Category & Subcategory Taxonomy**:
  - Distinct top-level classification between `plants` and `non-plants` (pots, fertilizers, tools, soil).
  - Dynamic categories and subcategories store both English and Kannada names (`name`, `nameKn`, `slug`) with 1-click on-the-fly translation.
  - Safe deletion: If a category or subcategory contains active stock items, require safe reassignment modal dialog before deletion.
- **Gallery Interactions & Card Navigation**:
  - Clicking any item card in the Gallery (`/gallery`) opens `StockItemDetailModal.tsx` for immediate item inspection and editing.
  - The "+ Add Photo" dashed card area must use `e.stopPropagation()` so clicking it directly opens `StockPhotoUploadModal.tsx` without triggering the detail modal.
- **Photo Upload & Compression**:
  - Compress or resize large mobile camera photos before pushing to Supabase storage to optimize storage and loading times.
  - Support bilingual photo descriptions (`description` and `descriptionKn`) in `StockPhotoUploadModal.tsx` with 1-click AI translation and database persistence in `stock_item_images`.
  - Allow setting a designated primary/cover photo for each stock item.
- **Safety & Deletion**:
  - Deleting an image must remove the record from `stock_item_images` and remove the binary object from the Supabase bucket.
- **Network Timeouts**: Gracefully retry transient network failures and display actionable error toasts.
- **Missing Images**: Show clean fallback icons (`ImageIcon` from `lucide-react`) when a stock item has no photos attached.

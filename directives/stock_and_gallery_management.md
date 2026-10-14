# Directive: Stock Inventory & Gallery Management

## Goal
Govern the management of inventory items (plants, pottery, seeds, non-plant nursery goods), catalog categorization, image asset uploads to Supabase storage, and the visual gallery explorer.

## When this fires
- Managing stock quantities, prices, or botanical details in `src/app/stock/`.
- Uploading photos, snapping pictures via camera, or managing plant photos in `src/app/gallery/` or `src/components/StockPhotoUploadModal.tsx`.
- Modifying stock item schema or image metadata.

## Inputs
- Stock database records in `stock_items` and `stock_images` tables.
- Supabase storage client (`src/lib/supabase.ts`) and `plant-photos` storage bucket.
- Photo files (PNG, JPEG, WebP) uploaded via file picker, drag-and-drop, or live device camera.

## Core Procedures
1. **Category Separation**:
   - Distinct classification between `plants` and `non-plants` (pots, fertilizers, tools).
   - Support category filtering with responsive, non-overflowing filter pills.
2. **Photo Upload & Compression**:
   - Compress or resize large mobile camera photos before pushing to Supabase storage to optimize storage and loading times.
   - Attach bilingual descriptions (`description` and `descriptionKn`) to gallery images.
   - Allow setting a designated primary/cover photo for each stock item.
3. **Safety & Deletion**:
   - Deleting an image must remove the record from `stock_images` and remove the binary object from the Supabase bucket.

## Tools / scripts to use
- `scripts/verify-gallery.ts`: Validate gallery images and storage bucket connectivity.
- `scripts/seed-plants-from-list.ts`: Bulk inventory ingestion script.
- `scripts/test-storage.ts` & `scripts/test-signature-storage.ts`: Storage health verification.

## Outputs
- Accurate inventory stock counts.
- High-performance, responsive visual stock gallery for staff and customers.

## Edge cases
- Supabase storage network timeouts: Gracefully retry transient network failures and display actionable error toasts.
- Missing images: Show clean fallback icons (`ImageIcon` from `lucide-react`) when a stock item has no photos attached.

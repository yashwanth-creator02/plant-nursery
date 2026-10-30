# File Inventory

Last updated: 2026-10-30

This inventory tracks the repository's tracked files. Update the relevant entry whenever a file is added, renamed, moved, or deleted.

## Brand loading state

- `src/app/loading.tsx`
- `src/components/brand/LeoLoader.tsx`
- `src/components/brand/leo-loader.d.ts`
- `src/components/brand/leo-loader.js`
- `src/components/brand/leo-loader.css`
- `src/components/brand/leo-theme.css`

## Root and configuration

- `.env.example`
- `.gitignore`
- `AGENTS.md`
- `README.md`
- `docs/FILE_INVENTORY.md`
- `drizzle.config.ts`
- `eslint.config.mjs`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `skills-lock.json`
- `tsconfig.json`

## Directives

- `directives/authentication_and_access_control.md`
- `directives/bilingual_localization.md`
- `directives/business_profile_and_invoice_settings.md`
- `directives/data_backup_and_export.md`
- `directives/git_workflow.md`
- `directives/invoice_and_billing.md`
- `directives/sales_analytics.md`
- `directives/stock_and_gallery_management.md`

## Execution and scripts

- `execution/run_typecheck.py`
- `execution/verify_project_health.py`
- `scripts/migrate-categories-kn.ts`
- `scripts/migrate-schema.ts`
- `scripts/seed-admin.ts`
- `scripts/seed-plants-from-list.ts`
- `scripts/test-signature-storage.ts`
- `scripts/test-storage.ts`
- `scripts/translate-all-descriptions.ts`
- `scripts/verify-gallery.ts`

## App pages

- `src/app/gallery/page.tsx`
- `src/app/globals.css`
- `src/app/icon.svg`
- `src/app/invoice/page.tsx`
- `src/app/invoices/[id]/page.tsx`
- `src/app/invoices/page.tsx`
- `src/app/layout.tsx`
- `src/app/login/page.tsx`
- `src/app/page.tsx`
- `src/app/stock/page.tsx`

## API routes

- `src/app/api/admin/clear-data/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/export/data/route.ts`
- `src/app/api/export/image/route.ts`
- `src/app/api/gallery/images/[id]/route.ts`
- `src/app/api/gallery/route.ts`
- `src/app/api/gallery/upload/route.ts`
- `src/app/api/invoices/[id]/route.ts`
- `src/app/api/invoices/route.ts`
- `src/app/api/sales/analytics/route.ts`
- `src/app/api/settings/invoice-details/route.ts`
- `src/app/api/settings/invoice-sequence/route.ts`
- `src/app/api/settings/logo/route.ts`
- `src/app/api/settings/qr-code/route.ts`
- `src/app/api/stock/[id]/route.ts`
- `src/app/api/stock/categories/route.ts`
- `src/app/api/stock/route.ts`
- `src/app/api/stock/subcategories/route.ts`
- `src/app/api/translate/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/users/profile/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/signature/route.ts`

## Components

- `src/components/AdminInvoiceSettingsModal.tsx`
- `src/components/AppShell.tsx`
- `src/components/CustomInvoiceNumberModal.tsx`
- `src/components/ExportDataModal.tsx`
- `src/components/InvoiceEditor.tsx`
- `src/components/LanguageToggle.tsx`
- `src/components/ProfilePanel.tsx`
- `src/components/SalesAnalyticsModal.tsx`
- `src/components/Sidebar.tsx`
- `src/components/SignatureModal.tsx`
- `src/components/SmartStockPicker.tsx`
- `src/components/StockItemDetailModal.tsx`
- `src/components/StockPhotoUploadModal.tsx`

## Database and shared library

- `src/db/index.ts`
- `src/db/schema.ts`
- `src/lib/api-utils.ts`
- `src/lib/auth-context.tsx`
- `src/lib/invoice-format.ts`
- `src/lib/invoice-number.ts`
- `src/lib/language-context.tsx`
- `src/lib/plant-translations.ts`
- `src/lib/session.ts`
- `src/lib/supabase-storage.ts`
- `src/lib/translator.ts`
- `src/lib/types.ts`
- `src/proxy.js`

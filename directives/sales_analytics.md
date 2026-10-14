# Directive: Sales Analytics & Reporting

## Goal
Provide real-time revenue analytics, invoice count summaries, payment method breakdowns (cash vs online), interactive timeline visualizations, and detailed sales audit logs.

## When this fires
- Launching the sales analytics modal (`src/components/SalesAnalyticsModal.tsx`) from the header navigation.
- Viewing or exporting financial performance metrics and sales trends.
- Updating aggregation queries or chart visualizations.

## Inputs
- Finalized invoice records with associated creation timestamps, grand totals, and payment methods.
- Time range filters: `today`, `yesterday`, `week`, `month`, `year`, or custom `date`.
- Metric toggles: `revenue` vs `count`.

## Git Safety (If Modifying Code)
- Develop analytics metrics on a separate feature branch (`feat/analytics-<name>`).
- Verify timezone calculations and cash breakdown formulas before merging.
- Explicit confirmation required before merging into `main`.

## Tools / Scripts to Use
- Analytics endpoints: `src/app/api/analytics/route.ts` or invoice aggregation endpoints.
- Type check: `python execution/run_typecheck.py`.
- Health check: `python execution/verify_project_health.py`.

## Outputs
- Clean, responsive analytics modal with interactive charts.
- Verified daily sales reconciliation summaries for nursery management.

## Edge Cases & Error Handling
- **Financial Metric Calculations**:
  - Total Gross Revenue, Net Revenue after discounts, Average Order Value (AOV).
  - Cash vs Online payment split calculation for daily drawer reconciliation.
- **Empty Periods**:
  - Buckets with zero revenue must render cleanly with placeholder indicators without breaking graph layout or scale calculations.
- **Timezone Offsets**:
  - Always use the nursery's local timezone (`Asia/Kolkata` / IST) when grouping hourly or daily metrics.
- **Data Export Formats**:
  - Export sales summary and line-item details via `ExportDataModal.tsx` for accounting and spreadsheet reporting.

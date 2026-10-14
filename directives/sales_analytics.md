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

## Core Features & Architecture
1. **Financial Metric Calculation**:
   - Total Gross Revenue, Net Revenue after discounts, Average Order Value (AOV).
   - Cash vs Online payment split calculation for daily drawer reconciliation.
2. **Data Visualization**:
   - Stacked CSS bar chart displaying cash vs online payment composition over the selected time horizon (hourly for today/yesterday, daily for month, monthly for year).
   - Tooltips on hover displaying bucket label, cash amount, online amount, and total bill count.
3. **Data Export**:
   - Export sales summary and line-item details via `ExportDataModal.tsx` for accounting and spreadsheet reporting.

## Tools / scripts to use
- Analytics API routes: `src/app/api/analytics/route.ts` or invoice aggregation endpoints.
- Type check: `npx tsc --noEmit`.

## Outputs
- Clean, responsive analytics modal with interactive charts.
- Verified daily sales reconciliation summaries for nursery management.

## Edge cases
- Empty periods: Buckets with zero revenue must render cleanly with placeholder indicators without breaking graph layout or scale calculations.
- Timezone offsets: Always use the nursery's local timezone (`Asia/Kolkata` / IST) when grouping hourly or daily metrics.

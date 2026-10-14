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
- Complete bilingual support across all 12 preset filters, metric summaries, bar charts, donut charts, and invoice breakdown tables.

## Edge Cases & Error Handling
- **Financial Metric Calculations**:
  - Total Gross Revenue, Net Revenue after discounts, Average Order Value (AOV).
  - Cash vs Online payment split calculation for daily drawer reconciliation.
- **Chart Tooltip Boundary & Clipping Prevention**:
  - Interactive chart tooltips must be constrained to the viewport/modal boundaries (`allowEscapeViewBox={{ x: false, y: false }}` or calculated bounds) so hovering over extreme top or border data points never clips tooltip content or cuts off the top half of the popup.
- **Unconditional React Hook Discipline**:
  - All React hooks (`useState`, `useMemo`, `useEffect`, `useCallback`) in `SalesAnalyticsModal.tsx` and related visualization components must execute unconditionally at the top level before any conditional guards or early returns, preventing hook order mismatches during modal transitions.
- **Bilingual Visualizations & Presets**:
  - All 12 time filter presets (Today, Yesterday, Last 7 Days, This Month, Last Month, This Year, etc.) must be fully localized in `translations.kn`.
  - Chart legends, tooltip labels, staff performance tables, and data table columns must dynamically render localized labels using `t()` from `useLanguage()`.
- **Single Action Controls**:
  - Keep metric toggle controls singular and distinct. Avoid duplicate or overlapping buttons for identical chart actions.
- **Empty Periods**:
  - Buckets with zero revenue must render cleanly with placeholder indicators without breaking graph layout or scale calculations.
- **Timezone Offsets**:
  - Always use the nursery's local timezone (`Asia/Kolkata` / IST) when grouping hourly or daily metrics.
- **Data Export Formats**:
  - Export sales summary and line-item details via `ExportDataModal.tsx` for accounting and spreadsheet reporting.

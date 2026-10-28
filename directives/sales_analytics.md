# Directive: Sales Analytics & Reporting

## Goal
Provide real-time revenue analytics, invoice count summaries, payment method breakdowns (cash, online, and credit), interactive timeline visualizations, and detailed sales audit logs.

## When this fires
- Launching the sales analytics modal (`src/components/SalesAnalyticsModal.tsx`) from the header navigation.
- Viewing or exporting financial performance metrics and sales trends.
- Updating aggregation queries or chart visualizations.

## Inputs
- Finalized invoice records with associated creation timestamps, grand totals, payment methods, and eager-loaded line item categories (`plants` vs `non-plants`).
- Time range filters: `today`, `yesterday`, `week`, `month`, `year`, or custom `date`.
- Category filter: `all`, `plants`, `non-plants`.
- Metric toggles: `revenue` vs `count`.

## Git Safety (If Modifying Code)
- Develop analytics metrics on a separate feature branch (`feat/<feature-name>`).
- Verify timezone calculations, category allocation, and cash breakdown formulas before merging.
- Explicit confirmation required before merging into `main`.

## Tools / Scripts to Use
- Analytics endpoints: `src/app/api/sales/analytics/route.ts`.
- Type check: `python execution/run_typecheck.py`.
- Health check: `python execution/verify_project_health.py`.

## Outputs
- Clean, responsive analytics modal with interactive charts.
- Category sales filter (All Sales, Plants with Sprout icon, Non-Plants with Package icon).
- Dual split ratio bars: Payment Split (Online UPI/Card vs Cash vs Credit) and Category Split (Live Plants vs Non-Plants Goods).
- Adaptive KPI stat cards reflecting category-filtered revenue.
- Invoice breakdown table with explicit category tags (`Plants`, `Non-Plants`, `Mixed`) and effective category sales portion.
- Verified daily sales reconciliation summaries for nursery management.
- Complete bilingual support across all 12 preset filters, metric summaries, bar charts, donut charts, and invoice breakdown tables.

## Edge Cases & Error Handling
- **Plants vs Non-Plants Category Separation**:
  - Item category is determined by `invoiceItems.category` (with fallback to `stockItems.category` or `"plants"` for legacy records).
  - GST rates: Plants are 0% exempt under Indian GST law; non-plant items carry item-specific GST (e.g. 5%, 12%, 18%).
- **Proportional Discount Allocation for Mixed Bills**:
  - When an invoice contains both plants and non-plant goods alongside an invoice-level discount, the discount factor is computed as `discountFactor = Math.max(0, (totalGross - discountAmt) / totalGross)`.
  - Plant sales portion = `Math.round(plantGross * discountFactor * 100) / 100`.
  - Non-plant sales portion = `Math.max(0, Math.round((invoice.total - plantSalesPortion) * 100) / 100)`.
  - This ensures `plantSalesPortion + nonPlantSalesPortion === invoice.total` to the exact paisa with zero rounding drift.
- **Financial Metric Calculations**:
  - Total Gross Revenue, Net Revenue after discounts, Average Order Value (AOV).
  - Payment buckets: Cash (`cash`), Online (`online`, `upi`, `card`), and Credit (`credit`). Credit is a receivable and must not be included in the cash drawer total.
  - The analytics API returns `cashRevenue`/`cashCount`, `onlineRevenue`/`onlineCount`, and `creditRevenue`/`creditCount`; all chart, KPI, filter, donut, timeline, and table surfaces must use the same bucket mapping.
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


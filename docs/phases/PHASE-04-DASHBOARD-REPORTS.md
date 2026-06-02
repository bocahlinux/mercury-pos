# Phase 4 — Dashboard & Reports

> **Status**: ✅ Done
> **Completed**: June 2, 2026

## Tujuan
Dashboard interaktif dengan data real-time dan laporan lengkap dengan export capability.

## Deliverables

| Item | Status |
|------|--------|
| Dashboard stats (today/week/month) | ✅ |
| Comparison % (yesterday/prev week/prev month) | ✅ |
| Low stock alerts widget | ✅ (Flutter + Backend) |
| Sales trend chart (7 days) | ✅ (Web + Backend) |
| Payment method breakdown (pie) | ✅ (Web + Flutter + Backend) |
| Category sales breakdown (pie) | ✅ (Web + Backend) |
| Recent transactions widget | ✅ (Web + Flutter + Backend) |
| Recent invoices widget | ✅ (Web + Backend) |
| Sales report with filters | ✅ (Web + Flutter + Backend) |
| Product report with filters | ✅ (Web + Flutter + Backend) |
| Customer report | ✅ (Web + Flutter + Backend) |
| Excel export (sales/product/customer) | ✅ (Web + Backend) |
| Flutter Reports screen (3 tabs) | ✅ |
| Flutter Dashboard enhancements | ✅ |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/dashboard/` | Full dashboard data (summary, comparison, charts, low stock, recent) |
| GET | `/api/reports/sales-report/` | Sales report daily/weekly/monthly/yearly |
| GET | `/api/reports/product-report/` | Product performance report |
| GET | `/api/reports/customer-report/` | Customer spending report |
| GET | `/api/reports/sales-report/export/` | Export sales → Excel |
| GET | `/api/reports/product-report/export/` | Export products → Excel |
| GET | `/api/reports/customer-report/export/` | Export customers → Excel |

## Technical Notes
- Charts: `recharts` (web), native Flutter widgets (Flutter)
- Excel: `openpyxl` (backend)
- Date filters: `date_from`, `date_to`, `period`
- All export endpoints return `.xlsx` file download
- Dashboard response: backward-compatible (old fields still present, new fields added)

## Files Changed
- `backend/reports/views.py` — DashboardView enhanced, +CustomerReportView, +3 export views
- `backend/reports/urls.py` — +6 new endpoints
- `web/src/pages/dashboard/DashboardPage.tsx` — charts, new data fields
- `web/src/pages/reports/ReportsPage.tsx` — tabs, filters, Excel export, customer report
- `mobile/lib/api/api_client.dart` — +getSalesReport, getProductReport, getCustomerReport
- `mobile/lib/screens/dashboard/dashboard_screen.dart` — comparison %, low stock, payment breakdown, Reports tab
- `mobile/lib/screens/dashboard/reports_screen.dart` — **new file**, 3-tab reports screen

## Notes
- No breaking changes to Phase 0-3
- `openpyxl` is optional dependency (graceful fallback with 501 error)
- Flutter charts use native widgets (no external chart library needed for v1)
- Excel export uses bearer token auth via fetch/XHR

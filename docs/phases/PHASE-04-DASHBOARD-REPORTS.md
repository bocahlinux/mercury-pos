# Phase 4 — Dashboard & Reports

> **Status**: 🔄 Partial (basic dashboard done, advanced reports planned)
> **Target**: Setelah Phase 3 selesai

## Tujuan
Dashboard interaktif dengan data real-time dan laporan lengkap dengan export capability.

## Scope

### Dashboard Enhancement

#### Real-time Stats
- Today's sales & transaction count
- Week/month sales comparison
- vs previous period (% change)
- Low stock alerts count

#### Charts
- Sales trend chart (line/bar) — daily/weekly/monthly
- Top products chart (bar/pie)
- Payment method breakdown (pie)
- Category sales breakdown (pie)

#### Recent Activity
- Recent transactions list (10 items)
- Recent stock movements
- Recent invoices

### Reports Enhancement

#### Sales Report
- Group by: daily, weekly, monthly, yearly
- Filter by date range
- Summary: total sales, transaction count, avg transaction
- Chart visualization
- Export to Excel

#### Product Report
- Products sold per period
- Revenue per product
- Average selling price
- Stock movement summary
- Export to Excel

#### Customer Report
- Top customers by spending
- Customer transaction history
- Loyalty points summary

### Excel Export
- GET `/api/reports/sales-report/?export=xlsx`
- GET `/api/reports/product-report/?export=xlsx`
- Format: styled Excel with headers, totals row
- Library: `openpyxl`

## Technical Notes
- Charts: `recharts` (web), `fl_chart` (Flutter)
- Excel: `openpyxl` (backend)
- Date filters: `date_from`, `date_to`, `period`
- All report endpoints support both JSON and XLSX response

## Deliverables
| Item | Status |
|------|--------|
| Dashboard stats (basic) | ✅ |
| Dashboard charts | 📋 |
| Sales report with chart | 📋 |
| Product report with chart | 📋 |
| Customer report | 📋 |
| Excel export (sales) | 📋 |
| Excel export (product) | 📋 |
| Low stock alerts widget | 📋 |
| Dashboard (Flutter) | 📋 |
| Reports (Flutter) | 📋 |

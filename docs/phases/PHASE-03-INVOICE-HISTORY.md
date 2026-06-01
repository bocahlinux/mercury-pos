# Phase 3 — Invoice & History

> **Status**: 📋 Planned
> **Target**: Setelah Phase 2 selesai

## Tujuan
Implementasi invoice management lengkap, PDF generation, dan history transaksi.

## Scope

### Invoice Management

#### Invoice List (Web + Flutter)
- Filter by status: `pending`, `paid`, `overdue`, `cancelled`
- Filter by date range
- Search by invoice number
- Pagination

#### Invoice Detail
- Full invoice info: number, date, due date, customer, items, totals
- Status badge
- Action buttons: Mark as Paid, Cancel, Generate PDF

#### PDF Generation
- GET `/api/invoices/{id}/generate_pdf/`
- PDF content: store header, invoice info, item table, totals, footer
- Auto-download di browser
- Open in new tab option

### Transaction History

#### Transaction List (Web + Flutter)
- Filter by status: `completed`, `hold`, `cancelled`, `refunded`
- Filter by date range
- Filter by cashier
- Search by invoice number

#### Transaction Detail
- Full transaction info
- Item list with prices
- Payment info
- Action buttons: Hold, Cancel, Refund, Print Receipt

### Hold Transaction Flow
- Kasir bisa hold transaction (pause)
- Hold → resume → checkout
- Hold → cancel

### Refund Flow
- Full refund (semua item)
- Partial refund (item tertentu)
- Refund reason/note
- Stock auto-restore on refund

## Technical Notes
- PDF library: `reportlab` (backend)
- Invoice number: auto-generated, unique
- Due date: default +30 days from issue
- Overdue: auto-detect based on due_date

## Deliverables
| Item | Status |
|------|--------|
| Invoice list with filters (web) | 📋 |
| Invoice detail page (web) | 📋 |
| PDF generation + download | 📋 |
| Transaction history with filters (web) | 📋 |
| Transaction detail page (web) | ✅ (partial) |
| Hold/Resume flow | 📋 |
| Refund flow | 📋 |
| Invoice list (Flutter) | 📋 |
| Transaction history (Flutter) | 📋 |
